import { tool } from "ai";
import { z } from "zod";
import type { VirtualFileSystem } from "@/lib/file-system";
import { withErrorEnvelope, withLockGuard } from "./_base";

export const buildFileManagerTool = (fileSystem: VirtualFileSystem) =>
  tool({
    description:
      'Rename or delete files or folders in the file system. Rename can be used to "move" a file. Rename will recursively create folders as required.',
    inputSchema: z.object({
      command: z.enum(["rename", "delete"]).describe("The operation to perform"),
      path: z
        .string()
        .describe("The path to the file or directory to rename or delete"),
      new_path: z
        .string()
        .optional()
        .describe("The new path. Only provide when renaming or moving a file."),
    }),
    execute: withErrorEnvelope(
      withLockGuard(fileSystem, ({ command, path, new_path }) => {
        if (command === "rename") {
          if (!new_path) {
            return {
              success: false,
              error: "new_path is required for rename command",
            };
          }
          return fileSystem.rename(path, new_path)
            ? { success: true, message: `Successfully renamed ${path} to ${new_path}` }
            : { success: false, error: `Failed to rename ${path} to ${new_path}` };
        }
        return fileSystem.deleteFile(path)
          ? { success: true, message: `Successfully deleted ${path}` }
          : { success: false, error: `Failed to delete ${path}` };
      })
    ),
  });
