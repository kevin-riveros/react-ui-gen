<div align="center">

# UI Gen

### AI-powered React UI prototyping against **your** design system

Describe what you want in plain language. Claude builds live, interactive components using any design system you point it at — public npm, private registry, or local monorepo package. Everything renders in a sandboxed preview iframe with zero server-side containers.

<!-- BADGES -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Built with Claude](https://img.shields.io/badge/built%20with-Claude-D97706)](https://www.anthropic.com/claude)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/kevin-riveros/react-ui-gen?style=social)](https://github.com/kevin-riveros/react-ui-gen)

<!-- CTA ROW -->

<!-- TODO: link to live demo once deployed -->
**Live demo (coming soon)** · [Plug in your design system](./src/docs/prototype-with-your-design-system.md) · [Config gallery](./src/config-examples) · [Report a bug](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=bug_report.md)

<!-- HERO MEDIA -->

<!-- TODO: replace with a real demo GIF (≤10s, 1200px wide) once recorded -->

<img alt="UI Gen demo — prompt to live preview in seconds" src="https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=UI+Gen+%E2%80%94+demo+GIF+goes+here" width="100%" />

<br />

<!-- TODO: drop a 60s walkthrough once recorded -->
<!-- [▶ Watch the 60-second walkthrough](https://www.loom.com/share/...) -->

</div>

---

## Why UI Gen?

Every other AI UI prototyper ships with heavy runtime infra **and** a fixed stack:

|                           | UI Gen       | v0                | Bolt                    | Lovable              | Galileo     |
| ------------------------- | ------------ | ----------------- | ----------------------- | -------------------- | ----------- |
| Your own design system?   | **Yes**      | shadcn only       | No                      | No                   | No          |
| Preview compute           | **Browser**  | Server            | WebContainer (~50MB/user) | Server             | Cloud       |
| Open source               | **MIT**      | No                | Partial                 | No                   | No          |
| Private registry support  | **Yes**      | No                | No                      | No                   | No          |
| Self-hostable             | **One `vercel deploy`** | No     | No                      | No                   | No          |

The big idea: **the design system is a plug-in, not a hardcode.** Swap `src/config/uigen.config.ts` and point it at Material UI, HeroUI, a private `@your-scope/ds-core`, or a monorepo workspace — no engine changes, no rebuild of the app, just `pnpm prebuild && pnpm dev`.

## Features

### AI engine

- **Browser-only preview.** Babel + `@tailwindcss/browser` + ESM import maps — no per-user containers, no WebContainer boot, scales multi-tenant for free.
- **Bring your own design system.** Config-driven bundling via esbuild. Public npm, private GitHub Packages, `pnpm link`, `file:` deps — all supported.
- **Real agent loop.** Tool use (`Read` / `Write` / `Edit` / `Grep` / `Skill`) over a virtual filesystem, prompt caching with `cacheControl: ephemeral`, context compression via Haiku for long sessions.
- **On-demand skills.** DS-specific reference docs in markdown with YAML frontmatter — the agent loads them only when needed (mirrors Claude Agent Skills).
- **Multimodal prompts.** Drop, paste, or attach screenshots into the chat — images are resized to 2048px, encoded as base64, and sent to Claude alongside the text so you can say "build this" next to a mock.
- **Mock fallback.** Works without an API key thanks to a canned-response provider — great for demos and CI.
- **Progressive rendering.** Components appear in the preview as the agent writes them, not at the end.

### Workspace & editor

- **Visual inspector.** Click any element in the preview to capture its tag, classes, source file, and line — then attach that context to your next message so the agent edits the right thing instead of guessing.
- **File locks.** Mark files as locked (e.g. a template's `Navbar.tsx`, `Footer.tsx`, or `index.css`) and the agent's `Write` / `Edit` / `FileManager` tools refuse to touch them. Locks are declared per-template in `meta.json` and surfaced with a lock icon in the file tree.
- **Templates.** Start from a pre-built layout (Homepage, New Season, Profile, Dashboard) instead of a blank canvas — each ships its own locked scaffolding and seed files.
- **Starter files.** Every new blank project seeds a `uigen.config.ts`-defined set of files (entry, styles, etc.) so the agent has a real skeleton to iterate on from turn one.
- **Split editor.** Resizable three-panel layout — chat on the left, Preview/Code tabs on the right. Toggle to **Code** for a file tree + syntax-highlighted editor side-by-side with the iframe.
- **Project switcher.** Saved projects live in the header dropdown — jump between experiments without losing state.
- **Download as ZIP.** Export the virtual filesystem as a ready-to-read archive with an auto-generated `package.json` (pinned deps + detected imports) and a README explaining how to wire it into Vite / Next.js / CRA. Remember: it's a prototype export, not a production build.
- **Share links.** Publish a read-only `/share/[projectId]` URL — the preview renders full-screen with an "Open in editor" handoff, perfect for design review.

## Quick start

```bash
git clone https://github.com/kevin-riveros/react-ui-gen.git
cd react-ui-gen
pnpm install

# Pick a design system (zero-deps vanilla, or one of the examples)
rm -rf ./src/config
cp -r src/config-examples/vanilla/config ./src/config

cp .env.example .env      # then fill in ANTHROPIC_API_KEY (or skip — mock mode works)
pnpm dev
```

Open <http://localhost:3000>. No API key? The app falls back to a mock provider so you can still click around.

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkevin-riveros%2Freact-ui-gen&env=ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20from%20console.anthropic.com&project-name=ui-gen&repository-name=ui-gen)

Set `ANTHROPIC_API_KEY` during the import wizard. For a remote DB, also set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` (Turso works out of the box).

## Design system gallery

Nine ready-to-use configs live in [`src/config-examples/`](./src/config-examples/). Swap between them with a single `cp -r`:

<!-- TODO: replace placeholders with real screenshots of each preview -->

<table>
  <tr>
    <td align="center" width="33%">
      <a href="./src/config-examples/vanilla"><img src="https://via.placeholder.com/400x250/f9fafb/111827?text=Vanilla+%2B+Tailwind" alt="Vanilla" /></a>
      <br /><b>Vanilla Tailwind</b><br /><sub>React + Tailwind, no DS</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/material-ui"><img src="https://via.placeholder.com/400x250/1976d2/ffffff?text=Material+UI" alt="Material UI" /></a>
      <br /><b>Material UI</b><br /><sub>Public npm, CSS-in-JS</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-airbnb"><img src="https://via.placeholder.com/400x250/ff385c/ffffff?text=HeroUI+%E2%80%94+Airbnb" alt="HeroUI Airbnb" /></a>
      <br /><b>HeroUI — Airbnb</b><br /><sub>Coral, warm neutrals</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="./src/config-examples/heroui-netflix"><img src="https://via.placeholder.com/400x250/e50914/ffffff?text=HeroUI+%E2%80%94+Netflix" alt="HeroUI Netflix" /></a>
      <br /><b>HeroUI — Netflix</b><br /><sub>Red accent, dark UI</sub>
    </td>
    <td align="center">
      <a href="./src/config-examples/heroui-uber"><img src="https://via.placeholder.com/400x250/000000/ffffff?text=HeroUI+%E2%80%94+Uber" alt="HeroUI Uber" /></a>
      <br /><b>HeroUI — Uber</b><br /><sub>Monochrome, clean</sub>
    </td>
  </tr>
  <tr>
</table>

Full walkthrough for plugging in a private DS — no sandbox repo, no staging environment, no container runtime: [**Prototype with your design system →**](./src/docs/prototype-with-your-design-system.md).

## How it works

```text
User prompt ─► POST /api/chat ─► Anthropic Claude (streaming)
                                      │
                                      ▼
                             Tool calls (Read / Write / Edit / Grep / Skill)
                                      │
                                      ▼
                             VirtualFileSystem (in-memory)
                                      │
                                      ▼
                             Stream results to client
                                      │
                                      ▼
                    Babel transform ─► Import map ─► iframe.srcdoc
                                      │
                                      ▼
                             Live React preview with your DS
```

Deep dives:

- [Component generation pipeline, end-to-end](./src/docs/01-component-generation.md)
- [Architecture diagrams](./src/docs/02-architecture-diagram.md) (Mermaid)
- [Render core — Babel + Tailwind + iframe internals](./src/docs/04-render-core.md)
- [API key security model](./src/docs/05-api-key-security.md)
- [Prototype with your design system](./src/docs/prototype-with-your-design-system.md) — plug in a private or public DS and prototype client-side

## Environment variables

| Variable                      | Required           | Description                                                                                                          |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`           | Yes (for real AI)  | Claude API key. Without it, the app falls back to a mock provider with canned responses.                             |
| `NEXT_PUBLIC_ANTHROPIC_MODEL` | No                 | Claude model id. Default: `claude-opus-4-6`.                                                                         |
| `DATABASE_URL`                | Prod only          | `libsql://...` for Turso, or any non-`file:` URL for remote. Empty locally → SQLite at `./prisma/dev.db`.            |
| `DATABASE_AUTH_TOKEN`         | Prod only          | Auth token for the remote database.                                                                                  |
| `LOG_LEVEL`                   | No                 | `info` (default) or `debug` — `debug` unlocks AI request/response middleware logs.                                   |
| `DEBUG_AI_FULL_PAYLOAD`       | No                 | `true` to dump every streamed chunk (very noisy).                                                                    |

## Scripts

| Command                 | What it does                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm dev`              | Validate config, ensure DS bundles + Prisma client + SQLite DB, start Next.js with Turbopack               |
| `pnpm validate-config`  | Check that `src/config/uigen.config.ts` and every path it references are intact. Runs before `dev`/`build` |
| `pnpm prebuild`         | Regenerate Prisma client + rebundle DS packages from the active config                                     |
| `pnpm build`            | Run `prebuild`, then production Next.js build                                                              |
| `pnpm vercel-build`     | Alias of `pnpm build` — used as the Vercel build command                                                   |
| `pnpm start`            | Start production server                                                                                    |
| `pnpm db:push:local`    | Create/sync the local SQLite DB against the Prisma schema                                                  |
| `pnpm db:push:remote`   | Push schema to the DB at `DATABASE_URL` (requires env vars set)                                            |
| `pnpm lint`             | Run ESLint                                                                                                 |

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router + Turbopack) · [React 19](https://react.dev) · TypeScript
- [Anthropic Claude](https://www.anthropic.com/claude) via [`@ai-sdk/anthropic`](https://sdk.vercel.ai)
- [Tailwind CSS v4](https://tailwindcss.com) + [`@babel/standalone`](https://babeljs.io/docs/babel-standalone) for in-iframe compilation
- [Prisma](https://prisma.io) + [libSQL adapter](https://github.com/prisma/prisma/tree/main/packages/adapter-libsql) (SQLite local, [Turso](https://turso.tech) in prod)
- [esbuild](https://esbuild.github.io) for design-system package bundling

## Contributing

Contributions welcome — especially new design-system configs in [`src/config-examples/`](./src/config-examples/).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, PR workflow, and how to add a new DS example.

## Community

- 🐛 [Report a bug](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=bug_report.md)
- 💡 [Request a feature](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=feature_request.md)
- 🔒 Security disclosures — see [SECURITY.md](./SECURITY.md)
- 📜 Code of Conduct — see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Author

Built by **Kevin Riveros**.

- GitHub — [@kevin-riveros](https://github.com/kevin-riveros)
- LinkedIn — [in/kevin-riveros](https://www.linkedin.com/in/kevin-riveros/)

## License

MIT © [Kevin Riveros](https://github.com/kevin-riveros). See [LICENSE](./LICENSE).
