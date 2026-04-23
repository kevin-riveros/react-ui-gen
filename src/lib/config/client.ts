/**
 * Client-safe config accessors. Re-exports the raw config object (which is a
 * plain TS literal, safe to bundle anywhere) plus derived helpers that don't
 * touch the filesystem. Server-only helpers (MD reads, skill directory scan)
 * live in `./loader`.
 */

import rawConfig from "#uigen-config";
import type { FontConfig, UIGenConfig } from "./define-config";

export const config: UIGenConfig = rawConfig;

/**
 * Build the import map used by the preview iframe. Every package declared in
 * `ds.packages` resolves to its built bundle at `/packages/<outName>.js`.
 * Merged with the React/DOM entries inside `createImportMap()`.
 */
export function getDsImportMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pkg of config.ds.packages) {
    map[pkg.npm] = `/packages/${pkg.outName}.js`;
  }
  return map;
}

export function getThemeClass(): string {
  return config.ds.themeClass ?? "";
}

/**
 * Whether to inject the Tailwind v4 browser runtime into the preview iframe.
 * Turned off for MUI/Chakra-style DS's whose runtime handles all styling.
 */
export function shouldLoadTailwind(): boolean {
  return config.ds.tailwind === true;
}

/**
 * Whether the configured DS ships precompiled component CSS that the build
 * script aggregates into `public/packages/styles-bundle.css`. When false the
 * preview skips the `<link>` to avoid an empty 200 in the server log.
 */
export function hasComponentCss(): boolean {
  return (config.ds.componentCss?.length ?? 0) > 0;
}

export function getFonts(): FontConfig[] {
  return config.ds.fonts ?? [];
}

/**
 * Build the Google Fonts `<link>` href for the configured families. Returns
 * `null` if no fonts are configured, so the caller can skip emitting the tag.
 *
 * Format: `family=Name:ital,wght@0,400;0,700;1,400`. We always include the
 * `ital` axis when `italic: true` so callers don't need to think about it.
 */
export function getGoogleFontsUrl(): string | null {
  const fonts = getFonts();
  if (fonts.length === 0) return null;

  const families = fonts.map((f) => {
    const weights = f.weights && f.weights.length > 0 ? f.weights : [400];
    const family = f.family.replace(/ /g, "+");
    if (f.italic) {
      const axis = weights
        .flatMap((w) => [`0,${w}`, `1,${w}`])
        .join(";");
      return `family=${family}:ital,wght@${axis}`;
    }
    return `family=${family}:wght@${weights.join(";")}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export function getBrand() {
  return config.brand;
}

/** Domain shown in the fake browser chrome around the preview iframe. */
export function getPreviewDomain(): string {
  return config.brand.previewDomain ?? "preview.app";
}
