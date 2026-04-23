import type { LanguageModelMiddleware } from "ai";
import { logger } from "./logger";
import {
  logError,
  logGenerateResponse,
  logRequest,
  logStreamResponse,
} from "./debug-file-logger";

/**
 * Dev-only middleware that logs every call the server makes to Anthropic.
 *
 * It intercepts both `doGenerate` (non-streaming, used by the summary step
 * on Haiku) and `doStream` (used by the main chat). The full request params
 * are logged at `debug` level so they do not spam normal runs — enable with
 * `LOG_LEVEL=debug` or use `DEBUG_AI_FULL_PAYLOAD=true` to also dump every
 * streamed chunk.
 *
 * Fields logged for every call:
 *   - `prompt`        : the full `prompt` array sent to the provider
 *                       (system + messages), JSON-serializable
 *   - `tools`         : the tool definitions (name + description only unless
 *                       `DEBUG_AI_FULL_PAYLOAD=true` which dumps full schemas)
 *   - `maxOutputTokens`, `temperature`, `toolChoice`
 *
 * Responses:
 *   - `doGenerate` logs `content`, `usage`, `finishReason`.
 *   - `doStream`   logs a running summary: number of text/tool chunks and
 *                  the first tool-call name. Full chunk dump only with
 *                  `DEBUG_AI_FULL_PAYLOAD=true`.
 */

const isDev = process.env.NODE_ENV !== "production";
const fullPayload = process.env.DEBUG_AI_FULL_PAYLOAD === "true";

function summarizeTools(tools: unknown): unknown {
  if (!Array.isArray(tools)) return tools;
  if (fullPayload) return tools;
  return tools.map((t: { type?: string; name?: string; description?: string }) => ({
    type: t.type,
    name: t.name,
    description:
      typeof t.description === "string"
        ? t.description.slice(0, 120) +
          (t.description.length > 120 ? "…" : "")
        : undefined,
  }));
}

export const aiDebugMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",

  async wrapGenerate({ doGenerate, params, model }) {
    const started = Date.now();
    logger.debug(
      {
        phase: "anthropic.generate.request",
        modelId: model.modelId,
        prompt: params.prompt,
        tools: summarizeTools(params.tools),
        maxOutputTokens: params.maxOutputTokens,
        temperature: params.temperature,
        toolChoice: params.toolChoice,
      },
      "anthropic request (generate)"
    );
    logRequest({
      phase: "generate",
      modelId: model.modelId,
      prompt: params.prompt,
      tools: params.tools,
      maxOutputTokens: params.maxOutputTokens,
      temperature: params.temperature,
      toolChoice: params.toolChoice,
    });

    try {
      const result = await doGenerate();
      logger.debug(
        {
          phase: "anthropic.generate.response",
          modelId: model.modelId,
          durationMs: Date.now() - started,
          finishReason: result.finishReason,
          usage: result.usage,
          content: fullPayload ? result.content : undefined,
          contentCount: Array.isArray(result.content)
            ? result.content.length
            : undefined,
        },
        "anthropic response (generate)"
      );
      logGenerateResponse({
        modelId: model.modelId,
        durationMs: Date.now() - started,
        finishReason: result.finishReason,
        usage: result.usage,
        content: result.content,
      });
      return result;
    } catch (err) {
      logger.error(
        {
          phase: "anthropic.generate.error",
          modelId: model.modelId,
          durationMs: Date.now() - started,
          err: err instanceof Error ? err.message : String(err),
        },
        "anthropic error (generate)"
      );
      logError({
        phase: "generate",
        modelId: model.modelId,
        durationMs: Date.now() - started,
        err: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      throw err;
    }
  },

  async wrapStream({ doStream, params, model }) {
    const started = Date.now();
    logger.debug(
      {
        phase: "anthropic.stream.request",
        modelId: model.modelId,
        prompt: params.prompt,
        tools: summarizeTools(params.tools),
        maxOutputTokens: params.maxOutputTokens,
        temperature: params.temperature,
        toolChoice: params.toolChoice,
      },
      "anthropic request (stream)"
    );
    logRequest({
      phase: "stream",
      modelId: model.modelId,
      prompt: params.prompt,
      tools: params.tools,
      maxOutputTokens: params.maxOutputTokens,
      temperature: params.temperature,
      toolChoice: params.toolChoice,
    });

    let textChunks = 0;
    let toolCallChunks = 0;
    let firstToolName: string | undefined;

    try {
      const { stream, ...rest } = await doStream();
      const instrumented = stream.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            if (fullPayload) {
              logger.debug(
                {
                  phase: "anthropic.stream.chunk",
                  modelId: model.modelId,
                  chunk,
                },
                "anthropic stream chunk"
              );
            }
            if (chunk && typeof chunk === "object") {
              const c = chunk as { type?: string; toolName?: string };
              if (c.type === "text-delta") textChunks++;
              if (c.type === "tool-call") {
                toolCallChunks++;
                if (!firstToolName) firstToolName = c.toolName;
              }
            }
            controller.enqueue(chunk);
          },
          flush() {
            logger.debug(
              {
                phase: "anthropic.stream.response",
                modelId: model.modelId,
                durationMs: Date.now() - started,
                textChunks,
                toolCallChunks,
                firstToolName,
              },
              "anthropic stream finished"
            );
            logStreamResponse({
              modelId: model.modelId,
              durationMs: Date.now() - started,
              textChunks,
              toolCallChunks,
              firstToolName,
            });
          },
        })
      );
      return { ...rest, stream: instrumented };
    } catch (err) {
      logger.error(
        {
          phase: "anthropic.stream.error",
          modelId: model.modelId,
          durationMs: Date.now() - started,
          err: err instanceof Error ? err.message : String(err),
        },
        "anthropic error (stream)"
      );
      logError({
        phase: "stream",
        modelId: model.modelId,
        durationMs: Date.now() - started,
        err: err instanceof Error ? err.stack ?? err.message : String(err),
      });
      throw err;
    }
  },
};

export const shouldEnableAiDebug = isDev;
