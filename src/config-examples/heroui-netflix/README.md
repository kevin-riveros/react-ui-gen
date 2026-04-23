# HeroUI — Netflix theme

HeroUI React components styled to match Netflix's visual language. The components come from `@heroui/react`; the aesthetic (colors, radii, fonts) lives entirely in `config/starter-files/index.css`.

## Use it

From the repo root:

```bash
# 1. Install runtime deps
pnpm add @heroui/react framer-motion

# 2. Copy config + starter files into the active slots
rm -rf ./src/config
cp -r src/config-examples/heroui-netflix/config ./src/config

# 3. Paste the Netflix preset CSS into src/config/starter-files/index.css
#    (Generate from https://heroui.com/themes → pick "Spotify" → Export CSS)

# 4. Rebuild + run
rm -rf public/packages
pnpm prebuild
pnpm dev
```

## Where the theme lives

`config/starter-files/index.css` is the **single file** that controls how Netflix-like the UI looks. It's seeded into every blank project and imported from `/App.jsx`. HeroUI reads the `--heroui-*` CSS variables and applies them to every component automatically.

To switch to another brand theme: replace the contents of `index.css` with a different export from `heroui.com/themes`. No rebuild of packages needed — only the preview iframe reloads.

## What's shipped

- `config/uigen.config.ts` — HeroUI packages wired up, Tailwind enabled, Inter as the display font (swap for whatever the theme spec suggests).
- `config/system-prompt.md` — teaches Claude HeroUI's import patterns and theming contract.
- `config/skills/heroui-components.md` — on-demand API reference for `Button`, `Card`, `Input`, `Select`, `Modal`, etc.
- `config/starter-files/App.jsx` — wraps the app in `<HeroUIProvider>` and imports `./index.css`.
- `config/starter-files/index.css` — **empty on purpose**. Paste the theme export here.
