import type { VirtualFileSystem } from "@/lib/file-system";

/**
 * Build the file-tree index shipped with every request. Paths only, with a
 * `(locked)` marker on read-only files. File *contents* are NOT included —
 * the model must call the `Read` tool when it needs them. This is the
 * single biggest token-saver in the pipeline: a 10-file project went from
 * ~4 KB of dumped content to ~200 B of paths.
 *
 * Returns the empty string when the project is empty so the caller can
 * skip emitting the system message entirely.
 */
export function buildFileTreeIndex(fileSystem: VirtualFileSystem): string {
  const allFiles = fileSystem.getAllFiles();
  if (allFiles.size === 0) return "";

  const lines: string[] = [];
  for (const path of Array.from(allFiles.keys()).sort()) {
    const locked = fileSystem.isLocked(path) ? " (locked)" : "";
    lines.push(`  ${path}${locked}`);
  }

  return `\n\n<project_files note="use Read to inspect a file before editing. '(locked)' files are read-only.">\n${lines.join(
    "\n"
  )}\n</project_files>`;
}
