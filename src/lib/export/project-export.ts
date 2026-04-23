/**
 * Pure helpers for packaging the virtual file system into a downloadable ZIP.
 *
 * The export is intentionally minimal — just the VFS contents, a
 * best-effort `package.json` listing the bare-specifier imports used inside
 * the generated components, and a README explaining the POC caveats. No
 * bundler config is emitted; the user wires the components into Vite /
 * Next.js / etc. on their own.
 */

import { config } from "@/lib/config/client";

/**
 * React version pinned in `package.json` for the exported project. Matches
 * the React runtime the preview iframe loads from esm.sh. Bump this in
 * lockstep with `react`/`react-dom` in the host app's `package.json` so a
 * user who `npm install`s the export gets a runtime compatible with the
 * generated JSX transform output.
 */
const EXPORT_REACT_VERSION = "^19.0.0";

/**
 * Version range used for every third-party package detected from VFS
 * imports. `latest` is deliberately loose — this is a POC export, and
 * resolving exact versions would require us to either pin against the host
 * app's lockfile (wrong version target) or call npm registry (network +
 * slow). The README is explicit that users may need to tighten versions.
 */
const EXPORT_PACKAGE_VERSION = "latest";

/**
 * File extensions the import scanner walks. Anything else in the VFS is
 * either static (CSS, images) or not a module the user can import packages
 * from, so there is no point parsing it.
 */
const SOURCE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

/**
 * Public attribution baked into every exported project. Credits the author
 * and links back to the hosted UI Gen instance so a recipient can trace
 * where the code came from. Kept as constants (not props) so the export
 * identity is uniform regardless of caller.
 */
const EXPORT_AUTHOR_NAME = "Kevin Riveros";
const EXPORT_AUTHOR_EMAIL = "kevinriverosg@gmail.com";
const EXPORT_HOMEPAGE = "https://uigen.kevinriveros.com";

const IMPORT_REGEX =
  /(?:import|export)\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g;

/**
 * Reduce a module specifier to its npm package name. Strips subpath imports
 * so `@heroui/react/button` collapses to `@heroui/react` (one dependency,
 * not two). Returns `null` for relative, absolute, or `@/` alias paths —
 * those resolve to local VFS files, not npm packages.
 */
export function extractPackageName(specifier: string): string | null {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("@/")
  ) {
    return null;
  }

  const parts = specifier.split("/");
  if (specifier.startsWith("@")) {
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

/**
 * Walk every source file in the VFS and collect unique npm package names
 * found in `import`/`export ... from '...'` statements. Only bare
 * specifiers count — local imports are filtered out by `extractPackageName`.
 */
export function collectUsedPackages(files: Map<string, string>): Set<string> {
  const packages = new Set<string>();
  for (const [path, content] of files) {
    if (!SOURCE_EXTENSIONS.some((ext) => path.endsWith(ext))) continue;

    IMPORT_REGEX.lastIndex = 0;
    let match;
    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      const pkg = extractPackageName(match[1]);
      if (pkg) packages.add(pkg);
    }
  }
  return packages;
}

/**
 * Build the exported `package.json` string. React and react-dom are always
 * included (every generated project imports them implicitly via the JSX
 * runtime), plus every package detected in the VFS. DS packages declared in
 * `uigen.config.ts` are merged in too, since the model sometimes leaves
 * their imports out even when the runtime needs them loaded for styling.
 *
 * @param packageName  npm-safe slug used for the `name` field (lowercased,
 *                     symbol-stripped — generated via `safeProjectName`).
 * @param displayName  Human-facing label (e.g. "Design #12345") surfaced
 *                     in the `description` so the original project name
 *                     is preserved even after slugifying for npm.
 * @param usedPackages Bare specifiers harvested from the VFS source files.
 */
export function buildPackageJson(
  packageName: string,
  displayName: string,
  usedPackages: Set<string>
): string {
  const dependencies: Record<string, string> = {
    react: EXPORT_REACT_VERSION,
    "react-dom": EXPORT_REACT_VERSION,
  };

  for (const pkg of config.ds.packages) {
    dependencies[pkg.npm] = EXPORT_PACKAGE_VERSION;
  }

  for (const pkg of usedPackages) {
    if (pkg === "react" || pkg === "react-dom") continue;
    if (dependencies[pkg]) continue;
    dependencies[pkg] = EXPORT_PACKAGE_VERSION;
  }

  const sortedDeps: Record<string, string> = {};
  for (const key of Object.keys(dependencies).sort()) {
    sortedDeps[key] = dependencies[key];
  }

  const pkgJson = {
    name: packageName,
    version: "0.0.1",
    private: true,
    description: `${displayName} — exported from UI Gen (POC scaffold, not production ready).`,
    author: {
      name: EXPORT_AUTHOR_NAME,
      email: EXPORT_AUTHOR_EMAIL,
      url: EXPORT_HOMEPAGE,
    },
    homepage: EXPORT_HOMEPAGE,
    dependencies: sortedDeps,
  };

  return JSON.stringify(pkgJson, null, 2) + "\n";
}

export function buildReadme(displayName: string): string {
  return `# ${displayName}

Exported from **[UI Gen](${EXPORT_HOMEPAGE})** — a proof-of-concept (POC)
tool for prototyping React UI from natural-language prompts.

**Author:** ${EXPORT_AUTHOR_NAME} &lt;${EXPORT_AUTHOR_EMAIL}&gt;
**Generated by:** [${EXPORT_HOMEPAGE}](${EXPORT_HOMEPAGE})

> ⚠️ **This is not a production-ready application.** It is a snapshot of
> the virtual file system used by UI Gen's in-browser preview. Expect to
> do cleanup before anything ships.

---

## Why this export may not "just run"

UI Gen does **not** run a Node.js toolchain in your browser. It has no
\`node_modules\`, no bundler, and no build step. Instead, the live
preview works like this:

1. The AI writes JSX/TSX files into an in-memory virtual file system.
2. The browser transforms each file with \`@babel/standalone\`.
3. Third-party packages are resolved through an import map pointing at
   [esm.sh](https://esm.sh), a CDN that serves npm packages as ES modules.
4. Tailwind (if your design system uses it) is compiled at runtime by
   \`@tailwindcss/browser\`.
5. Everything renders inside a sandboxed iframe with a generated
   \`importmap\` and inline styles.

That means:

- **There never was a real \`package.json\`**, a lockfile, or an
  installed dependency tree. The \`package.json\` in this ZIP is a
  **best-effort reconstruction** built by scanning the \`import\` /
  \`export ... from\` statements in your files.
- **Versions default to \`latest\`**. Pin them yourself if you care
  about reproducibility.
- **Private or internal design systems will not install** from a plain
  \`npm install\`. UI Gen bundles them locally during development;
  outside of UI Gen you either need access to the private registry or
  need to swap those imports for a public equivalent.
- **Imports may be wrong or missing** — the model occasionally omits an
  import or hallucinates a subpath that does not exist in the real
  package.
- **Tailwind config, PostCSS, and global CSS are not included.** UI Gen
  injects them into the preview iframe at runtime; a standalone host
  app has to set them up explicitly.

---

## What is in this ZIP

- Every file from the virtual file system, preserving its original path
  (with leading \`/\` stripped so it unzips cleanly into a project root).
- A generated **\`package.json\`** listing:
  - \`react\` and \`react-dom\` pinned to the version the UI Gen preview
    uses.
  - Every npm package referenced by a bare import in your source files.
  - Every design-system package declared in UI Gen's \`uigen.config.ts\`
    (even if your components did not explicitly import them — they are
    often needed for styling or theming).
- This **\`README.md\`**.

What is **not** included: \`node_modules\`, a lockfile, bundler config
(Vite / webpack / Next), TypeScript config, Tailwind config, PostCSS
config, \`.gitignore\`, HTML entry point, CI setup, tests.

---

## How to actually run the code

These are plain React components. Drop them into any React-compatible
toolchain.

### Option A — Vite (fastest for a standalone SPA)

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
# unzip the export into my-app/src/generated/ (or wherever)
# import the components from src/generated/App.jsx in src/App.tsx
npm install
# then install any extra deps listed in the exported package.json
npm run dev
\`\`\`

### Option B — Next.js

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
# unzip the export into my-app/app/generated/
# import and render the components from a page
npm install
npm run dev
\`\`\`

### Option C — Existing app

Copy the files into any folder of an existing React codebase. The
components use standard React + JSX, so anything that renders React
(CRA, Remix, RedwoodJS, Storybook, Docusaurus pages, Astro islands,
etc.) will work.

---

## Checklist for getting it to render without errors

Work through this list if the components fail to build or look broken:

1. **Install the dependencies** listed in the exported \`package.json\`.
   Delete any you know you do not need; add versions you want to pin.
2. **Set up Tailwind** if your components use utility classes. Follow
   the official Tailwind v4 install guide for your chosen framework.
3. **Re-add the design system's global CSS / tokens / fonts.** Check
   that DS's own docs — UI Gen loaded them into the iframe for you, but
   a standalone host app has to do it explicitly (usually in
   \`main.tsx\` / \`app/layout.tsx\`).
4. **Replace private DS imports** with a public DS (HeroUI, Material
   UI, shadcn/ui, Chakra, etc.) if the private package cannot be
   installed from your registry.
5. **Fix hallucinated imports.** If a package has no matching export,
   check the package's real API and adjust the import.
6. **Align file extensions** (\`.jsx\` vs \`.tsx\`) with what your host
   toolchain expects.
7. **Add a React entry point** (\`main.tsx\`, \`index.tsx\`,
   \`app/page.tsx\`) that renders the top-level component (usually
   \`App.jsx\`).

---

## TL;DR

This ZIP is a **starting point**, not a turnkey app. Treat it like code
you would code-review before merging: read it, run it locally, fix what
the POC harness was papering over, then decide if it belongs in your
codebase.

---

Made with [UI Gen](${EXPORT_HOMEPAGE}) · © ${EXPORT_AUTHOR_NAME}
`;
}

/**
 * Normalize a project label into something safe to use as a file/dir name
 * and as the `name` field in `package.json`. npm rejects names with
 * capitals, spaces, or most symbols — a conservative subset keeps us on
 * the safe side for every consumer (git, zip tooling, pnpm).
 */
export function safeProjectName(label: string | undefined): string {
  const cleaned = (label ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "ui-gen-project";
}
