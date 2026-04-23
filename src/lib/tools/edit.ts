import { tool } from "ai";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";
import { withErrorEnvelope, withLockGuard } from "./_base";

export const buildEditTool = (fileSystem: VirtualFileSystem) =>
  tool({
    description:
      "Perform an exact string replacement in a file. `old_str` must match the file contents verbatim, including indentation. Fails if `old_str` is not unique in the file — in that case, include more surrounding context until it is unique. For creating new files use Write; for regex-based edits across files use Grep to find matches then Edit each one.",
    inputSchema: z.object({
      path: z
        .string()
        .describe("Absolute path of the file to edit, e.g. /App.jsx"),
      old_str: z
        .string()
        .describe(
          "The exact substring to replace. Must appear exactly once unless replace_all is true."
        ),
      new_str: z.string().describe("The replacement text."),
      replace_all: z
        .boolean()
        .optional()
        .describe(
          "Replace every occurrence of old_str (default false). Useful for renaming a symbol across a file."
        ),
    }),
    execute: withErrorEnvelope(
      withLockGuard(fileSystem, ({ path, old_str, new_str, replace_all }) => {
        const current = fileSystem.readFile(path);
        if (current === null) return `Error: File not found: ${path}`;
        if (!old_str) return `Error: old_str must not be empty`;
        if (!current.includes(old_str))
          return `Error: old_str not found in ${path}`;

        const occurrences = current.split(old_str).length - 1;
        if (!replace_all && occurrences > 1) {
          return `Error: old_str matched ${occurrences} times in ${path}. Include more surrounding context to make it unique, or pass replace_all: true.`;
        }

        const updated = current.split(old_str).join(new_str);
        fileSystem.updateFile(path, updated);
        return `Replaced ${occurrences} occurrence(s) of the string in ${path}`;
      })
    ),
  });
