# Material UI example

Demonstrates pointing the generator at a popular public-npm design system. No private registry, no `.npmrc` gymnastics.

## Use it

From the repo root:

```bash
# 1. Install the MUI runtime deps
pnpm add @mui/material @emotion/react @emotion/styled

# 2. Swap the active src/config/ folder (clobber whatever is there)
rm -rf ./src/config
cp -r src/config-examples/material-ui/config ./src/config

# 3. Rebuild the preview bundles and restart the dev server
rm -rf public/packages
pnpm prebuild
pnpm dev
```

Open <http://localhost:3000> and prompt something like *"build a settings page with tabs for Profile, Notifications, and Billing, using MUI."*

**Always restart `pnpm dev`** — the system prompt is read once at boot and cached.

## How it works

- `ds.packages` tells the build script to esbuild `@mui/material`, `@emotion/react`, and `@emotion/styled` into `public/packages/`.
- The import map in the preview iframe resolves those specifiers to the bundles.
- The system prompt + `mui-components` skill teach Claude the MUI API and theming pattern.

## Extending

- Want icons? `pnpm add @mui/icons-material` and append `{ npm: "@mui/icons-material", outName: "mui-icons-material" }` to `ds.packages` (the default MUI config in this repo already includes it).
- Want a different palette? Edit the `createTheme()` snippet in `config/system-prompt.md` or `config/skills/mui-components.md`.
- Want Roboto swapped for Inter? Update `ds.fonts[0].family`.
