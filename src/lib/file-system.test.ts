import { beforeEach, describe, expect, test } from "vitest";
import { FileLockedError } from "./errors";
import { VirtualFileSystem } from "./file-system";

describe("VirtualFileSystem", () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  describe("createFile", () => {
    test("creates a file at the root", () => {
      const node = vfs.createFile("/App.jsx", "export const App = () => null;");
      expect(node).not.toBeNull();
      expect(node?.type).toBe("file");
      expect(node?.path).toBe("/App.jsx");
      expect(vfs.readFile("/App.jsx")).toBe("export const App = () => null;");
    });

    test("auto-creates missing parent directories", () => {
      vfs.createFile("/components/ui/Button.tsx", "// button");
      expect(vfs.exists("/components")).toBe(true);
      expect(vfs.exists("/components/ui")).toBe(true);
      expect(vfs.exists("/components/ui/Button.tsx")).toBe(true);
    });

    test("returns null when the file already exists", () => {
      vfs.createFile("/a.ts", "first");
      expect(vfs.createFile("/a.ts", "second")).toBeNull();
      expect(vfs.readFile("/a.ts")).toBe("first");
    });

    test("refuses to nest under a file-occupied segment without mutating the tree", () => {
      vfs.createFile("/a", "file-a");
      const before = vfs.getAllFiles().size;

      expect(vfs.createFile("/a/nested/b.ts", "b")).toBeNull();

      // No new paths introduced — in particular, /a/nested must not exist
      // as an orphan directory from a half-completed mutation.
      expect(vfs.getAllFiles().size).toBe(before);
      expect(vfs.exists("/a/nested")).toBe(false);
    });
  });

  describe("readFile", () => {
    test("returns null for missing files", () => {
      expect(vfs.readFile("/nope.tsx")).toBeNull();
    });

    test("returns null when the path points to a directory", () => {
      vfs.createDirectory("/components");
      expect(vfs.readFile("/components")).toBeNull();
    });
  });

  describe("updateFile", () => {
    test("updates content on an existing file", () => {
      vfs.createFile("/a.ts", "old");
      expect(vfs.updateFile("/a.ts", "new")).toBe(true);
      expect(vfs.readFile("/a.ts")).toBe("new");
    });

    test("returns false for missing files", () => {
      expect(vfs.updateFile("/missing.ts", "x")).toBe(false);
    });

    test("throws FileLockedError on locked files", () => {
      vfs.createFile("/locked.ts", "orig");
      vfs.setLocked("/locked.ts", true);
      expect(() => vfs.updateFile("/locked.ts", "x")).toThrow(FileLockedError);
      expect(vfs.readFile("/locked.ts")).toBe("orig");
    });
  });

  describe("deleteFile", () => {
    test("removes a file from the tree", () => {
      vfs.createFile("/a.ts", "x");
      expect(vfs.deleteFile("/a.ts")).toBe(true);
      expect(vfs.exists("/a.ts")).toBe(false);
    });

    test("recursively deletes a directory", () => {
      vfs.createFile("/dir/a.ts", "a");
      vfs.createFile("/dir/nested/b.ts", "b");
      expect(vfs.deleteFile("/dir")).toBe(true);
      expect(vfs.exists("/dir")).toBe(false);
      expect(vfs.exists("/dir/a.ts")).toBe(false);
      expect(vfs.exists("/dir/nested/b.ts")).toBe(false);
    });

    test("refuses to delete root", () => {
      expect(vfs.deleteFile("/")).toBe(false);
      expect(vfs.exists("/")).toBe(true);
    });

    test("throws FileLockedError on locked files (matches updateFile)", () => {
      vfs.createFile("/a.ts", "x");
      vfs.setLocked("/a.ts", true);
      expect(() => vfs.deleteFile("/a.ts")).toThrow(FileLockedError);
      expect(vfs.exists("/a.ts")).toBe(true);
    });

    test("throws when a locked descendant blocks a directory delete", () => {
      vfs.createFile("/dir/a.ts", "a");
      vfs.createFile("/dir/locked.ts", "x");
      vfs.setLocked("/dir/locked.ts", true);
      expect(() => vfs.deleteFile("/dir")).toThrow(FileLockedError);
      // The whole directory stays — no partial delete.
      expect(vfs.exists("/dir")).toBe(true);
      expect(vfs.exists("/dir/a.ts")).toBe(true);
      expect(vfs.exists("/dir/locked.ts")).toBe(true);
    });
  });

  describe("rename", () => {
    test("renames a file in place", () => {
      vfs.createFile("/a.ts", "hello");
      expect(vfs.rename("/a.ts", "/b.ts")).toBe(true);
      expect(vfs.exists("/a.ts")).toBe(false);
      expect(vfs.readFile("/b.ts")).toBe("hello");
    });

    test("refuses to overwrite an existing destination", () => {
      vfs.createFile("/a.ts", "a");
      vfs.createFile("/b.ts", "b");
      expect(vfs.rename("/a.ts", "/b.ts")).toBe(false);
      expect(vfs.readFile("/a.ts")).toBe("a");
      expect(vfs.readFile("/b.ts")).toBe("b");
    });

    test("throws FileLockedError when renaming a locked file", () => {
      vfs.createFile("/a.ts", "x");
      vfs.setLocked("/a.ts", true);
      expect(() => vfs.rename("/a.ts", "/b.ts")).toThrow(FileLockedError);
    });

    test("updates descendant paths when renaming a directory", () => {
      vfs.createFile("/old/child.ts", "child");
      vfs.createFile("/old/nested/grand.ts", "grand");
      expect(vfs.rename("/old", "/new")).toBe(true);
      expect(vfs.exists("/old/child.ts")).toBe(false);
      expect(vfs.exists("/new/child.ts")).toBe(true);
      expect(vfs.exists("/new/nested/grand.ts")).toBe(true);
      expect(vfs.readFile("/new/nested/grand.ts")).toBe("grand");
    });
  });

  describe("getAllFiles", () => {
    test("returns only files, not directories", () => {
      vfs.createFile("/a.ts", "A");
      vfs.createFile("/nested/b.ts", "B");
      const all = vfs.getAllFiles();
      expect(all.get("/a.ts")).toBe("A");
      expect(all.get("/nested/b.ts")).toBe("B");
      expect(all.has("/nested")).toBe(false);
    });
  });

  describe("serialize / deserialize round-trip", () => {
    test("round-trips file content and lock state", () => {
      vfs.createFile("/a.ts", "A");
      vfs.createFile("/dir/b.tsx", "B");
      vfs.setLocked("/a.ts", true);

      const snapshot = vfs.serialize();
      const fresh = new VirtualFileSystem();
      fresh.deserializeFromNodes(snapshot);

      expect(fresh.readFile("/a.ts")).toBe("A");
      expect(fresh.readFile("/dir/b.tsx")).toBe("B");
      expect(fresh.isLocked("/a.ts")).toBe(true);
      expect(fresh.isLocked("/dir/b.tsx")).toBe(false);
    });
  });

  describe("reset", () => {
    test("wipes everything back to an empty root", () => {
      vfs.createFile("/a.ts", "x");
      vfs.createFile("/b/c.ts", "y");
      vfs.reset();
      expect(vfs.getAllFiles().size).toBe(0);
      expect(vfs.exists("/")).toBe(true);
      expect(vfs.exists("/a.ts")).toBe(false);
    });
  });
});
