import { tool } from "ai";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";
import { withErrorEnvelope } from "./_base";

/**
 * Default number of lines returned when the model omits `view_range`.
 * Keeps accidental full-file reads of large generated files (CSS, JSON,
 * bundled output) from blowing out the context window.
 *
 * Units: lines.
 * Range: 50–1000. Practical: 100–300.
 * - Lower  → more Read calls per file, but each turn uses fewer tokens.
 * - Higher → fewer calls, but a single Read on a big file can dominate context.
 */
const DEFAULT_READ_LINES = 200;

/**
 * Upper bound on how many lines a single Read call can return, even when the
 * model passes an explicit `view_range`. Guards against the model asking for
 * a huge window by mistake.
 *
 * Units: lines.
 * Range: 500–5000. Practical: 1000–2000.
 */
const MAX_RANGE_LINES = 1000;

export const buildReadTool = (fileSystem: VirtualFileSystem) =>
  tool({
    description: `Read the contents of a file in the virtual file system. Returns the file with line numbers. Use this to inspect a file before editing it, or to verify a change. When \`view_range\` is omitted, returns the first ${DEFAULT_READ_LINES} lines — pass an explicit range to read more. Max ${MAX_RANGE_LINES} lines per call.`,
    inputSchema: z.object({
      path: z
        .string()
        .describe("Absolute path inside the virtual filesystem, e.g. /App.jsx"),
      view_range: z
        .array(z.number())
        .length(2)
        .optional()
        .describe(
          `Optional [start, end] line numbers (1-based, inclusive). Omit to read the first ${DEFAULT_READ_LINES} lines. End = -1 reads to end of file (still capped at ${MAX_RANGE_LINES} lines from start).`
        ),
    }),
    execute: withErrorEnvelope(({ path, view_range }) => {
      const raw = fileSystem.readFile(path);
      if (raw === null) {
        // Fall through to viewFile so directory listings / error messages keep
        // their existing shape.
        return fileSystem.viewFile(path, view_range as [number, number] | undefined);
      }

      const totalLines = raw.length === 0 ? 0 : raw.split("\n").length;

      let start: number;
      let end: number;
      if (view_range) {
        const [s, e] = view_range as [number, number];
        start = Math.max(1, s);
        const resolvedEnd = e === -1 ? totalLines : e;
        end = Math.min(resolvedEnd, start + MAX_RANGE_LINES - 1, totalLines);
      } else {
        start = 1;
        end = Math.min(DEFAULT_READ_LINES, totalLines);
      }

      const body = fileSystem.viewFile(path, [start, end]);

      if (end < totalLines) {
        return `${body}\n[... truncated. Showing lines ${start}-${end} of ${totalLines}. Call Read with view_range: [${end + 1}, -1] to continue.]`;
      }
      return body;
    }),
  });
