"use client";

import { memo } from "react";
import { Image as ImageIcon, Loader2, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { AppUIMessage } from "@/lib/chat/types";
import { getBrand } from "@/lib/config/client";

const chatPlaceholder = getBrand().chatPlaceholder;

type MessagePart = AppUIMessage["parts"][number];

/** True if the part is one of the registered tool-call parts (not text / reasoning / step-start). */
function isToolPart(part: MessagePart): part is Extract<
  MessagePart,
  { type: `tool-${string}` } | { type: "dynamic-tool" }
> {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

/**
 * Narrow to the SDK's `file` UI part. Typed structurally because the AI SDK
 * v6 union doesn't export a dedicated `FileUIPart` on our message type.
 */
interface FileUIPart {
  type: "file";
  mediaType?: string;
  url?: string;
  filename?: string;
}
function isFilePart(part: MessagePart): part is MessagePart & FileUIPart {
  return part.type === "file";
}

/**
 * Minimum data-URL length we treat as "has pixels". Bare prefixes like
 * `data:image/png;base64,` slip past a simple length check but render as
 * an empty white box — show the placeholder instead so nothing appears
 * broken in the transcript.
 */
const MIN_RENDERABLE_DATA_URL_LEN = 200;

/**
 * Thumbnail (or stripped-data placeholder) for a `file` part. We only
 * render image MIME types visually; anything else degrades to a chip.
 */
function FilePartThumbnail({ part }: { part: FileUIPart }) {
  const isImage = part.mediaType?.startsWith("image/");
  const hasData =
    typeof part.url === "string" && part.url.length > MIN_RENDERABLE_DATA_URL_LEN;

  if (isImage && hasData) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={part.url}
        alt={part.filename ?? "attached image"}
        className="max-h-32 max-w-full w-auto rounded-lg border border-neutral-200 bg-white object-contain"
      />
    );
  }

  // Post-persistence placeholder: url was stripped by the server to keep
  // the Prisma row small, so we only know the filename + mediaType.
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
      <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
      <span className="font-medium">
        {part.filename || "Image attached"}
      </span>
      <span className="text-neutral-400">(not stored)</span>
    </div>
  );
}

function getToolSummary(part: MessagePart): { name: string; subject: string } {
  if (!isToolPart(part)) return { name: part.type, subject: "" };
  const name =
    "toolName" in part && part.toolName
      ? part.toolName
      : part.type.replace("tool-", "");
  // Tool input shapes are known (see AppTools), but at the render layer we
  // only need a short "subject" label — grab whichever common path-like field
  // the invoked tool has.
  const input = "input" in part ? (part.input as Record<string, unknown>) : {};
  const subject =
    (input?.path as string | undefined) ??
    (input?.file_path as string | undefined) ??
    (input?.name as string | undefined) ??
    (input?.pattern as string | undefined) ??
    "";
  return { name, subject };
}

/** Inline status line while the assistant is still working. */
function WorkingIndicator({ parts }: { parts: AppUIMessage["parts"] }) {
  let activity = "Thinking…";
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (isToolPart(part)) {
      const state = "state" in part ? part.state : undefined;
      if (state !== "output-available") {
        const { name, subject } = getToolSummary(part);
        activity = subject ? `${name} · ${subject}` : `Using ${name}…`;
        break;
      }
    }
    if (part.type === "step-start") {
      activity = "Next step…";
      break;
    }
  }

  const hasText = parts.some((p) => p.type === "text" && p.text);
  if (hasText && activity === "Thinking…") activity = "Still working…";

  return (
    <div className="mt-2 flex items-center gap-2 text-neutral-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span className="text-xs">{activity}</span>
    </div>
  );
}

/** Collapsed-by-default card for a single tool invocation. */
function ToolPart({
  part,
}: {
  part: Extract<MessagePart, { type: `tool-${string}` } | { type: "dynamic-tool" }>;
}) {
  const { name, subject } = getToolSummary(part);
  const state = "state" in part ? part.state : undefined;
  const isDone = state === "output-available";
  const input = "input" in part ? part.input : undefined;
  const output = "output" in part ? part.output : undefined;

  return (
    <details className="group -ml-1 my-0.5">
      <summary className="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-600 hover:text-neutral-900 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3 w-3 shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
        {isDone ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        ) : (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
        )}
        <span className="font-medium">{name}</span>
        {subject && (
          <span className="truncate font-mono text-xs text-neutral-500">
            {subject}
          </span>
        )}
      </summary>
      <div className="mt-1 mb-2 ml-5 space-y-2">
        {input !== undefined && input !== null && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Input
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-neutral-50 p-2 font-mono text-[11px] text-neutral-700">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
        )}
        {output !== undefined && output !== null && (
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Result
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-neutral-50 p-2 font-mono text-[11px] text-neutral-700">
              {typeof output === "string"
                ? output
                : JSON.stringify(output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

/** Collapsed-by-default accordion for reasoning (Anthropic extended thinking). */
function ReasoningPart({ part }: { part: Extract<MessagePart, { type: "reasoning" }> }) {
  return (
    <details className="group -ml-1 my-1">
      <summary className="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-500 hover:text-neutral-800 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3 w-3 shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
        <span className="italic">Thought</span>
      </summary>
      <div className="mt-1 ml-5 whitespace-pre-wrap border-l-2 border-neutral-200 pl-3 text-sm text-neutral-600">
        {part.text}
      </div>
    </details>
  );
}

interface MessageItemProps {
  message: AppUIMessage;
  isLast: boolean;
  isLoading?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}

const MessageItem = memo(function MessageItem({
  message,
  isLast,
  isLoading,
  canRegenerate,
  onRegenerate,
}: MessageItemProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] min-w-0 rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 flex flex-col gap-2 break-words">
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <span key={i} className="whitespace-pre-wrap">
                  {part.text}
                </span>
              );
            }
            if (isFilePart(part)) {
              return <FilePartThumbnail key={i} part={part} />;
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm text-neutral-900 min-w-0 break-words">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <MarkdownRenderer key={i} content={part.text} className="prose-sm" />
          );
        }
        if (part.type === "reasoning") {
          return <ReasoningPart key={i} part={part} />;
        }
        if (part.type === "step-start") {
          return i > 0 ? <div key={i} className="h-2" /> : null;
        }
        if (isToolPart(part)) {
          return <ToolPart key={i} part={part} />;
        }
        if (isFilePart(part)) {
          return <FilePartThumbnail key={i} part={part} />;
        }
        return null;
      })}
      {isLoading && isLast && <WorkingIndicator parts={message.parts} />}
      {canRegenerate && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </button>
      )}
    </div>
  );
});

interface MessageListProps {
  messages: AppUIMessage[];
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export function MessageList({ messages, isLoading, onRegenerate }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Sparkles className="h-6 w-6 text-neutral-700" />
        </div>
        <p className="mb-2 text-lg font-semibold text-neutral-900">
          What do you want to build?
        </p>
        <p className="max-w-sm text-sm text-neutral-500">
          {chatPlaceholder}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const canRegenerate =
            isLast && message.role === "assistant" && !isLoading;
          return (
            <MessageItem
              key={message.id || `msg-${index}`}
              message={message}
              isLast={isLast}
              isLoading={isLoading}
              canRegenerate={canRegenerate}
              onRegenerate={onRegenerate}
            />
          );
        })}
      </div>
    </div>
  );
}
