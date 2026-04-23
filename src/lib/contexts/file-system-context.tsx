"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { VirtualFileSystem, type FileNode } from "@/lib/file-system";
import { FileLockedError } from "@/lib/errors";

interface ToolCall {
  toolName: string;
  args?: Record<string, unknown>;
}

type ProjectData = Record<string, FileNode>;

interface FileSystemContextType {
  fileSystem: VirtualFileSystem;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;
  createFile: (path: string, content?: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => boolean;
  getFileContent: (path: string) => string | null;
  getAllFiles: () => Map<string, string>;
  refreshTrigger: number;
  handleToolCall: (toolCall: ToolCall) => void;
  reset: () => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(
  undefined
);

export function FileSystemProvider({
  children,
  fileSystem: providedFileSystem,
  initialData,
}: {
  children: React.ReactNode;
  fileSystem?: VirtualFileSystem;
  initialData?: ProjectData;
}) {
  const [fileSystem] = useState(() => {
    const fs = providedFileSystem || new VirtualFileSystem();
    if (initialData) {
      fs.deserializeFromNodes(initialData);
    }
    return fs;
  });
  // User's explicit pick (via file tree click). We *derive* the effective
  // selection below from this + the current file set, so a deleted/renamed
  // file gracefully falls back to /App.jsx or the first root file without
  // needing a setState-in-effect dance.
  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const files = fileSystem.getAllFiles();
  const selectedFile: string | null = (() => {
    if (userSelection && files.has(userSelection)) return userSelection;
    if (files.has("/App.jsx")) return "/App.jsx";
    const rootFiles = Array.from(files.keys())
      .filter((p) => p.split("/").filter(Boolean).length === 1)
      .sort();
    return rootFiles[0] ?? null;
  })();
  const setSelectedFile = setUserSelection;

  const createFile = useCallback(
    (path: string, content: string = "") => {
      fileSystem.createFile(path, content);
      triggerRefresh();
    },
    [fileSystem, triggerRefresh]
  );

  const updateFile = useCallback(
    (path: string, content: string) => {
      try {
        fileSystem.updateFile(path, content);
      } catch (err) {
        if (err instanceof FileLockedError) {
          // Locked files are intentional (templates, scaffolding). Silently
          // ignore so the UI does not explode; the AI handlers surface the
          // same condition to the model via string errors.
          return;
        }
        throw err;
      }
      triggerRefresh();
    },
    [fileSystem, triggerRefresh]
  );

  const deleteFile = useCallback(
    (path: string) => {
      try {
        fileSystem.deleteFile(path);
      } catch (err) {
        if (err instanceof FileLockedError) {
          // Same silent-ignore policy as updateFile — locked files are
          // intentional scaffolding, the UI should not throw.
          return;
        }
        throw err;
      }
      triggerRefresh();
    },
    [fileSystem, triggerRefresh]
  );

  const renameFile = useCallback(
    (oldPath: string, newPath: string): boolean => {
      let success: boolean;
      try {
        success = fileSystem.rename(oldPath, newPath);
      } catch (err) {
        if (err instanceof FileLockedError) return false;
        throw err;
      }
      if (!success) return false;

      // Preserve user's current view across the rename. If they were looking
      // at the renamed file (or a file inside a renamed directory), move the
      // pointer to the new path. The derived-selection logic will otherwise
      // auto-fall-back to /App.jsx, which loses their spot.
      setUserSelection((current) => {
        if (current === oldPath) return newPath;
        if (current && current.startsWith(oldPath + "/")) {
          return newPath + current.substring(oldPath.length);
        }
        return current;
      });
      triggerRefresh();
      return true;
    },
    [fileSystem, triggerRefresh]
  );

  const getFileContent = useCallback(
    (path: string) => {
      return fileSystem.readFile(path);
    },
    [fileSystem]
  );

  const getAllFiles = useCallback(() => {
    return fileSystem.getAllFiles();
  }, [fileSystem]);

  const reset = useCallback(() => {
    fileSystem.reset();
    setUserSelection(null);
    triggerRefresh();
  }, [fileSystem, triggerRefresh]);

  const handleToolCall = useCallback(
    (toolCall: ToolCall) => {
      const { toolName, args } = toolCall;
      if (!args) return;

      // Mirror server-side mutations on the client's VFS so the preview and
      // editor re-render as the stream progresses. Read-only tools (Read,
      // Grep, Skill) are ignored — they have no file-system side effects.
      switch (toolName) {
        case "Write": {
          const { path, content } = args as { path?: string; content?: string };
          if (!path || content === undefined) return;
          if (fileSystem.exists(path)) {
            updateFile(path, content);
          } else {
            createFile(path, content);
          }
          return;
        }

        case "Edit": {
          const { path, old_str, new_str, replace_all } = args as {
            path?: string;
            old_str?: string;
            new_str?: string;
            replace_all?: boolean;
          };
          if (!path || old_str === undefined || new_str === undefined) return;

          const current = fileSystem.readFile(path);
          if (current === null) return;

          let updated: string;
          if (replace_all) {
            if (!current.includes(old_str)) return;
            updated = current.split(old_str).join(new_str);
          } else {
            const idx = current.indexOf(old_str);
            if (idx === -1) return;
            // Mirror the server's uniqueness rule — if old_str is not unique,
            // the server's Edit call would fail too, so we skip the local
            // update rather than replacing only the first match.
            if (current.indexOf(old_str, idx + old_str.length) !== -1) return;
            updated =
              current.slice(0, idx) + new_str + current.slice(idx + old_str.length);
          }
          updateFile(path, updated);
          return;
        }

        case "FileManager": {
          const { command, path, new_path } = args as {
            command?: string;
            path?: string;
            new_path?: string;
          };
          if (!path) return;
          if (command === "rename" && new_path) {
            renameFile(path, new_path);
          } else if (command === "delete") {
            deleteFile(path);
          }
          return;
        }

        default:
          return;
      }
    },
    [fileSystem, createFile, updateFile, deleteFile, renameFile]
  );

  return (
    <FileSystemContext.Provider
      value={{
        fileSystem,
        selectedFile,
        setSelectedFile,
        createFile,
        updateFile,
        deleteFile,
        renameFile,
        getFileContent,
        getAllFiles,
        refreshTrigger,
        handleToolCall,
        reset,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
}
