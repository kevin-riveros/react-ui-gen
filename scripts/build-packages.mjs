import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Load uigen.config.ts
//
// The config file is authored in TypeScript so it stays type-safe in the
// editor. Node can't import .ts directly without a loader, so we bundle the
// config with esbuild (already a devDependency) into a temp ESM file and
// dynamic-import it. Much less friction than requiring `tsx` or `ts-node`.
// ---------------------------------------------------------------------------
async function loadConfig() {
  const cfgPath = resolve("src/config/uigen.config.ts");
  const tmpDir = join(tmpdir(), "uigen-build");
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `config-${Date.now()}.mjs`);

  await esbuild.build({
    entryPoints: [cfgPath],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: tmpFile,
    logLevel: "silent",
  });

  try {
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod.default;
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

const config = await loadConfig();
const packages = config.ds.packages;

// ---------------------------------------------------------------------------
// Require shim for package bundles
//
// esbuild emits `require("react")` calls in some DS packages. We map those
// to the ESM imports that the preview iframe's import map already resolves,
// so `require` becomes a lookup into the pre-imported modules rather than a
// runtime error.
// ---------------------------------------------------------------------------
const requireShim = `
import __React from "react";
import * as __ReactDOM from "react-dom";
import * as __JsxRuntime from "react/jsx-runtime";
import * as __JsxDevRuntime from "react/jsx-dev-runtime";
var __moduleMap = {
  "react": __React,
  "react-dom": __ReactDOM,
  "react/jsx-runtime": __JsxRuntime,
  "react/jsx-dev-runtime": __JsxDevRuntime,
};
var require = (id) => {
  if (__moduleMap[id]) return __moduleMap[id];
  throw new Error("Cannot require " + id);
};
`.trim();

mkdirSync("public/packages", { recursive: true });

for (const pkg of packages) {
  const outfile = `public/packages/${pkg.outName}.js`;
  try {
    await esbuild.build({
      entryPoints: [pkg.npm],
      bundle: true,
      format: "esm",
      outfile,
      external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
      minify: true,
      target: "es2020",
      jsx: "automatic",
      jsxImportSource: "react",
      platform: "browser",
      mainFields: ["module", "main"],
      conditions: ["import", "module", "browser", "default"],
      banner: { js: requireShim },
    });
    console.log(`✓ ${pkg.npm} → ${outfile}`);
  } catch (err) {
    console.error(`✗ ${pkg.npm} failed:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// DS component CSS bundle
//
// Concatenates the compiled CSS from each `componentCss` entry into a single
// stylesheet served via `<link>` inside the preview iframe.
//
// `@import` directives are stripped because the browser-side Tailwind runtime
// inside the preview can't resolve bare module specifiers (e.g.
// `@import "tailwindcss"`). Those are build-time directives; the CSS they
// reference must already be inlined in the source file being concatenated.
//
// Cascade-layer *declarations* (`@layer theme, base, components;`) are kept
// intact — pre-compiled DS stylesheets commonly depend on that ordering.
// Source-map URL comments are stripped so devtools don't 404 against paths
// that only exist in the upstream package.
// ---------------------------------------------------------------------------
const componentCssPaths = config.ds.componentCss ?? [];
let dsCss = "";
for (const relativePath of componentCssPaths) {
  const fullPath = join("node_modules", relativePath);
  try {
    let css = readFileSync(fullPath, "utf8");
    css = css.replace(/@import\s+["'][^"']+["'];?/g, "");
    css = css.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, "");
    dsCss += css + "\n";
  } catch (err) {
    console.error(`✗ componentCss ${relativePath} failed:`, err.message);
  }
}
writeFileSync("public/packages/styles-bundle.css", dsCss);
console.log(`✓ DS component CSS → public/packages/styles-bundle.css`);

// ---------------------------------------------------------------------------
// DS Tailwind config (tokens, utilities, base reset)
//
// Raw CSS containing native Tailwind v4 directives: @theme static, @utility,
// @layer base. Copied as-is (only stripping the sourcemap) so
// @tailwindcss/browser processes it in the preview iframe with correct
// cascade layer ordering:
//   - @theme static → registers CSS custom properties (design tokens)
//   - @utility      → utility classes
//   - @layer base   → reset styles at correct cascade priority
//
// Inlined into the <style type="text/tailwindcss"> block in the preview
// HTML, NOT loaded as a separate <link> stylesheet.
// ---------------------------------------------------------------------------
const tailwindConfigCss = config.ds.tailwindConfigCss;
if (tailwindConfigCss) {
  try {
    const fullPath = join("node_modules", tailwindConfigCss);
    let rawCss = readFileSync(fullPath, "utf8");
    rawCss = rawCss.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, "").trim();
    writeFileSync("public/packages/ds-tailwind-config.css", rawCss);
    console.log(`✓ DS tailwind config (raw) → public/packages/ds-tailwind-config.css`);
  } catch (err) {
    console.error(`✗ DS tailwind config failed:`, err.message);
  }
} else {
  // Still write an empty file so PreviewFrame's fetch doesn't 404.
  writeFileSync("public/packages/ds-tailwind-config.css", "");
  console.log(`✓ DS tailwind config (empty; none configured)`);
}
