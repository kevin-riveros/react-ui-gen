import { anthropic } from "@ai-sdk/anthropic";
import { wrapLanguageModel } from "ai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { MockLanguageModel } from "./mock-provider";
import { aiDebugMiddleware, shouldEnableAiDebug } from "./ai-debug-middleware";
import { logger } from "./logger";
import type { ModelId } from "./ai/models";

/**
 * Returns the language model used by `/api/chat`. The `modelId` must already
 * have been validated against the allowlist in `request-schema.ts` — this
 * function trusts it and does not re-check. Falls back to the mock
 * implementation (see `mock-provider.ts`) when no API key is configured so
 * that local dev + demo modes work without Anthropic credentials.
 */
export function getLanguageModel(modelId: ModelId): LanguageModelV3 {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    logger.info("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  const base = anthropic(modelId) as unknown as LanguageModelV3;

  // In development, wrap the model with a logging middleware so every request
  // + response is visible via Pino at `debug` level (see ai-debug-middleware.ts).
  if (shouldEnableAiDebug) {
    return wrapLanguageModel({
      model: base,
      middleware: aiDebugMiddleware,
    }) as unknown as LanguageModelV3;
  }

  return base;
}
