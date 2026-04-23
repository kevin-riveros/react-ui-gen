import {
  CHARS_PER_TOKEN_ESTIMATE,
  SUMMARY_MIN_NEW_MESSAGES,
  SUMMARY_TOKEN_THRESHOLD,
} from "@/lib/constants";
import type { AppUIMessage } from "./types";

/**
 * Decide whether to run summarization after the current turn. Token estimate
 * is `chars / 4` (conservative, over-estimates by ~15%). The rate-limit on
 * `minNewMessages` prevents re-summarizing every turn once the threshold is
 * crossed.
 */
export function shouldSummarize(params: {
  serializedMessages: string;
  allMessages: AppUIMessage[];
  summaryMessageId: string | null;
}): boolean {
  const { serializedMessages, allMessages, summaryMessageId } = params;

  const chatMsgCount = allMessages.filter((m) => m.role !== "system").length;
  const summaryIdx = summaryMessageId
    ? allMessages.findIndex((m) => m.id === summaryMessageId)
    : -1;
  const newMsgsSinceSummary =
    summaryIdx >= 0 ? allMessages.length - summaryIdx - 1 : chatMsgCount;

  const estimatedTokens = Math.ceil(
    serializedMessages.length / CHARS_PER_TOKEN_ESTIMATE
  );

  return (
    estimatedTokens >= SUMMARY_TOKEN_THRESHOLD &&
    newMsgsSinceSummary >= SUMMARY_MIN_NEW_MESSAGES
  );
}
