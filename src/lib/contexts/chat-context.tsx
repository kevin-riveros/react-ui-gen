"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AppUIMessage } from "@/lib/chat/types";
import type { ImageAttachment } from "@/lib/chat/image-attachment";
import { toast } from "sonner";
import { useFileSystem } from "./file-system-context";
import { humanizeError } from "@/lib/chat/errors";
import { DEFAULT_MODEL_ID, type ModelId } from "@/lib/ai/models";
import {
  loadModelPreference,
  saveModelPreference,
} from "@/lib/storage/model-preference";

function humanizeChatError(msg: string): string {
  if (!msg) return "Could not connect to the server. Please try again.";
  // Transport/network failures only happen client-side; everything else
  // delegates to the shared server humanizer.
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed"))
    return "Could not connect to the server. Check your connection and try again.";
  return humanizeError(msg);
}

interface ChatContextProps {
  projectId?: string;
  initialMessages?: AppUIMessage[];
  initialPrompt?: string;
}

/** AI SDK v6 file UI part — `{type:"file"}` message fragment. */
interface ChatFilePart {
  type: "file";
  mediaType: string;
  url: string;
  filename?: string;
}

interface ChatContextType {
  messages: AppUIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  sendMessage: (opts: { text?: string; files?: ChatFilePart[] }) => void;
  stop: () => void;
  regenerate: () => void;
  status: string;
  isStreaming: boolean;
  /** Single image attached to the next outgoing message (or null). */
  attachment: ImageAttachment | null;
  /** Replace the pending attachment. Pass `null` to clear. */
  setAttachment: (a: ImageAttachment | null) => void;
  /** Currently selected Claude model id (sent with every chat request). */
  model: ModelId;
  /** Change the active model. Persists to localStorage. */
  setModel: (m: ModelId) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
  initialPrompt,
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  // Model state: starts at the default so SSR and first client render match
  // (no hydration mismatch), then syncs to the saved preference after mount.
  const [model, setModelState] = useState<ModelId>(DEFAULT_MODEL_ID);
  // Ref mirrors `model` so the transport's `body` callback (captured once
  // below with deps `[]`) can read the current value at send time.
  const modelRef = useRef<ModelId>(DEFAULT_MODEL_ID);

  useEffect(() => {
    const saved = loadModelPreference();
    // Hydration-safe localStorage sync: server and first client render both
    // use DEFAULT_MODEL_ID; we set the persisted value after mount. This is
    // exactly the pattern the lint rule warns against, but it's load-bearing
    // here — removing it re-introduces a hydration mismatch on the model
    // <select>.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModelState(saved);
    modelRef.current = saved;
  }, []);

  const setModel = useCallback((m: ModelId) => {
    setModelState(m);
    modelRef.current = m;
    saveModelPreference(m);
  }, []);

  // Transport is memoized with an empty dep list so it's created exactly once
  // per ChatProvider mount. `body` captures `fileSystem`, `projectId`, and
  // `modelRef` via closure — the first two are stable across renders within
  // a provider lifetime; the model is read through the ref so mid-session
  // changes take effect on the next send.
  const transport = useMemo(
    () =>
      // `modelRef.current` below is read inside the `body` callback at send
      // time, not during render — the lint rule can't distinguish the two.
      // eslint-disable-next-line react-hooks/refs
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          files: fileSystem.serialize(),
          projectId,
          model: modelRef.current,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    messages,
    setMessages,
    sendMessage: rawSendMessage,
    stop,
    regenerate,
    status,
  } = useAIChat<AppUIMessage>({
    id: projectId,
    transport,
    // Throttle message updates to ~20fps so mid-stream clicks on <details>
    // toggles aren't swallowed by every-token re-renders.
    experimental_throttle: 50,
    messages: initialMessages,
    onToolCall: ({ toolCall }) => {
      if (!("input" in toolCall)) return;
      handleToolCall({
        toolName: toolCall.toolName,
        args: toolCall.input as Record<string, unknown>,
      });
    },
    onError: (error: Error) => {
      console.error(`[chat] Error (model: ${modelRef.current}):`, error);

      const friendly = humanizeChatError(error.message);
      toast.error(friendly);

      // Append error as a visible assistant message in the chat
      setMessages((prev) => {
        // If the last message is an empty assistant message (from the failed stream), replace it
        const last = prev[prev.length - 1];
        if (
          last?.role === "assistant" &&
          (!last.parts.length ||
            last.parts.every(
              (p) => p.type === "step-start" || (p.type === "text" && !p.text)
            ))
        ) {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              parts: [{ type: "text" as const, text: `⚠️ ${friendly}` }],
            },
          ];
        }
        // Otherwise append a new assistant error message
        return [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: `⚠️ ${friendly}` }],
          },
        ];
      });
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Wrap the SDK's `sendMessage` so callers can use a single
  // `{text?, files?}` shape. The SDK's type union requires `text` on the
  // text-or-both branch and `files` on the files-only branch, so we
  // dispatch into the matching overload here.
  const sendMessage = useCallback(
    ({ text, files }: { text?: string; files?: ChatFilePart[] }) => {
      const trimmed = text?.trim() ?? "";
      if (trimmed && files && files.length > 0) {
        void rawSendMessage({ text: trimmed, files });
      } else if (files && files.length > 0) {
        void rawSendMessage({ files });
      } else if (trimmed) {
        void rawSendMessage({ text: trimmed });
      }
    },
    [rawSendMessage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Allow submit with only an attachment (no text) — the model still
      // gets useful signal from a dropped reference mock on its own.
      if (!input.trim() && !attachment) return;
      const files = attachment
        ? [
            {
              type: "file" as const,
              mediaType: attachment.mediaType,
              url: attachment.dataUrl,
              filename: attachment.filename,
            },
          ]
        : undefined;
      sendMessage({ text: input, files });
      setInput("");
      setAttachment(null);
    },
    [input, attachment, sendMessage]
  );

  // Auto-send initial prompt from query param and clean URL
  const initialPromptSent = useRef(false);
  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !initialPromptSent.current) {
      initialPromptSent.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("prompt");
      window.history.replaceState({}, "", url.pathname);
      sendMessage({ text: initialPrompt });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        sendMessage,
        stop,
        regenerate,
        status,
        isStreaming,
        attachment,
        setAttachment,
        model,
        setModel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function useOptionalChat() {
  return useContext(ChatContext) ?? null;
}
