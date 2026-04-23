import { describe, expect, test } from "vitest";
import { getImportMapAliases } from "./jsx-transformer";

// Only `getImportMapAliases` is covered here — the rest of `jsx-transformer`
// leans on `@babel/standalone` + DOM APIs and needs a browser-like harness.
// Broader transformer tests are tracked as #10 in CODE_QUALITY.md.

describe("getImportMapAliases", () => {
  test("expands an absolute .tsx file to all 6 canonical shapes", () => {
    const aliases = getImportMapAliases("/components/Button.tsx");
    expect(new Set(aliases)).toEqual(
      new Set([
        "/components/Button.tsx",
        "components/Button.tsx",
        "@/components/Button.tsx",
        "/components/Button",
        "components/Button",
        "@/components/Button",
      ])
    );
  });

  test("works for .jsx / .js / .ts too", () => {
    for (const ext of [".jsx", ".js", ".ts"]) {
      const aliases = getImportMapAliases(`/foo/bar${ext}`);
      expect(aliases).toContain(`/foo/bar${ext}`);
      expect(aliases).toContain("/foo/bar");
      expect(aliases).toContain("@/foo/bar");
    }
  });

  test("skips extension-stripping variants when the path has no recognized extension", () => {
    const aliases = getImportMapAliases("/styles/theme.css");
    expect(new Set(aliases)).toEqual(
      new Set([
        "/styles/theme.css",
        "styles/theme.css",
        "@/styles/theme.css",
      ])
    );
  });

  test("does not inject slash/`@` variants for non-absolute paths", () => {
    const aliases = getImportMapAliases("relative.tsx");
    expect(aliases).toEqual(["relative.tsx", "relative"]);
  });

  test("no duplicate keys — the registration loop can't double-write", () => {
    const aliases = getImportMapAliases("/App.tsx");
    expect(aliases.length).toBe(new Set(aliases).size);
  });
});
