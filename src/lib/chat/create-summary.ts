import { generateText } from "ai";
import type { AppUIMessage } from "./types";
import { anthropic } from "@ai-sdk/anthropic";
import { wrapLanguageModel } from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { aiDebugMiddleware, shouldEnableAiDebug } from "@/lib/ai-debug-middleware";

const SUMMARY_SYSTEM_PROMPT = `You are a technical assistant. Summarize the conversation concisely using this format:

# Project Overview
- **Project**: {name} - {brief description}
- **Tech Stack**: {frameworks, libraries used}

# Implementation Status
- **Completed**: {what's been built}
- **Current State**: {what the app looks like now}
- **Recent Changes**: {latest modifications}

# Key Decisions
- {important decisions made during the conversation}

# Next Actions
- {what the user likely wants next}

Be concise. Focus on facts that help continue the conversation without full history.`;

interface SummaryInput {
  messages: AppUIMessage[];
  previousSummary?: string | null;
  summaryMessageId?: string | null;
}

/** Flatten an AppUIMessage's text parts back into a plain string. */
function partsToText(message: AppUIMessage): string {
  return message.parts
    .filter((p): p is Extract<AppUIMessage["parts"][number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export async function createChatSummary({
  messages,
  previousSummary,
  summaryMessageId,
}: SummaryInput): Promise<{ summary: string; lastMessageId: string }> {
  const chatMessages = messages.filter((m) => m.role !== "system");

  if (chatMessages.length === 0) {
    return { summary: "", lastMessageId: "" };
  }

  let newMessages = chatMessages;
  if (summaryMessageId) {
    const idx = chatMessages.findIndex((m) => m.id === summaryMessageId);
    if (idx >= 0) {
      newMessages = chatMessages.slice(idx + 1);
    }
  }

  if (newMessages.length < 2) {
    return {
      summary: previousSummary || "",
      lastMessageId: summaryMessageId || "",
    };
  }

  const simplified = newMessages.map((m) => {
    let content = partsToText(m);
    if (m.role === "assistant" && content.length > 500) {
      content = content.slice(0, 500) + "\n[...truncated]";
    }
    return `[${m.role}] ${content}`;
  });

  const lastMessageId = chatMessages[chatMessages.length - 1]?.id || "";

  // Use Opus for summaries
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { summary: previousSummary || "", lastMessageId: summaryMessageId || "" };
  }
  // Use Haiku for summaries — much cheaper than Opus, sufficient for structured summarization
  const baseModel = anthropic("claude-haiku-4-5-20251001") as unknown as LanguageModelV3;
  const model = shouldEnableAiDebug
    ? (wrapLanguageModel({ model: baseModel, middleware: aiDebugMiddleware }) as unknown as LanguageModelV3)
    : baseModel;

  try {
    // Structured `system` with `cacheControl: ephemeral` so the static
    // summarization rubric is served from Anthropic's prompt cache after the
    // first request instead of being billed as fresh input tokens each turn.
    const userPrompt = `${
      previousSummary
        ? `Previous summary:\n${previousSummary}\n\n---\nNew messages since then:\n`
        : "Full conversation:\n"
    }${simplified.join("\n\n")}`;

    const result = await generateText({
      model,
      messages: [
        {
          role: "system",
          content: SUMMARY_SYSTEM_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        { role: "user", content: userPrompt },
      ],
      maxOutputTokens: 500,
    });

    return {
      summary: result.text,
      lastMessageId,
    };
  } catch (error) {
    console.error("[create-summary] Failed to generate summary:", error);
    return {
      summary: previousSummary || "",
      lastMessageId: summaryMessageId || "",
    };
  }
}

/**
 * Builds the messages array for the API, using summary to replace old messages.
 * Keeps: system prompt + summary context + recent messages after summary point.
 */
export function buildMessagesWithSummary(
  messages: AppUIMessage[],
  summary: string | null,
  summaryMessageId: string | null
): AppUIMessage[] {
  if (!summary || !summaryMessageId) {
    return messages;
  }

  const systemMessages = messages.filter((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const idx = chatMessages.findIndex((m) => m.id === summaryMessageId);
  if (idx < 0) {
    return messages;
  }

  const recentMessages = chatMessages.slice(idx + 1);
  if (chatMessages.length - recentMessages.length < 2) {
    return messages;
  }

  const MAX_RECENT = 6;
  const cappedRecent =
    recentMessages.length > MAX_RECENT
      ? recentMessages.slice(-MAX_RECENT)
      : recentMessages;

  // Inline the summary into the first recent message instead of injecting a
  // synthetic user/assistant pair. Saves ~80 tokens per turn (no placeholder
  // "Understood..." response) and avoids consecutive same-role turns, which
  // Anthropic rejects.
  const [first, ...rest] = cappedRecent;
  const withSummary: AppUIMessage = first
    ? {
        ...first,
        parts: [
          {
            type: "text",
            text: `[Context from previous conversation]\n${summary}\n\n---\n`,
          },
          ...first.parts,
        ],
      }
    : ({
        id: "summary-user",
        role: "user",
        parts: [
          {
            type: "text",
            text: `[Context from previous conversation]\n${summary}`,
          },
        ],
      } as AppUIMessage);

  return [...systemMessages, withSummary, ...rest];
}
