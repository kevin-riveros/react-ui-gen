import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "./logger";

const DEBUG_DIR = join(process.cwd(), "debug");

/**
 * Persists AI API calls to `debug/YYYY-MM-DD.log` as human-readable text,
 * so they can be opened in the editor and reviewed after the fact.
 *
 * Opt-in: only writes when `DEBUG_AI_LOG_TO_FILE=true` OR in development.
 * Fire-and-forget — write failures are logged to Pino and swallowed so they
 * never affect the user-facing response stream.
 */

const enabled =
  process.env.DEBUG_AI_LOG_TO_FILE === "true" ||
  process.env.NODE_ENV !== "production";

function dayStamp(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoTime(d = new Date()): string {
  return d.toISOString().replace("T", " ").replace("Z", "");
}

function indent(text: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

function safeStringify(value: unknown, maxLen = 2000): string {
  try {
    const text = JSON.stringify(value, null, 2);
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + `\n... [truncated ${text.length - maxLen} chars]`;
  } catch {
    return String(value);
  }
}

/**
 * Format the AI SDK `prompt` array (system + user/assistant/tool messages)
 * as a readable script rather than a wall of JSON.
 */
function formatPrompt(prompt: unknown): string {
  if (!Array.isArray(prompt)) return safeStringify(prompt);

  return prompt
    .map((msg, i) => {
      const role = (msg as { role?: string }).role ?? "unknown";
      const content = (msg as { content?: unknown }).content;
      const header = `[${i}] ${role}:`;

      if (typeof content === "string") {
        return `${header}\n${indent(content)}`;
      }
      if (Array.isArray(content)) {
        const parts = content.map((part) => {
          const type = (part as { type?: string }).type;
          if (type === "text") {
            return String((part as { text?: string }).text ?? "");
          }
          if (type === "tool-call") {
            const name = (part as { toolName?: string }).toolName;
            const input = (part as { input?: unknown }).input;
            return `<tool-call ${name}>\n${indent(safeStringify(input))}`;
          }
          if (type === "tool-result") {
            const name = (part as { toolName?: string }).toolName;
            const output = (part as { output?: unknown }).output;
            return `<tool-result ${name}>\n${indent(safeStringify(output))}`;
          }
          return `<${type ?? "unknown"}>\n${indent(safeStringify(part))}`;
        });
        return `${header}\n${indent(parts.join("\n\n"))}`;
      }
      return `${header}\n${indent(safeStringify(content))}`;
    })
    .join("\n\n");
}

async function write(entry: string): Promise<void> {
  if (!enabled) return;
  const file = join(DEBUG_DIR, `${dayStamp()}.log`);
  try {
    await mkdir(DEBUG_DIR, { recursive: true });
    await appendFile(file, entry + "\n", "utf8");
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), file },
      "debug file logger: write failed"
    );
  }
}

const BAR = "=".repeat(80);

export interface RequestRecord {
  phase: "generate" | "stream";
  modelId: string;
  prompt: unknown;
  tools?: unknown;
  maxOutputTokens?: number;
  temperature?: number;
  toolChoice?: unknown;
}

export function logRequest(record: RequestRecord): void {
  const tools = Array.isArray(record.tools)
    ? (record.tools as Array<{ name?: string; description?: string }>)
        .map(
          (t) =>
            `  - ${t.name ?? "?"}: ${
              typeof t.description === "string"
                ? t.description.slice(0, 120) +
                  (t.description.length > 120 ? "…" : "")
                : ""
            }`
        )
        .join("\n")
    : "  (none)";

  const entry = [
    BAR,
    `[${isoTime()}] REQUEST (${record.phase}) — ${record.modelId}`,
    BAR,
    "",
    "Config:",
    `  maxOutputTokens: ${record.maxOutputTokens ?? "-"}`,
    `  temperature:     ${record.temperature ?? "-"}`,
    `  toolChoice:      ${safeStringify(record.toolChoice, 200)}`,
    "",
    `Tools (${Array.isArray(record.tools) ? record.tools.length : 0}):`,
    tools,
    "",
    "Prompt:",
    indent(formatPrompt(record.prompt)),
    "",
  ].join("\n");

  void write(entry);
}

export interface GenerateResponseRecord {
  modelId: string;
  durationMs: number;
  finishReason?: unknown;
  usage?: unknown;
  content?: unknown;
}

export function logGenerateResponse(record: GenerateResponseRecord): void {
  const entry = [
    BAR,
    `[${isoTime()}] RESPONSE (generate, ${record.durationMs}ms) — ${record.modelId}`,
    BAR,
    `  finishReason: ${record.finishReason ? String(record.finishReason) : "-"}`,
    `  usage:        ${safeStringify(record.usage, 400)}`,
    "",
    "Content:",
    indent(safeStringify(record.content, 8000)),
    "",
  ].join("\n");

  void write(entry);
}

export interface StreamResponseRecord {
  modelId: string;
  durationMs: number;
  textChunks: number;
  toolCallChunks: number;
  firstToolName?: string;
}

export function logStreamResponse(record: StreamResponseRecord): void {
  const entry = [
    BAR,
    `[${isoTime()}] RESPONSE (stream, ${record.durationMs}ms) — ${record.modelId}`,
    BAR,
    `  textChunks:     ${record.textChunks}`,
    `  toolCallChunks: ${record.toolCallChunks}`,
    `  firstToolName:  ${record.firstToolName ?? "-"}`,
    "",
  ].join("\n");

  void write(entry);
}

export interface ErrorRecord {
  phase: "generate" | "stream";
  modelId: string;
  durationMs: number;
  err: string;
}

export function logError(record: ErrorRecord): void {
  const entry = [
    BAR,
    `[${isoTime()}] ERROR (${record.phase}, ${record.durationMs}ms) — ${record.modelId}`,
    BAR,
    indent(record.err),
    "",
  ].join("\n");

  void write(entry);
}
