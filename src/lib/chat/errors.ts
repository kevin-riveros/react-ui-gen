import { generateId } from "ai";
import type { AppUIMessage } from "./types";

/**
 * Extract a short, human-readable message from whatever an upstream throw
 * surfaced. The AI SDK frequently rejects with `APICallError`-style objects
 * that are not `instanceof Error`, which would otherwise stringify to
 * "[object Object]" and end up persisted to the DB.
 *
 * Tries, in order: native Error message, common AI-SDK/Anthropic shapes
 * (`error.message`, `responseBody`, `statusText`), any `message` string on
 * the object, then JSON.stringify as a last resort. The first non-empty
 * line is returned and truncated to 500 chars so stack traces never reach
 * the DB.
 */
export function extractErrorMessage(err: unknown): string {
  const firstLine = (s: string) => s.split("\n")[0].trim().slice(0, 500);

  if (err instanceof Error && err.message) return firstLine(err.message);
  if (typeof err === "string") return firstLine(err);
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    // Anthropic-style: { error: { message, type } } or { error: "text" }
    const inner = e.error;
    if (typeof inner === "string") return firstLine(inner);
    if (inner && typeof inner === "object") {
      const m = (inner as Record<string, unknown>).message;
      if (typeof m === "string" && m) return firstLine(m);
    }
    // AI SDK APICallError: prefer statusText + url, fall back to responseBody.
    if (typeof e.message === "string" && e.message) return firstLine(e.message);
    if (typeof e.statusText === "string" && e.statusText) {
      const status = typeof e.statusCode === "number" ? `${e.statusCode} ` : "";
      return firstLine(`${status}${e.statusText}`);
    }
    if (typeof e.responseBody === "string" && e.responseBody)
      return firstLine(e.responseBody);
    try {
      return firstLine(JSON.stringify(err));
    } catch {
      // fall through
    }
  }
  return "Unknown error";
}

/** Map raw extracted messages to a user-facing string. */
export function humanizeError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("credit") || m.includes("billing") || m.includes("429"))
    return "No API credits remaining. Please check your Anthropic billing.";
  if (
    m.includes("401") ||
    m.includes("403") ||
    m.includes("auth") ||
    m.includes("x-api-key") ||
    m.includes("api key") ||
    m.includes("api_key")
  )
    return "Invalid or expired API key. Check your ANTHROPIC_API_KEY in .env";
  if (m.includes("timeout") || m.includes("etimedout"))
    return "Request timed out. Please try again.";
  if (m.includes("rate") || m.includes("throttle"))
    return "Rate limited by the API. Please wait a moment and try again.";
  if (m.includes("overloaded") || m.includes("529"))
    return "The model is temporarily overloaded. Please try again.";
  return msg || "An unexpected error occurred.";
}

/**
 * Build a persisted assistant-message representing a streaming failure.
 * Appended to the `messages` array in `onError` so the user sees the error
 * after a reload. Flagged with `metadata.isError = true` so `isErrorMessage`
 * below can filter it out of the next model call.
 */
export function buildErrorMessage(rawError: string): AppUIMessage {
  return {
    id: generateId(),
    role: "assistant",
    parts: [{ type: "text", text: `⚠️ **Error:** ${humanizeError(rawError)}` }],
    metadata: { isError: true, createdAt: Date.now() },
  };
}

/**
 * Returns true if the given AppUIMessage is the error-stub persisted by
 * `buildErrorMessage`. These show up on reload but must be excluded from
 * the next `streamText` call — otherwise the model sees its own past
 * failures as conversational context.
 */
export function isErrorMessage(m: AppUIMessage): boolean {
  return m.metadata?.isError === true;
}

/** True for AbortError / client-disconnect errors (not real failures). */
export function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || /abort/i.test(err.message);
}
