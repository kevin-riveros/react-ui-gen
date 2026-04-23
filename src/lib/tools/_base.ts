import type { VirtualFileSystem } from "@/lib/file-system";

/**
 * Wrap a tool handler with the "file is locked" guard. Returns the standard
 * error string when the target path is locked; otherwise runs the handler.
 * Use for tools whose input has a `path` field and whose behavior mutates
 * files (Write, Edit, FileManager).
 */
export function withLockGuard<Input extends { path: string }, Output>(
  fileSystem: VirtualFileSystem,
  handler: (input: Input) => Output | Promise<Output>
) {
  return async (input: Input): Promise<Output | string> => {
    if (fileSystem.isLocked(input.path)) {
      return `Error: File is locked and cannot be modified: ${input.path}`;
    }
    return handler(input);
  };
}

/**
 * Catch-all error envelope: any thrown exception from the handler becomes
 * a clean `Error: <message>` string the model can read, instead of a 500.
 */
export function withErrorEnvelope<Input, Output>(
  handler: (input: Input) => Output | Promise<Output>
) {
  return async (input: Input): Promise<Output | string> => {
    try {
      return await handler(input);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  };
}
