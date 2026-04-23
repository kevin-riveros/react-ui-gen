"use client";

import { useMemo } from "react";
import { useChat } from "@/lib/contexts/chat-context";

/** Derive stats from messages client-side */
function useDerivedStats() {
  const { messages, isStreaming, status } = useChat();

  return useMemo(() => {
    let steps = 0;
    let toolCalls = 0;
    let activeTool: string | null = null;

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (part.type === "step-start") steps++;
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          toolCalls++;
          const state = "state" in part ? part.state : undefined;
          if (state !== "output-available") {
            const input =
              "input" in part
                ? (part.input as Record<string, unknown> | undefined)
                : undefined;
            const toolName = "toolName" in part ? part.toolName : undefined;
            activeTool =
              (input?.path as string | undefined) ||
              (input?.file_path as string | undefined) ||
              toolName ||
              part.type.replace("tool-", "");
          }
        }
      }
    }

    return { steps, toolCalls, activeTool, isStreaming, status };
  }, [messages, isStreaming, status]);
}

/** Stat pill */
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-mono text-neutral-500">
      <span className="text-neutral-400">{label}</span>
      {value}
    </span>
  );
}

export function StreamStatsBar() {
  const { steps, toolCalls, activeTool, isStreaming, status } = useDerivedStats();

  // Always show if there are messages with steps
  if (steps === 0 && !isStreaming) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-1 py-1">
      {/* Steps */}
      <Pill label="steps:" value={String(steps)} />

      {/* Tool calls */}
      {toolCalls > 0 && <Pill label="tools:" value={String(toolCalls)} />}

      {/* Divider */}
      <span className="text-neutral-200">|</span>

      {/* Status indicator */}
      {isStreaming && (
        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {activeTool ? `using ${activeTool}` : status === "submitted" ? "thinking..." : "streaming"}
        </span>
      )}
      {!isStreaming && steps > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          done
        </span>
      )}
    </div>
  );
}
