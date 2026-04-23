# Vanilla example — Tailwind only

Zero-dependency starting point: no external design system, just React + Tailwind. Use this to prove the pipeline works end-to-end before swapping in a real DS.

## Use it

From the repo root:

```bash
rm -rf ./src/config
cp -r src/config-examples/vanilla/config ./src/config
pnpm install
rm -rf public/packages
pnpm prebuild
pnpm dev
```

Open <http://localhost:3000>. The system prompt tells Claude to build with semantic HTML + Tailwind. No packages get bundled into `public/packages/` — the preview iframe just loads React and your generated files.

**Restart the dev server** after swapping configs — the system prompt is read once at boot and cached.

## What to change

- **`config/uigen.config.ts`** — adjust `brand.name`, `brand.tagline`, and `ds.fonts` to taste.
- **`config/system-prompt.md`** — the persona + what tools/styles the model should reach for.
- **`config/skills/`** — on-demand reference documents. Add one per topic (forms, motion, data viz, etc.) with YAML frontmatter (`name` + `description`).

When you're ready to plug in a real DS, see [../../docs/prototype-with-your-design-system.md](../../docs/prototype-with-your-design-system.md).
