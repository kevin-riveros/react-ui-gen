import { tool } from "ai";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";
import { withErrorEnvelope } from "./_base";

/**
 * Default cap on how many results a single grep returns when the model
 * does not pass an explicit `head_limit`. Keeps a pattern that matches
 * thousands of lines from flooding the context window.
 *
 * Units: results (files in `files_with_matches` mode, lines in `content` mode).
 * Range: 10–500. Practical: 30–100.
 */
const DEFAULT_HEAD_LIMIT = 50;

/**
 * Hard ceiling on `head_limit`, regardless of what the model requests.
 * Even when the model asks for "everything", we clip to this to bound the
 * per-turn token cost.
 *
 * Units: results.
 * Range: 100–2000. Practical: 300–1000.
 */
const MAX_HEAD_LIMIT = 500;

/**
 * Per-line character cap for `content` mode output. Long minified lines or
 * bundled assets can each be tens of KB; truncating individual lines stops a
 * handful of matches from dominating the response.
 *
 * Units: characters (not tokens). ~200 chars ≈ 50 tokens worst case.
 * Range: 80–500.
 */
const MAX_LINE_CHARS = 200;

function matchesGlob(path: string, glob: string): boolean {
  // Minimal glob → regex: ** → .*, * → [^/]*, ? → .
  const re = new RegExp(
    "^" +
      glob
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "::DOUBLESTAR::")
        .replace(/\*/g, "[^/]*")
        .replace(/::DOUBLESTAR::/g, ".*")
        .replace(/\?/g, ".") +
      "$"
  );
  return re.test(path);
}

const inputSchema = z.object({
  pattern: z
    .string()
    .describe("JavaScript regular expression pattern to match against file contents."),
  glob: z
    .string()
    .optional()
    .describe(
      "Optional path glob to limit which files are searched. Supports * and **. Example: '**/*.jsx'."
    ),
  output_mode: z
    .enum(["files_with_matches", "content"])
    .optional()
    .describe(
      "'files_with_matches' (default) — just the paths. 'content' — each matching line with path:line."
    ),
  case_insensitive: z
    .boolean()
    .optional()
    .describe("Match case-insensitively (adds the 'i' flag)."),
  head_limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      `Maximum number of results to return (default ${DEFAULT_HEAD_LIMIT}, capped at ${MAX_HEAD_LIMIT}).`
    ),
});

export const buildGrepTool = (fileSystem: VirtualFileSystem) =>
  tool({
    description:
      "Search file contents in the virtual file system using a regular expression. Modes: 'files_with_matches' returns the list of file paths containing at least one match (default); 'content' returns each matching line with its path and line number. Use the `glob` parameter to filter by path (e.g. '**/*.jsx', '/components/*'). Regex syntax is JavaScript RegExp (no lookbehind-only flags). Use this to locate where a symbol is used, find imports, or audit patterns across the tree — much cheaper than reading every file.",
    inputSchema,
    execute: withErrorEnvelope(
      ({ pattern, glob, output_mode = "files_with_matches", case_insensitive = false, head_limit }) => {
        const limit = Math.min(head_limit ?? DEFAULT_HEAD_LIMIT, MAX_HEAD_LIMIT);
        let re: RegExp;
        try {
          re = new RegExp(pattern, case_insensitive ? "i" : "");
        } catch (e) {
          return `Error: invalid regex pattern: ${e instanceof Error ? e.message : String(e)}`;
        }
        const files = fileSystem.getAllFiles();
        const results: string[] = [];
        let truncated = false;

        for (const [path, content] of files) {
          if (glob && !matchesGlob(path, glob)) continue;

          if (output_mode === "files_with_matches") {
            if (re.test(content)) {
              results.push(path);
              if (results.length >= limit) {
                truncated = true;
                break;
              }
            }
            re.lastIndex = 0;
          } else {
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (re.test(lines[i])) {
                const line =
                  lines[i].length > MAX_LINE_CHARS
                    ? lines[i].slice(0, MAX_LINE_CHARS) + "…"
                    : lines[i];
                results.push(`${path}:${i + 1}: ${line}`);
                if (results.length >= limit) {
                  truncated = true;
                  break;
                }
              }
              re.lastIndex = 0;
            }
            if (results.length >= limit) break;
          }
        }

        if (results.length === 0) return "No matches.";
        const header =
          output_mode === "files_with_matches"
            ? `${results.length} file(s) with matches:`
            : `${results.length} matching line(s):`;
        const footer = truncated
          ? `\n[... truncated at ${limit} results. Narrow the pattern or pass a glob to see more.]`
          : "";
        return `${header}\n${results.join("\n")}${footer}`;
      }
    ),
  });
