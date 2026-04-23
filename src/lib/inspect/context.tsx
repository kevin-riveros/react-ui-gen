"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useChat } from "@/lib/contexts/chat-context";
import type {
  InspectSelection,
  InspectIframeMessage,
  SelectedElement,
  SelectedRegion,
} from "./types";

interface InspectContextType {
  isInspectMode: boolean;
  toggleInspectMode: () => void;
  selection: InspectSelection | null;
  clearSelection: () => void;
  sendAnnotatedMessage: (instruction: string) => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** Current CSS transform scale on the iframe, needed for overlay math. */
  scale: number;
  setScale: (s: number) => void;
}

const InspectContext = createContext<InspectContextType | undefined>(undefined);

export function InspectProvider({ children }: { children: ReactNode }) {
  const { sendMessage } = useChat();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [selection, setSelection] = useState<InspectSelection | null>(null);
  const [scale, setScale] = useState(1);

  const sendModeToIframe = useCallback((enabled: boolean) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "inspect-mode", enabled },
      "*"
    );
  }, []);

  const toggleInspectMode = useCallback(() => {
    setIsInspectMode((prev) => {
      const next = !prev;
      sendModeToIframe(next);
      if (!next) setSelection(null);
      return next;
    });
  }, [sendModeToIframe]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "clear-selection" },
      "*"
    );
  }, []);

  useEffect(() => {
    function handleMessage(e: MessageEvent<InspectIframeMessage>) {
      if (e.data?.type === "element-selected") {
        setSelection({ type: "element", data: e.data.payload });
      } else if (e.data?.type === "region-selected") {
        setSelection({ type: "region", data: e.data.payload });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Re-arm inspect mode after every iframe reload; stale selection is dropped.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      if (isInspectMode) sendModeToIframe(true);
      setSelection(null);
    };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [isInspectMode, sendModeToIframe]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isInspectMode) {
        setIsInspectMode(false);
        sendModeToIframe(false);
        setSelection(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isInspectMode, sendModeToIframe]);

  const sendAnnotatedMessage = useCallback(
    (instruction: string) => {
      if (!selection) return;
      const context =
        selection.type === "element"
          ? formatElementContext(selection.data)
          : formatRegionContext(selection.data);
      sendMessage({ text: `${instruction}\n\n---\n${context}` });
      clearSelection();
      setIsInspectMode(false);
      sendModeToIframe(false);
    },
    [selection, sendMessage, clearSelection, sendModeToIframe]
  );

  return (
    <InspectContext.Provider
      value={{
        isInspectMode,
        toggleInspectMode,
        selection,
        clearSelection,
        sendAnnotatedMessage,
        iframeRef,
        scale,
        setScale,
      }}
    >
      {children}
    </InspectContext.Provider>
  );
}

export function useInspect() {
  const ctx = useContext(InspectContext);
  if (!ctx) throw new Error("useInspect must be used within an InspectProvider");
  return ctx;
}

function formatElementContext(el: SelectedElement): string {
  const lines = ["Selected element:"];
  if (el.sourceComponent && el.sourceFile) {
    lines.push(
      `- Component: ${el.sourceComponent} (${el.sourceFile}${el.sourceLine ? `, line ${el.sourceLine}` : ""})`
    );
  } else if (el.sourceFile) {
    lines.push(
      `- File: ${el.sourceFile}${el.sourceLine ? `, line ${el.sourceLine}` : ""}`
    );
  }
  const classAttr = el.className ? ` class="${el.className}"` : "";
  lines.push(`- Element: <${el.tagName}${classAttr}>`);
  lines.push(`- Selector: ${el.cssSelector}`);
  if (el.textContent) {
    const text =
      el.textContent.length > 80
        ? el.textContent.slice(0, 80) + "..."
        : el.textContent;
    lines.push(`- Content: "${text}"`);
  }
  return lines.join("\n");
}

function formatRegionContext(region: SelectedRegion): string {
  const n = region.elements.length;
  const lines = [`Selected region (${n} element${n !== 1 ? "s" : ""}):`];
  for (const el of region.elements.slice(0, 10)) {
    const comp = el.sourceComponent || el.tagName;
    const file = el.sourceFile
      ? ` (${el.sourceFile}${el.sourceLine ? ":" + el.sourceLine : ""})`
      : "";
    const cls = el.className ? `.${el.className.split(" ")[0]}` : "";
    lines.push(`- <${el.tagName}${cls}> in ${comp}${file}`);
  }
  if (n > 10) lines.push(`- ... and ${n - 10} more`);
  return lines.join("\n");
}
