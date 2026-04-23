# Prototype with your design system

**Plug your design system in and prototype UIs in the browser — no sandbox repo, no staging environment, no container runtime.**

Every other AI UI tool either ships with a fixed stack (shadcn, Tailwind) or runs your preview in a full Linux VM per user. UI Gen does neither. You point `src/config/uigen.config.ts` at your packages — **including packages on a private registry** — and the agent generates React code that renders live in a sandboxed `srcdoc` iframe running entirely in the user's browser.

## What you skip

If you've ever tried to let designers, PMs, or AI tools prototype against your DS, you've probably hit one of these:

- Spinning up a Storybook deployment just so someone can see your Button in isolation.
- Maintaining a separate "playground" repo with a hand-wired preview server.
- Publishing screenshot mocks into Figma because the actual components aren't easily accessible.
- Booting a WebContainer or sandbox VM per user, paying for compute per prototype.

With UI Gen, **none of that exists**:

- No sandbox / playground repo to keep in sync with your DS.
- No staging environment to deploy and maintain.
- No per-user container or VM — the preview is a `srcdoc` iframe in the browser.
- No server mocks — your DS's runtime (MUI's emotion, HeroUI's providers, your CSS tokens) loads directly into the iframe.

You write one config file, run `pnpm prebuild && pnpm dev`, and the AI is generating against your real components.

## The three ways to plug a DS in

| Where your DS lives | Setup | Typical users |
| --- | --- | --- |
| **Private registry** (GitHub Packages, Azure Artifacts, Verdaccio, CodeArtifact) | `.npmrc` + a PAT; add packages to `ds.packages` | Product teams with an internal DS |
| **Local folder / monorepo** | `pnpm link` or a `file:` / workspace dep | DS still in-progress, not published yet |
| **Public npm** (Material UI, Mantine, Chakra, HeroUI, Ant, Radix Themes…) | `pnpm add` + point `ds.packages` at the npm names | Hobby projects, public products, evaluation |

There's also a zero-DS starter at [`src/config-examples/vanilla-tailwind/`](../config-examples/vanilla-tailwind/) — plain React + Tailwind, useful to verify the pipeline before plugging in something real.

---

## 1. Anatomy of the config

`src/config/uigen.config.ts` declares four sections:

```ts
import { defineConfig, type UIGenConfig } from "@/lib/config/define-config";

const config: UIGenConfig = {
  brand: { name, tagline, chatPlaceholder },
  ds: {
    name,                   // short identifier, surfaced to the model
    tailwind,               // boolean — load @tailwindcss/browser in the preview
    packages,               // what to esbuild into public/packages/
    componentCss,           // precompiled CSS to concatenate
    tailwindConfigCss,      // Tailwind v4 config CSS with @theme / @utility
    themeClass,             // class applied to <body> in the preview iframe
    fonts,                  // Google Fonts
  },
  prompts: {
    systemPromptFile,       // DS-specific portion of the system prompt
    skillsDir,              // on-demand reference markdown files
  },
  templates: { dir },       // optional — starter templates shown on the home page
  starterFiles: { dir },    // optional — files seeded into every blank project's VFS
};

export default defineConfig(config);
```

Every field is typed by [`src/lib/config/define-config.ts`](../lib/config/define-config.ts) — your editor will tell you what's required.

**What the engine does with each field:**

| Field | Consumer |
|---|---|
| `brand.*` | Home page hero, chat empty-state, `<title>`, `<meta description>` |
| `ds.tailwind` | When `true`, loads @tailwindcss/browser in the preview and inlines `tailwindConfigCss`. Leave `false` for CSS-in-JS DS's (MUI, Chakra, Ant) to skip the runtime entirely. |
| `ds.packages` | `scripts/build-packages.mjs` esbuilds each into `public/packages/<outName>.js` and the import map |
| `ds.componentCss` | Concatenated into `public/packages/styles-bundle.css`; `<link>` only emitted when non-empty |
| `ds.tailwindConfigCss` | Only used when `ds.tailwind === true`. Inlined into the Tailwind input style so `@theme` / `@utility` directives apply |
| `ds.themeClass` | Applied to `<body>` of the preview iframe for scoped theming |
| `ds.fonts` | Emits a `<link>` to Google Fonts in the preview `<head>` |
| `prompts.systemPromptFile` | Read at boot, concatenated ahead of the engine's generic rules |
| `prompts.skillsDir` | Scanned at boot for `.md` files with `name` + `description` frontmatter; listed in `<available_skills>`, loaded on demand via the `Skill` tool |
| `starterFiles.dir` | Every file under this folder is copied into a fresh project's virtual filesystem on "Blank Canvas". Great for MUI's `theme.js` + `App.jsx` wrapping `<ThemeProvider>`, or a Tailwind `styles/theme.css`. |

---

## 2. Private registry — the primary flow

This is the use case UI Gen was built for: your DS isn't published to public npm, you don't want to deploy a Storybook, and you don't want to stand up a dedicated prototyping environment. You just want designers/PMs/the AI to iterate against the real components.

Example: GitHub Packages. The same playbook works for Azure Artifacts, Verdaccio, and CodeArtifact.

1. **Generate a PAT** with `read:packages` at <https://github.com/settings/tokens> and export it:
   ```bash
   # ~/.zshrc or ~/.bashrc
   export GITHUB_TOKEN=ghp_...
   ```
2. **Create an `.npmrc` at the repo root.** `.npmrc` is gitignored — tokens must never land in version control. Paste the template below and replace `@your-scope` with the npm scope of your packages:

   ```ini
   # .npmrc — replace @your-scope with your real scope (e.g. @acme, @my-company)
   @your-scope:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   //npm.pkg.github.com/:always-auth=true
   ```

   pnpm expands `${GITHUB_TOKEN}` from the shell at install time, so the token itself never sits in the file.
3. **Clone one of the committed configs as a starting point** (e.g. `material-ui` or `heroui-airbnb`), then edit the copy in `src/config/` to point at your scope:
   ```bash
   rm -rf ./src/config
   cp -r src/config-examples/material-ui/config ./src/config
   ```
4. **Install your DS packages.**
   ```bash
   pnpm add @your-scope/ds-core @your-scope/ds-icons
   ```
5. **Edit `src/config/uigen.config.ts`** — replace `ds.packages`, `ds.componentCss`, `ds.tailwindConfigCss`, `ds.fonts`, `ds.themeClass` with your values.
6. **Rewrite `src/config/system-prompt.md` and `src/config/skills/*.md`** with your DS's component names, token tables, and visual bar (see §5).
7. **Run.**
   ```bash
   pnpm prebuild && pnpm dev
   ```

That's the whole pipeline. No staging deploy, no sandbox repo, no cloud runtime.

**Troubleshooting install failures:**

- 401 / 404 → verify the PAT has `read:packages` and `$GITHUB_TOKEN` is set in the shell you ran `pnpm install` from.
- Scope mismatch → the `@your-scope:registry=` line must match the scope of the packages you're installing.
- Works locally but fails in CI → CI needs its own token exported as a secret, not the dev's.

---

## 3. Local / unpublished DS

When your DS lives in a sibling directory and isn't published anywhere yet.

**Option 1 — pnpm workspace / link.**
```bash
pnpm link --global ../my-ds
pnpm add my-ds --workspace
```
Then reference `my-ds` in `ds.packages` exactly like a published package. esbuild follows the symlink at build time.

**Option 2 — `file:` dependency.**
```json
// package.json
"dependencies": {
  "@your-scope/ds-core": "file:../my-ds/packages/ds-core"
}
```

**Option 3 — monorepo.** Put UI Gen and your DS in the same monorepo (Turborepo/pnpm workspaces), and `ds.packages` entries just reference the workspace package names.

The build script doesn't care where the package comes from — as long as esbuild can resolve the entry from `node_modules/<npm>`, it'll bundle.

---

## 4. Public npm

Example: Material UI.

1. **Start from the example.**

   ```bash
   rm -rf ./src/config && cp -r src/config-examples/material-ui/config ./src/config
   ```

2. **Install the runtime deps** the DS needs:

   ```bash
   pnpm add @mui/material @emotion/react @emotion/styled
   ```

3. **Build the preview bundles.** `pnpm prebuild` runs esbuild once and writes `public/packages/*.js`.
4. **Start the dev server.** `pnpm dev`. Prompt something like *"settings page with tabs for Profile, Notifications, Billing."*

For Mantine, Chakra, Radix Themes, Arco, Ant Design, HeroUI: the shape is identical. Point `ds.packages` at the npm names, adjust `componentCss` if the DS ships precompiled styles, update the system prompt + one skill file with the API cheat sheet, and you're done.

---

## 5. Writing good DS-specific prompts

The model sees three layers at runtime:

1. `src/config/system-prompt.md` — always in context.
2. Engine rules (response rules, tools, progressive rendering) — always in context. You don't write these.
3. `src/config/skills/*.md` — loaded on demand when the model calls the `Skill` tool.

**Put in `system-prompt.md`:**
- One-sentence persona ("You are building React UIs with <DS name>.").
- The handful of import sources the model will reach for (package names + what each offers).
- Top-level styling rules that apply to every component (token usage, theming pattern, spacing defaults).
- A hint to call `Skill` for anything deep.

**Put in `skills/*.md`:**
- Full component API reference with props and examples.
- Design token tables (color, type, spacing) that the model needs to quote exactly.
- Visual quality bar, accessibility rules.
- Stock image IDs, icon lists, any long enumeration.

Every skill file needs YAML frontmatter:

```markdown
---
name: your-skill-name
description: One-line description shown in the skill index.
---

# Body content here
```

The filename must match `<skill-name>.md` and the `name` in the frontmatter. The description appears to the model in the `<available_skills>` block, so write it like a choice affordance: *what would make the model pick this skill?*

Rule of thumb: keep `system-prompt.md` under ~300 words so it doesn't crowd the context every turn. Push the long reference into skills.

---

## 6. Common gotchas

| Symptom | Likely cause |
|---|---|
| Preview renders blank, console says `Failed to resolve module specifier "@your-scope/foo"` | Package missing from `ds.packages`, or missing `pnpm install` after editing it. |
| DS styles don't apply | `componentCss` path wrong, or your DS uses CSS-in-JS (no CSS to concat — leave `componentCss: []` and verify the emotion/styled-components runtime is in `ds.packages`). |
| Tailwind tokens missing | `tailwindConfigCss` path is wrong, or the file uses old Tailwind v3 syntax (not supported — upgrade or inline tokens as raw CSS). |
| Model ignores the DS | Persona too vague. Name the packages explicitly and give one concrete example import. |
| `.npmrc` token expands to empty | Shell env var not set in the session running `pnpm install`. Put the `export` in `~/.zshrc`, not just the terminal tab. |
| Old `public/packages/` files from the previous DS | `rm -rf public/packages && pnpm prebuild`. |

---

## 7. Going from template to shippable

Once your config works end-to-end, you'll want to:

- Move any DS-specific starter templates (pages, components you want users to fork from) into a folder and point `templates.dir` at it.
- Rename the brand (`brand.name`, `brand.tagline`) to match your product.
- Harden the build: run `pnpm build` to make sure `prebuild` succeeds from a clean `public/packages/`.
- If you plan to publish this repo publicly, double-check: `.npmrc` is gitignored, no tokens in `git log`, and the DS packages in `package.json` are replaced with the ones you actually want users to install.
