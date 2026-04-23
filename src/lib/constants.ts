/**
 * Interval between debounced incremental saves to the DB while a chat stream
 * is still running (used in `onStepFinish` inside `/api/chat/route.ts`).
 *
 * Units: milliseconds.
 * Range: 500–10_000 ms.
 * - Lower  → more writes to Prisma; smaller window of lost work if the server
 *            crashes mid-stream.
 * - Higher → less DB load, but higher risk of losing intermediate steps.
 * 2000 ms is the current balance: ~1 write every 2s during a typical stream.
 */
export const STEP_SAVE_INTERVAL_MS = 2000;

/**
 * Max number of steps (tool-call rounds) the Vercel AI SDK is allowed to run
 * in a single `streamText` call. A step = one model turn + its tool calls.
 *
 * Units: steps.
 * Range: 1–50. Practical: 8–20.
 * - Lower  → prevents infinite loops but may truncate long generations
 *            (many files created one at a time).
 * - Higher → allows complex iterative flows at the cost of possible runaway
 *            cost if the model enters a loop.
 */
export const MAX_TOOL_STEPS = 15;

/**
 * Ceiling on output tokens per model response (Anthropic's `maxOutputTokens`
 * parameter).
 *
 * Units: tokens.
 * Range: 1024–64_000 for current Claude Opus/Sonnet models.
 * - Lower  → responses get truncated when generating components or large lists.
 * - Higher → more latency and cost per request; rarely necessary above 20k.
 */
export const MAX_OUTPUT_TOKENS = 10_000;

/**
 * Compaction trigger for chat history (Haiku-backed summary).
 *
 * Tokens are estimated from characters using `chars/4`, which approximates
 * the Claude tokenizer within ~15%. When the serialized message payload
 * exceeds this threshold, a summary is generated to replace older messages.
 *
 * Units: estimated tokens.
 * Range: 5_000–80_000.
 * - Lower  → earlier summaries; more Haiku calls but smaller per-turn
 *            context (useful for smaller context windows).
 * - Higher → fewer summaries; risk of approaching the model's context window
 *            (Opus = 200k) before compacting. 20k leaves ample margin for
 *            tools, output tokens, and cache overhead.
 */
export const SUMMARY_TOKEN_THRESHOLD = 20_000;

/**
 * Minimum new messages since the last summary before re-summarizing. Acts as
 * a rate limit: once the token threshold is crossed, we don't want to
 * summarize on every consecutive turn.
 *
 * Units: new messages since the last summary.
 * Range: 2–10.
 */
export const SUMMARY_MIN_NEW_MESSAGES = 4;

/**
 * Divisor used to estimate tokens from characters. Claude's real tokenizer
 * averages ~3.5 chars per token for English + code; 4 is conservative
 * (slightly over-estimates), which we prefer to avoid crossing the context
 * window limit by accident.
 */
export const CHARS_PER_TOKEN_ESTIMATE = 4;
