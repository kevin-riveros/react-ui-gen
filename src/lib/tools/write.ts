import { tool } from "ai";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";
import { withErrorEnvelope, withLockGuard } from "./_base";

export const buildWriteTool = (fileSystem: VirtualFileSystem) =>
  tool({
    description:
      "Create a new file (or overwrite an existing one) with the given content. Parent directories are created automatically. For partial edits to an existing file, prefer the Edit tool.",
    inputSchema: z.object({
      path: z
        .string()
        .describe("Absolute path of the file to create, e.g. /components/Hero.jsx"),
      content: z.string().describe("Full file contents to write."),
    }),
    execute: withErrorEnvelope(
      withLockGuard(fileSystem, ({ path, content }) =>
        fileSystem.createFileWithParents(path, content)
      )
    ),
  });
