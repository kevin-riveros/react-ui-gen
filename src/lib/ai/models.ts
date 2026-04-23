/**
 * Canonical list of Anthropic models exposed in the chat UI.
 *
 * Purpose: single source of truth for both client (select UI, localStorage
 * validation) and server (`z.enum(...)` allowlist in request-schema). Adding
 * or removing a model here automatically updates the dropdown, the persisted
 * preference validator, and the server-side 400 check.
 *
 * Valid range: any Claude model id supported by `@ai-sdk/anthropic`. Today we
 * expose the three latest generations (Opus/Sonnet/Haiku 4.x). Trade-off: a
 * tighter allowlist rejects unreleased or deprecated ids at the edge, which
 * costs us a code change whenever Anthropic ships a new model — we accept
 * that in exchange for not paying for surprise tokens against models we
 * haven't validated.
 */
export const AVAILABLE_MODELS = [
  {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    description: "Most capable — best for complex reasoning",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    description: "Balanced speed and capability",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    description: "Fastest and cheapest",
  },
] as const;

/**
 * Tuple of just the ids, derived from `AVAILABLE_MODELS`. Needed because
 * `z.enum(...)` requires a readonly string tuple, not an array of objects.
 */
export const MODEL_IDS = AVAILABLE_MODELS.map((m) => m.id) as unknown as readonly [
  (typeof AVAILABLE_MODELS)[number]["id"],
  ...(typeof AVAILABLE_MODELS)[number]["id"][]
];

/** Union of the allowed model id strings. */
export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

/**
 * Default model when the user has no saved preference.
 *
 * Purpose: balance cost vs. quality for first-time visitors. Sonnet 4.6 is
 * the middle tier and the one we recommend for most prompts. Trade-off:
 * users who want max quality must opt into Opus explicitly (and pay more);
 * users who want lowest latency opt into Haiku.
 */
export const DEFAULT_MODEL_ID: ModelId = "claude-sonnet-4-6";

/** Type guard for narrowing arbitrary strings (e.g. from localStorage) to `ModelId`. */
export function isValidModelId(id: unknown): id is ModelId {
  return typeof id === "string" && (MODEL_IDS as readonly string[]).includes(id);
}
