import { describe, expect, test } from "vitest";
import { normalizePath, resolveRelativePath } from "./path-utils";

describe("normalizePath", () => {
  test("root stays root", () => {
    expect(normalizePath("/")).toBe("/");
  });

  test("prepends leading slash to bare paths", () => {
    expect(normalizePath("App.jsx")).toBe("/App.jsx");
    expect(normalizePath("components/Button.tsx")).toBe(
      "/components/Button.tsx"
    );
  });

  test("strips trailing slash on non-root paths", () => {
    expect(normalizePath("/components/")).toBe("/components");
  });

  test("collapses consecutive slashes", () => {
    expect(normalizePath("//a//b///c")).toBe("/a/b/c");
  });

  test("idempotent on already-normalized paths", () => {
    expect(normalizePath("/a/b/c.tsx")).toBe("/a/b/c.tsx");
  });
});

describe("resolveRelativePath", () => {
  test("resolves ./sibling", () => {
    expect(resolveRelativePath("/app", "./Footer.jsx")).toBe("/app/Footer.jsx");
  });

  test("resolves ../parent", () => {
    expect(resolveRelativePath("/a/b", "../c.jsx")).toBe("/a/c.jsx");
  });

  test("walks multiple levels up", () => {
    expect(resolveRelativePath("/a/b/c", "../../x.css")).toBe("/a/x.css");
  });

  test("handles same-dir `.`", () => {
    expect(resolveRelativePath("/a/b", "./foo.css")).toBe("/a/b/foo.css");
  });

  test("bare segments join directly", () => {
    expect(resolveRelativePath("/a", "b/c.tsx")).toBe("/a/b/c.tsx");
  });
});
