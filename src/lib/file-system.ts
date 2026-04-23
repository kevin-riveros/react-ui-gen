import { FileLockedError } from "./errors";
import { normalizePath } from "./path-utils";

export interface FileNode {
  type: "file" | "directory";
  name: string;
  path: string;
  content?: string;
  children?: Map<string, FileNode>;
  locked?: boolean;
}

export class VirtualFileSystem {
  private files: Map<string, FileNode> = new Map();
  private root: FileNode;

  constructor() {
    this.root = {
      type: "directory",
      name: "/",
      path: "/",
      children: new Map(),
    };
    this.files.set("/", this.root);
  }

  private normalizePath(path: string): string {
    return normalizePath(path);
  }

  private getParentPath(path: string): string {
    const normalized = this.normalizePath(path);
    if (normalized === "/") return "/";
    const parts = normalized.split("/");
    parts.pop();
    return parts.length === 1 ? "/" : parts.join("/");
  }

  private getFileName(path: string): string {
    const normalized = this.normalizePath(path);
    if (normalized === "/") return "/";
    const parts = normalized.split("/");
    return parts[parts.length - 1];
  }

  private getParentNode(path: string): FileNode | null {
    const parentPath = this.getParentPath(path);
    return this.files.get(parentPath) || null;
  }

  createFile(path: string, content: string = ""): FileNode | null {
    const normalized = this.normalizePath(path);

    if (this.files.has(normalized)) {
      return null;
    }

    // Pre-flight: walk every intermediate segment. If any is occupied by a
    // non-directory node, refuse before mutating the tree so partial writes
    // can't leave half-created parents behind.
    const parts = normalized.split("/").filter(Boolean);
    const toCreate: string[] = [];
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += "/" + parts[i];
      const existing = this.files.get(currentPath);
      if (existing && existing.type !== "directory") {
        return null;
      }
      if (!existing) toCreate.push(currentPath);
    }

    // Commit: create missing parents, then the file itself.
    for (const dirPath of toCreate) {
      this.createDirectory(dirPath);
    }

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return null;
    }

    const fileName = this.getFileName(normalized);
    const file: FileNode = {
      type: "file",
      name: fileName,
      path: normalized,
      content,
    };

    this.files.set(normalized, file);
    parent.children!.set(fileName, file);

    return file;
  }

  createDirectory(path: string): FileNode | null {
    const normalized = this.normalizePath(path);

    // Check if directory already exists
    if (this.files.has(normalized)) {
      return null;
    }

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return null;
    }

    const dirName = this.getFileName(normalized);
    const directory: FileNode = {
      type: "directory",
      name: dirName,
      path: normalized,
      children: new Map(),
    };

    this.files.set(normalized, directory);
    parent.children!.set(dirName, directory);

    return directory;
  }

  isLocked(path: string): boolean {
    const normalized = this.normalizePath(path);
    const node = this.files.get(normalized);
    return node?.locked === true;
  }

  setLocked(path: string, locked: boolean): boolean {
    const normalized = this.normalizePath(path);
    const node = this.files.get(normalized);
    if (!node) return false;
    node.locked = locked;
    return true;
  }

  readFile(path: string): string | null {
    const normalized = this.normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || file.type !== "file") {
      return null;
    }

    return file.content || "";
  }

  /**
   * Update the contents of an existing file.
   *
   * @returns `true` if the file exists and was updated, `false` if no such
   *          file exists (or the path points to a directory).
   * @throws {FileLockedError} if the file is locked. Use `isLocked(path)`
   *         to check first if the caller wants to branch non-exceptionally.
   */
  updateFile(path: string, content: string): boolean {
    const normalized = this.normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || file.type !== "file") {
      return false;
    }

    if (file.locked) {
      throw new FileLockedError(normalized);
    }

    file.content = content;
    return true;
  }

  /**
   * Remove a file or directory (recursive). Returns `false` for "path didn't
   * exist" / "can't delete root" — those are expected branch points callers
   * may want to ignore.
   *
   * @throws {FileLockedError} if the target (or any descendant, for a
   *         directory delete) is locked. Matching `updateFile`'s policy so
   *         lock violations can never be silently swallowed.
   */
  deleteFile(path: string): boolean {
    const normalized = this.normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || normalized === "/") {
      return false;
    }

    if (file.locked) {
      throw new FileLockedError(normalized);
    }

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return false;
    }

    // Pre-flight: for a directory delete, scan all descendants for a lock
    // before mutating anything. Walking + deleting in one pass would leave
    // part of the subtree gone when the first lock bubbles — a half-deleted
    // directory is worse than an error.
    if (file.type === "directory" && file.children) {
      const lockedDescendant = this.findLockedDescendant(file);
      if (lockedDescendant) {
        throw new FileLockedError(lockedDescendant);
      }
      for (const child of file.children.values()) {
        this.deleteFile(child.path);
      }
    }

    parent.children!.delete(file.name);
    this.files.delete(normalized);

    return true;
  }

  /**
   * Move/rename a file or directory. Returns `false` for expected branch
   * points (source missing, destination already occupied, renaming root).
   *
   * @throws {FileLockedError} if the source is locked. Mirrors `updateFile`
   *         and `deleteFile` — lock violations never silently succeed.
   */
  rename(oldPath: string, newPath: string): boolean {
    const normalizedOld = this.normalizePath(oldPath);
    const normalizedNew = this.normalizePath(newPath);

    // Can't rename root
    if (normalizedOld === "/" || normalizedNew === "/") {
      return false;
    }

    // Check if source exists
    const sourceNode = this.files.get(normalizedOld);
    if (!sourceNode) {
      return false;
    }

    if (sourceNode.locked) {
      throw new FileLockedError(normalizedOld);
    }

    // Check if destination already exists
    if (this.files.has(normalizedNew)) {
      return false;
    }

    // Get parent of source
    const oldParent = this.getParentNode(normalizedOld);
    if (!oldParent || oldParent.type !== "directory") {
      return false;
    }

    // Create parent directories for destination if needed
    const newParentPath = this.getParentPath(normalizedNew);
    if (!this.exists(newParentPath)) {
      const parts = newParentPath.split("/").filter(Boolean);
      let currentPath = "";

      for (const part of parts) {
        currentPath += "/" + part;
        if (!this.exists(currentPath)) {
          this.createDirectory(currentPath);
        }
      }
    }

    // Get parent of destination
    const newParent = this.getParentNode(normalizedNew);
    if (!newParent || newParent.type !== "directory") {
      return false;
    }

    // Remove from old parent
    oldParent.children!.delete(sourceNode.name);

    // Update the node's path and name
    const newName = this.getFileName(normalizedNew);
    sourceNode.name = newName;
    sourceNode.path = normalizedNew;

    // Add to new parent
    newParent.children!.set(newName, sourceNode);

    // Update in files map
    this.files.delete(normalizedOld);
    this.files.set(normalizedNew, sourceNode);

    // If it's a directory, update all children paths recursively
    if (sourceNode.type === "directory" && sourceNode.children) {
      this.updateChildrenPaths(sourceNode);
    }

    return true;
  }

  /**
   * Depth-first search for the first locked node at or below `node`. Used by
   * `deleteFile` to validate a subtree before any destructive mutation —
   * returns the offender's path so the thrown error points at the right
   * file, not just the top of the subtree.
   */
  private findLockedDescendant(node: FileNode): string | null {
    if (node.locked) return node.path;
    if (node.type === "directory" && node.children) {
      for (const child of node.children.values()) {
        const found = this.findLockedDescendant(child);
        if (found) return found;
      }
    }
    return null;
  }

  private updateChildrenPaths(node: FileNode): void {
    if (node.type === "directory" && node.children) {
      for (const child of node.children.values()) {
        const oldChildPath = child.path;
        child.path = node.path + "/" + child.name;

        // Update in files map
        this.files.delete(oldChildPath);
        this.files.set(child.path, child);

        // Recursively update children if it's a directory
        if (child.type === "directory") {
          this.updateChildrenPaths(child);
        }
      }
    }
  }

  exists(path: string): boolean {
    const normalized = this.normalizePath(path);
    return this.files.has(normalized);
  }

  getNode(path: string): FileNode | null {
    const normalized = this.normalizePath(path);
    return this.files.get(normalized) || null;
  }

  listDirectory(path: string): FileNode[] | null {
    const normalized = this.normalizePath(path);
    const dir = this.files.get(normalized);

    if (!dir || dir.type !== "directory") {
      return null;
    }

    return Array.from(dir.children?.values() || []);
  }

  getAllFiles(): Map<string, string> {
    const fileMap = new Map<string, string>();

    for (const [path, node] of this.files) {
      if (node.type === "file") {
        fileMap.set(path, node.content || "");
      }
    }

    return fileMap;
  }

  serialize(): Record<string, FileNode> {
    const result: Record<string, FileNode> = {};

    for (const [path, node] of this.files) {
      // Create a shallow copy without the Map children to avoid serialization issues
      if (node.type === "directory") {
        result[path] = {
          type: node.type,
          name: node.name,
          path: node.path,
          ...(node.locked && { locked: true }),
        };
      } else {
        result[path] = {
          type: node.type,
          name: node.name,
          path: node.path,
          content: node.content,
          ...(node.locked && { locked: true }),
        };
      }
    }

    return result;
  }

  deserialize(data: Record<string, string>): void {
    // Clear existing files except root
    this.files.clear();
    this.root.children?.clear();
    this.files.set("/", this.root);

    // Sort paths to ensure parent directories are created first
    const paths = Object.keys(data).sort();

    for (const path of paths) {
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";

      // Create parent directories if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += "/" + parts[i];
        if (!this.exists(currentPath)) {
          this.createDirectory(currentPath);
        }
      }

      // Create the file
      this.createFile(path, data[path]);
    }
  }

  deserializeFromNodes(data: Record<string, FileNode>): void {
    // Clear existing files except root
    this.files.clear();
    this.root.children?.clear();
    this.files.set("/", this.root);

    // Sort paths to ensure parent directories are created first
    const paths = Object.keys(data).sort();

    for (const path of paths) {
      if (path === "/") continue; // Skip root

      const node = data[path];
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";

      // Create parent directories if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += "/" + parts[i];
        if (!this.exists(currentPath)) {
          this.createDirectory(currentPath);
        }
      }

      // Create the file or directory
      if (node.type === "file") {
        this.createFile(path, node.content || "");
      } else if (node.type === "directory") {
        this.createDirectory(path);
      }

      // Restore locked state
      if (node.locked) {
        this.setLocked(path, true);
      }
    }
  }

  // Text editor command implementations
  viewFile(path: string, viewRange?: [number, number]): string {
    const file = this.getNode(path);
    if (!file) {
      return `File not found: ${path}`;
    }

    // If it's a directory, list its contents
    if (file.type === "directory") {
      const children = this.listDirectory(path);
      if (!children || children.length === 0) {
        return "(empty directory)";
      }

      return children
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => {
          const prefix = child.type === "directory" ? "[DIR]" : "[FILE]";
          return `${prefix} ${child.name}`;
        })
        .join("\n");
    }

    // For files, show content
    const content = file.content || "";

    // Handle view_range if provided
    if (viewRange && viewRange.length === 2) {
      const lines = content.split("\n");
      const [start, end] = viewRange;
      const startLine = Math.max(1, start);
      const endLine = end === -1 ? lines.length : Math.min(lines.length, end);

      const viewedLines = lines.slice(startLine - 1, endLine);
      return viewedLines
        .map((line, index) => `${startLine + index}\t${line}`)
        .join("\n");
    }

    // Return full file with line numbers
    const lines = content.split("\n");
    return (
      lines.map((line, index) => `${index + 1}\t${line}`).join("\n") ||
      "(empty file)"
    );
  }

  createFileWithParents(path: string, content: string = ""): string {
    // Check if file already exists
    if (this.exists(path)) {
      return `Error: File already exists: ${path}`;
    }

    // Create parent directories if they don't exist
    const parts = path.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += "/" + parts[i];
      if (!this.exists(currentPath)) {
        this.createDirectory(currentPath);
      }
    }

    // Create the file
    this.createFile(path, content);
    return `File created: ${path}`;
  }

  replaceInFile(path: string, oldStr: string, newStr: string): string {
    const file = this.getNode(path);
    if (!file) {
      return `Error: File not found: ${path}`;
    }

    if (file.type !== "file") {
      return `Error: Cannot edit a directory: ${path}`;
    }

    if (file.locked) {
      return `Error: File is locked and cannot be edited: ${path}`;
    }

    const content = this.readFile(path) || "";

    // Check if old_str exists in the file
    if (!oldStr || !content.includes(oldStr)) {
      return `Error: String not found in file: "${oldStr}"`;
    }

    // Count occurrences
    const occurrences = (
      content.match(
        new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      ) || []
    ).length;

    // Replace all occurrences
    const updatedContent = content.split(oldStr).join(newStr || "");
    this.updateFile(path, updatedContent);

    return `Replaced ${occurrences} occurrence(s) of the string in ${path}`;
  }

  insertInFile(path: string, insertLine: number, text: string): string {
    const file = this.getNode(path);
    if (!file) {
      return `Error: File not found: ${path}`;
    }

    if (file.type !== "file") {
      return `Error: Cannot edit a directory: ${path}`;
    }

    if (file.locked) {
      return `Error: File is locked and cannot be edited: ${path}`;
    }

    const content = this.readFile(path) || "";
    const lines = content.split("\n");

    // Validate insert_line
    if (
      insertLine === undefined ||
      insertLine < 0 ||
      insertLine > lines.length
    ) {
      return `Error: Invalid line number: ${insertLine}. File has ${lines.length} lines.`;
    }

    // Insert the text
    lines.splice(insertLine, 0, text || "");
    const updatedContent = lines.join("\n");
    this.updateFile(path, updatedContent);

    return `Text inserted at line ${insertLine} in ${path}`;
  }

  reset(): void {
    // Clear all files and reset to initial state
    this.files.clear();
    this.root = {
      type: "directory",
      name: "/",
      path: "/",
      children: new Map(),
    };
    this.files.set("/", this.root);
  }
}
