import { describe, expect, test } from "vitest";
import {
  config,
  getDsImportMap,
  getFonts,
  getGoogleFontsUrl,
  getPreviewDomain,
  getThemeClass,
  hasComponentCss,
  shouldLoadTailwind,
} from "./client";

// These tests validate the *shape* of the helpers against the active
// `src/config/uigen.config.ts`. Assertions are deliberately loose about the
// DS in use so the suite passes no matter which example config is active —
// we only care that the helpers wire up correctly and return sensible
// primitives.

describe("config/client helpers", () => {
  test("config object loads with required top-level sections", () => {
    expect(config.brand).toBeDefined();
    expect(config.ds).toBeDefined();
    expect(config.prompts).toBeDefined();
    expect(typeof config.brand.name).toBe("string");
    expect(config.brand.name.length).toBeGreaterThan(0);
  });

  describe("getDsImportMap", () => {
    test("returns an entry per configured package, all pointing under /packages/", () => {
      const map = getDsImportMap();
      const keys = Object.keys(map);
      expect(keys.length).toBe(config.ds.packages.length);
      for (const pkg of config.ds.packages) {
        expect(map[pkg.npm]).toBe(`/packages/${pkg.outName}.js`);
      }
    });
  });

  describe("shouldLoadTailwind", () => {
    test("mirrors ds.tailwind as a strict boolean", () => {
      expect(shouldLoadTailwind()).toBe(config.ds.tailwind === true);
    });
  });

  describe("hasComponentCss", () => {
    test("true iff ds.componentCss has at least one entry", () => {
      const expected = (config.ds.componentCss?.length ?? 0) > 0;
      expect(hasComponentCss()).toBe(expected);
    });
  });

  describe("getThemeClass", () => {
    test("returns the configured class or empty string", () => {
      expect(getThemeClass()).toBe(config.ds.themeClass ?? "");
    });
  });

  describe("getPreviewDomain", () => {
    test("returns configured domain or the fallback", () => {
      const expected = config.brand.previewDomain ?? "preview.app";
      expect(getPreviewDomain()).toBe(expected);
    });
  });

  describe("getFonts", () => {
    test("returns the configured font list (possibly empty)", () => {
      expect(getFonts()).toEqual(config.ds.fonts ?? []);
    });
  });

  describe("getGoogleFontsUrl", () => {
    test("returns null when no fonts are configured, otherwise a Google Fonts URL", () => {
      const url = getGoogleFontsUrl();
      if (getFonts().length === 0) {
        expect(url).toBeNull();
      } else {
        expect(url).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
        expect(url).toContain("display=swap");
      }
    });

    test("encodes multi-word families with + and includes requested weights", () => {
      const fonts = getFonts();
      if (fonts.length === 0) return;
      const url = getGoogleFontsUrl()!;
      for (const font of fonts) {
        const encoded = font.family.replace(/ /g, "+");
        expect(url).toContain(`family=${encoded}`);
        for (const weight of font.weights ?? [400]) {
          expect(url).toContain(String(weight));
        }
      }
    });
  });
});
