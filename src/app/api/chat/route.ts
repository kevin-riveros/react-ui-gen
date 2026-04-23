import {
  streamText,
  createUIMessageStreamResponse,
  createUIMessageStream,
  convertToModelMessages,
  stepCountIs,
  generateId,
} from "ai";
import throttle from "throttleit";

import { VirtualFileSystem } from "@/lib/file-system";
import { prisma } from "@/lib/prisma";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";
import { logger } from "@/lib/logger";
import {
  MAX_OUTPUT_TOKENS,
  MAX_TOOL_STEPS,
  STEP_SAVE_INTERVAL_MS,
} from "@/lib/constants";

import {
  buildMessagesWithSummary,
  createChatSummary,
} from "@/lib/chat/create-summary";
import {
  buildErrorMessage,
  extractErrorMessage,
  humanizeError,
  isAbortError,
  isErrorMessage,
} from "@/lib/chat/errors";
import { buildFileTreeIndex } from "@/lib/chat/file-tree-index";
import { parseChatRequest } from "@/lib/chat/request-schema";
import {
  stripEmptyImagePartsForModel,
  stripImagePartsForPersistence,
} from "@/lib/chat/strip-image-parts";
import { shouldSummarize } from "@/lib/chat/summary-trigger";

import { buildEditTool } from "@/lib/tools/edit";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { buildGrepTool } from "@/lib/tools/grep";
import { buildReadTool } from "@/lib/tools/read";
import { buildSkillTool } from "@/lib/tools/skill";
import { buildWriteTool } from "@/lib/tools/write";

const log = logger.child({ route: "/api/chat" });

export const maxDuration = 120;

type StreamOutcome = { kind: "ok" } | { kind: "error" } | { kind: "aborted" };

export async function POST(req: Request) {
  try {
    const parsed = await parseChatRequest(req);
    if (!parsed.ok) return Response.json(parsed.body, { status: parsed.status });
    const { messages: rawMessages, files, projectId, model: modelId } = parsed.data;

    // Error-stub messages (persisted on prior failures) stay in the UI but
    // must not be sent back to the model — otherwise it sees its own error
    // text as conversational history.
    const messagesForModel = rawMessages.filter((m) => !isErrorMessage(m));

    let existingSummary: string | null = null;
    let summaryMessageId: string | null = null;
    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { summary: true, summaryMessageId: true },
        });
        existingSummary = project?.summary ?? null;
        summaryMessageId = project?.summaryMessageId ?? null;
      } catch {
        // Ignore — proceed without summary.
      }
    }

    const fileSystem = new VirtualFileSystem();
    fileSystem.deserializeFromNodes(files);

    const fileTreeIndex = buildFileTreeIndex(fileSystem);
    const optimizedMessages = buildMessagesWithSummary(
      messagesForModel,
      existingSummary,
      summaryMessageId
    );
    // Drop any image file parts whose url is empty / stripped — feeding
    // an empty base64 to Anthropic fails the whole request with
    // `image cannot be empty`, which would otherwise poison the chat
    // forever once a single bad capture landed in history.
    const sanitizedForModel = stripEmptyImagePartsForModel(optimizedMessages);
    const modelMessages = await convertToModelMessages(sanitizedForModel);
    const model = getLanguageModel(modelId);

    // Single source of truth for stream termination — `onError` sets this,
    // the outer `onFinish` reads it to decide whether to save or skip.
    let outcome: StreamOutcome = { kind: "ok" };

    // Flipped to true once either `onError` or the outer `onFinish` is about
    // to perform the authoritative save. The throttled mid-stream save
    // checks this flag before writing so a late trailing-edge timer can't
    // overwrite the final state after it has landed. `throttleit` has no
    // `cancel()` API, hence this guard pattern rather than teardown.
    let streamComplete = false;

    // Leading-edge throttle: bursts of tool calls coalesce into at most one
    // DB write per STEP_SAVE_INTERVAL_MS, trailing edge flushes the last
    // state. Swallowed-write errors are logged, not thrown.
    const saveFilesToDB = projectId
      ? throttle(async () => {
          if (streamComplete) return;
          try {
            await prisma.project.update({
              where: { id: projectId },
              data: { data: JSON.stringify(fileSystem.serialize()) },
            });
          } catch (err) {
            log.error(
              { err: extractErrorMessage(err), projectId },
              "step save failed"
            );
          }
        }, STEP_SAVE_INTERVAL_MS)
      : null;

    log.info(
      { msgCount: modelMessages.length, projectId },
      "sending messages to anthropic"
    );

    const result = streamText({
      model,
      system: [
        {
          role: "system",
          content: generationPrompt,
          providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
        },
        // File-tree index rarely changes between turns, so caching recoups
        // its cost within a few messages.
        ...(fileTreeIndex
          ? [
              {
                role: "system" as const,
                content: fileTreeIndex,
                providerOptions: {
                  anthropic: { cacheControl: { type: "ephemeral" } },
                },
              },
            ]
          : []),
      ],
      messages: modelMessages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
      maxRetries: 0,
      // Stop burning Anthropic tokens the moment the user closes the tab
      // or clicks Stop — Next.js 16's Request.signal IS a real AbortSignal.
      abortSignal: req.signal,
      onError: async (err: unknown) => {
        const errMsg = extractErrorMessage(err);
        const aborted = isAbortError(err);
        log.error(
          { err: errMsg, projectId, aborted },
          aborted ? "stream aborted" : "stream error"
        );
        outcome = aborted ? { kind: "aborted" } : { kind: "error" };
        // Block any pending throttled save from firing after this one lands.
        streamComplete = true;

        if (!projectId) return;
        try {
          // On abort we keep the message list as-is (user chose to stop —
          // no need for a scary error stub). On real failure we append the
          // stub so users see what went wrong after reload.
          const messagesToSave = aborted
            ? rawMessages
            : [...rawMessages, buildErrorMessage(errMsg)];
          await prisma.project.update({
            where: { id: projectId },
            data: {
              data: JSON.stringify(fileSystem.serialize()),
              messages: JSON.stringify(stripImagePartsForPersistence(messagesToSave)),
            },
          });
          log.info(
            { projectId, aborted },
            aborted
              ? "partial progress saved (aborted)"
              : "partial progress + error message saved"
          );
        } catch (saveErr) {
          log.error(
            { err: extractErrorMessage(saveErr), projectId },
            "failed to save partial progress"
          );
        }
      },
      onStepFinish: async ({ toolCalls, usage, providerMetadata }) => {
        const tools =
          toolCalls
            ?.map((tc) => {
              // Tool inputs are unions across every registered tool — for the
              // log line we only need a short "subject" (file path / skill /
              // pattern, whichever exists on this call).
              const input = tc.input as {
                path?: string;
                name?: string;
                pattern?: string;
              };
              const subject = input.path ?? input.name ?? input.pattern ?? "";
              return `${tc.toolName}(${subject})`;
            })
            .join(", ") || "text";

        // Anthropic's provider metadata isn't typed by the core AI SDK.
        interface AnthropicUsageMetadata {
          cacheReadInputTokens?: number;
          cacheCreationInputTokens?: number;
        }
        const anthMeta = (providerMetadata as
          | { anthropic?: AnthropicUsageMetadata }
          | undefined)?.anthropic;

        log.info(
          {
            tools,
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
            cacheRead: anthMeta?.cacheReadInputTokens ?? 0,
            cacheWrite: anthMeta?.cacheCreationInputTokens ?? 0,
          },
          "step finished"
        );

        if (saveFilesToDB && toolCalls && toolCalls.length > 0) {
          saveFilesToDB();
        }
      },
      tools: {
        Read: buildReadTool(fileSystem),
        Write: buildWriteTool(fileSystem),
        Edit: buildEditTool(fileSystem),
        Grep: buildGrepTool(fileSystem),
        FileManager: buildFileManagerTool(fileSystem),
        Skill: buildSkillTool(),
      },
      onFinish: async ({ totalUsage }) => {
        if (totalUsage) {
          log.info(
            {
              inputTokens: totalUsage.inputTokens,
              outputTokens: totalUsage.outputTokens,
            },
            "stream completed"
          );
        }
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: rawMessages,
      generateMessageId: () => generateId(),
      // Tag every streamed message with a server-assigned timestamp at
      // start-of-stream. Rendering treats `metadata?.createdAt` as optional
      // since messages persisted before this change have no timestamp.
      messageMetadata: ({ part }) =>
        part.type === "start" ? { createdAt: Date.now() } : undefined,
      onFinish: async ({ messages: allMessages }) => {
        // Set first, before any early-return — so a throttled save that
        // fires during `return` still sees the flag and no-ops.
        streamComplete = true;
        if (!projectId || outcome.kind !== "ok") return;

        try {
          const serializedFiles = JSON.stringify(fileSystem.serialize());
          const serializedMessages = JSON.stringify(
            stripImagePartsForPersistence(allMessages)
          );

          let summaryData: { summary: string; summaryMessageId: string } | null = null;
          if (
            shouldSummarize({
              serializedMessages,
              allMessages,
              summaryMessageId,
            })
          ) {
            try {
              const result = await createChatSummary({
                messages: allMessages,
                previousSummary: existingSummary,
                summaryMessageId,
              });
              if (result.summary && result.lastMessageId) {
                summaryData = {
                  summary: result.summary,
                  summaryMessageId: result.lastMessageId,
                };
              }
            } catch (err) {
              log.error(
                { err: extractErrorMessage(err), projectId },
                "summary failed"
              );
            }
          }

          await prisma.project.update({
            where: { id: projectId },
            data: {
              data: serializedFiles,
              messages: serializedMessages,
              ...(summaryData ?? {}),
            },
          });
          log.info(
            { projectId, withSummary: !!summaryData },
            "project saved"
          );
        } catch (err) {
          log.error(
            { err: extractErrorMessage(err), projectId },
            "save failed"
          );
        }
      },
    });
  } catch (err: unknown) {
    const errMsg = extractErrorMessage(err);
    log.error({ err: errMsg }, "unhandled error");

    // Render the error as an assistant message so it shows in the chat
    // instead of bubbling up as a blank 500.
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          const id = generateId();
          writer.write({ type: "text-start", id });
          writer.write({
            type: "text-delta",
            id,
            delta: `⚠️ **Error:** ${humanizeError(errMsg)}`,
          });
        },
      }),
    });
  }
}
