/**
 * Canonicalize a POSIX-style virtual path used by `VirtualFileSystem` and the
 * browser preview import map.
 *
 * Rules:
 * - Every path is absolute (prefixed with `/`).
 * - Trailing slashes are stripped (except root `/`).
 * - Consecutive slashes collapse: `//a//b` → `/a/b`.
 *
 * This is the single source of truth for path shape inside the virtual
 * file-system. Do not reimplement — import this helper.
 */
export function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  path = path.replace(/\/+/g, "/");
  return path;
}

/**
 * Resolve a relative path (`./foo`, `../bar/baz.css`) against an absolute
 * directory path. Returns an absolute, normalized path.
 *
 * Used by the preview CSS-import resolver. Does NOT support drive letters,
 * `~`, protocol-relative URLs, or anything beyond POSIX semantics — the
 * preview's virtual file-system is POSIX-only.
 */
export function resolveRelativePath(
  fromDir: string,
  relativePath: string
): string {
  const parts = fromDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/");

  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }

  return "/" + parts.join("/");
}
