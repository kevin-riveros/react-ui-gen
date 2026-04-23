"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { useChat } from "@/lib/contexts/chat-context";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { shouldLoadTailwind } from "@/lib/config/client";
import { AlertCircle, Sparkles } from "lucide-react";

// Module-level store for preview runtime errors posted by the iframe.
// Using an external store (subscribed via `useSyncExternalStore`) instead of
// a `useEffect` + listener per component so the message handler is attached
// exactly once regardless of how many PreviewFrame instances mount.
let latestPreviewError: string | null = null;
const previewErrorSubscribers = new Set<() => void>();

function notifyPreviewErrorSubscribers() {
  for (const notify of previewErrorSubscribers) notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("message", (e: MessageEvent) => {
    const data = e.data as
      | { type?: string; message?: string; stack?: string | null }
      | null;
    if (data?.type === "uigen-preview-error" && typeof data.message === "string") {
      // `stack` (when present) starts with the error type + message then
      // appends the trace, so it always supersedes `message` — picking one
      // avoids the duplicate-text problem of concatenating them.
      latestPreviewError =
        typeof data.stack === "string" && data.stack.length > 0
          ? data.stack
          : data.message;
      notifyPreviewErrorSubscribers();
    }
  });
}

function subscribePreviewError(notify: () => void) {
  previewErrorSubscribers.add(notify);
  return () => {
    previewErrorSubscribers.delete(notify);
  };
}

function getPreviewError(): string | null {
  return latestPreviewError;
}

function clearPreviewError() {
  if (latestPreviewError !== null) {
    latestPreviewError = null;
    notifyPreviewErrorSubscribers();
  }
}

function extractCssContent(files: Map<string, string>): string {
  let css = "";
  for (const [path, content] of files) {
    if (path.endsWith(".css")) {
      css += `/* ${path} */\n${content}\n`;
    }
  }
  return css;
}

/**
 * Window of time (ms) during which we keep re-applying the captured scroll
 * position after the iframe reloads. Needed because `onLoad` fires when the
 * document is ready, but the React tree inside may still be mounting async —
 * if the doc isn't tall enough yet, a single `scrollTo` clamps to the current
 * `scrollHeight` and the user ends up short of where they were. 300ms covers
 * HeroUI-sized trees on a mid-tier laptop without feeling like a fight if the
 * user actively scrolls during the window.
 */
const SCROLL_RESTORE_DURATION_MS = 300;

function restoreScrollUntilDeadline(
  win: Window,
  target: { x: number; y: number },
  deadline: number,
) {
  win.scrollTo(target.x, target.y);
  if (performance.now() < deadline) {
    requestAnimationFrame(() =>
      restoreScrollUntilDeadline(win, target, deadline),
    );
  }
}


interface PreviewFrameProps {
  externalIframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

const POSSIBLE_ENTRY_POINTS = [
  "/App.jsx",
  "/App.tsx",
  "/index.jsx",
  "/index.tsx",
  "/src/App.jsx",
  "/src/App.tsx",
];

/**
 * Find the first file path that looks like a React entry point.
 * Falls back to the first `.jsx`/`.tsx` file, or `null` if none.
 */
function findEntryPoint(files: Map<string, string>): string | null {
  const preferred = POSSIBLE_ENTRY_POINTS.find((path) => files.has(path));
  if (preferred) return preferred;
  for (const path of files.keys()) {
    if (path.endsWith(".jsx") || path.endsWith(".tsx")) return path;
  }
  return null;
}

export function PreviewFrame({ externalIframeRef }: PreviewFrameProps) {
  const localRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef ?? localRef;
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const { sendMessage, isStreaming } = useChat();
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dsTailwindConfig, setDsTailwindConfig] = useState<string>("");

  // Blob URLs allocated by the last `createImportMap()` call. We revoke them
  // before building a new preview (and on unmount) so the browser can reclaim
  // the underlying JS source buffers — otherwise long sessions leak memory
  // monotonically.
  const previousBlobUrlsRef = useRef<string[]>([]);

  // Scroll position captured from the iframe's old document right before we
  // swap in a new srcdoc. Consumed on the next `onLoad` so the user lands
  // back where they were reading instead of being thrown to the top on every
  // edit.
  const pendingScrollRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch the raw DS tailwind config CSS once on mount.
  // This contains @theme static, @utility, @layer base directives that
  // @tailwindcss/browser will process with correct cascade layer ordering.
  // Skipped entirely for DS's that don't use Tailwind (e.g. Material UI).
  useEffect(() => {
    if (!shouldLoadTailwind()) return;
    fetch("/packages/ds-tailwind-config.css")
      .then((res) => (res.ok ? res.text() : ""))
      .then(setDsTailwindConfig)
      .catch(() => setDsTailwindConfig(""));
  }, []);

  // Subscribe to errors posted from inside the preview iframe — both compile
  // errors (rendered as `.syntax-errors`) and runtime errors (caught by
  // `loadApp()` / the React ErrorBoundary). The iframe posts
  // `{ type: 'uigen-preview-error', message, stack? }` whenever it fails
  // to render. We read it via `useSyncExternalStore` against the module-
  // level store so the listener lives outside of React's effect graph.
  const runtimeError = useSyncExternalStore(
    subscribePreviewError,
    getPreviewError,
    () => null
  );

  const handleFixWithAgent = useCallback(() => {
    const errorText = runtimeError ?? error;
    if (!errorText || isStreaming) return;
    sendMessage({ text: `Fix this error: ${errorText}` });
    clearPreviewError();
  }, [runtimeError, error, isStreaming, sendMessage]);

  const updatePreview = useCallback(async () => {
    try {
      const files = getAllFiles();

      if (files.size > 0 && error) {
        setError(null);
      }

      if (files.size === 0) {
        if (isFirstLoad) {
          setError("firstLoad");
        } else {
          setError("No files to preview");
        }
        return;
      }

      if (isFirstLoad) {
        setIsFirstLoad(false);
      }

      const foundEntryPoint = findEntryPoint(files);
      if (!foundEntryPoint) {
        setError(
          "No React component found. Create an App.jsx or index.jsx file to get started."
        );
        return;
      }

      setIsLoading(true);

      const userCss = extractCssContent(files);

      const { importMap, styles, errors, blobUrls } = createImportMap(files);

      // Revoke the blob URLs from the previous render before replacing them.
      // Doing it here (not after) guarantees the just-installed iframe has
      // already parsed the old URLs; the new srcdoc below will only reference
      // the new set.
      previousBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previousBlobUrlsRef.current = blobUrls;

      const previewHTML = createPreviewHTML(
        foundEntryPoint,
        importMap,
        styles,
        errors,
        "",
        userCss,
        dsTailwindConfig
      );

      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-forms"
        );
        // Capture where the user was reading before we blow away the old
        // document. `contentWindow` can throw in edge cases (cross-origin
        // nav, detached frame) — swallow and skip restore rather than fail
        // the refresh.
        try {
          const win = iframe.contentWindow;
          if (win) {
            pendingScrollRef.current = { x: win.scrollX, y: win.scrollY };
          }
        } catch {
          pendingScrollRef.current = null;
        }
        iframe.srcdoc = previewHTML;
        setError(null);
        // Clear any prior iframe-reported runtime error. If the new preview
        // also fails, the iframe will post a fresh error back to us.
        clearPreviewError();
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : "Unknown preview error");
    }
  }, [getAllFiles, error, isFirstLoad, dsTailwindConfig, iframeRef]);

  useEffect(() => {
    // Genuinely syncing React state to an external system (the iframe DOM +
    // blob URLs). updatePreview's internal setState calls (setError,
    // setIsLoading) reflect work outside of React's control and can't be
    // hoisted into a render body or event handler.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updatePreview();
  }, [refreshTrigger, updatePreview]);

  // Revoke any leftover blob URLs when the component unmounts — otherwise a
  // navigation away from the editor page would leak the last preview's JS.
  useEffect(() => {
    return () => {
      previousBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previousBlobUrlsRef.current = [];
    };
  }, []);

  if (error) {
    if (error === "firstLoad") {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-white">
          <div className="flex h-[500px] w-full max-w-4xl items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-lg text-gray-400">Your prototype will appear here</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Preview Available
          </h3>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">
            Start by creating a React component using the AI assistant
          </p>
          <button
            type="button"
            onClick={handleFixWithAgent}
            disabled={isStreaming}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            Fix with the agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
            <p className="text-sm text-gray-500">Building preview...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 bg-white"
        title="Preview"
        onLoad={() => {
          setIsLoading(false);
          const target = pendingScrollRef.current;
          pendingScrollRef.current = null;
          if (!target || (target.x === 0 && target.y === 0)) return;
          const win = iframeRef.current?.contentWindow;
          if (!win) return;
          restoreScrollUntilDeadline(
            win,
            target,
            performance.now() + SCROLL_RESTORE_DURATION_MS,
          );
        }}
      />
      {runtimeError && (
        <div className="absolute bottom-4 right-4 z-20 max-w-sm rounded-lg border border-red-200 bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">Preview failed to render</p>
              <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{runtimeError.split("\n")[0]}</p>
              <button
                type="button"
                onClick={handleFixWithAgent}
                disabled={isStreaming}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Fix with the agent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
