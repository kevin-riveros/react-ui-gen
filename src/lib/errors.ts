/**
 * Thrown when an operation tries to modify a file that is marked as locked
 * (e.g. template files the AI should not touch, or internal scaffolding).
 *
 * Callers should catch this and surface a user-/model-friendly message
 * rather than letting it bubble as a generic 500.
 */
export class FileLockedError extends Error {
  constructor(public readonly path: string) {
    super(`File is locked and cannot be modified: ${path}`);
    this.name = "FileLockedError";
  }
}

/**
 * Thrown when an operation targets a path that does not exist or is not of
 * the expected type (e.g. editing a directory as if it were a file).
 *
 * Currently unused — reserved for future refactors that tighten the
 * file-system contract. Leaving exported so consumers can rely on it.
 */
export class FileNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`File not found: ${path}`);
    this.name = "FileNotFoundError";
  }
}
