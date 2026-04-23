<div align="center">

<img alt="UI Gen" src="https://github.com/user-attachments/assets/d6d566de-7a9d-4f74-887b-87c36bae9513" width="100px" />

# React UI Gen

### Prompt → Live React UI. Built with **your** design system. Rendered in your browser.

Describe what you want in plain English. Claude writes real React code against any design system you plug in — public npm, private registry, or your own monorepo package. The preview runs entirely in the browser. No containers. No sandboxes. No limits.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Built with Claude](https://img.shields.io/badge/Built_with-Claude-D97706?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/claude)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)

<br />

**[Live demo (coming soon)]** · [Plug in your design system](./src/docs/prototype-with-your-design-system.md) · [Design gallery](./src/config-examples) · [Report a bug](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=bug_report.md)

<br />

<img alt="UI Gen demo — prompt to live preview in seconds" src="https://via.placeholder.com/1200x600/0a0a0a/e50914?text=UI+Gen+%E2%80%94+demo+GIF+goes+here" width="100%" />

</div>

---

## Why UI Gen?

Every other AI UI prototyper ships with heavy runtime infra **and** a fixed stack. UI Gen is the opposite.

|                           | **UI Gen**       | v0                | Bolt                    | Lovable              | Galileo     |
| ------------------------- | ------------ | ----------------- | ----------------------- | -------------------- | ----------- |
| Your own design system?   | ✅ **Yes**      | shadcn only       | ❌ No                      | ❌ No                   | ❌ No          |
| Preview compute           | 🌐 **Browser**  | ☁️ Server            | 🐳 WebContainer | ☁️ Server             | ☁️ Cloud       |
| Open source               | 📖 **MIT**      | ❌ No                | Partial                 | ❌ No                   | ❌ No          |
| Private registry support  | 🔒 **Yes**      | ❌ No                | ❌ No                      | ❌ No                   | ❌ No          |

> **The big idea:** the design system is a plug-in, not a hardcode. Point `src/config/uigen.config.ts` at Material UI, HeroUI, a private `@your-scope/ds-core`, or your monorepo workspace — no engine changes, no rebuild of the app.

---

## ✨ What makes it wow

- 🌐 **100% browser-only preview.** Babel + `@tailwindcss/browser` + ESM import maps. No per-user containers. No WebContainer boot. Scales multi-tenant for free.
- 🎨 **Bring your own design system.** Public npm, private GitHub Packages, `pnpm link`, `file:` deps — all supported. One config file, zero engine changes.
- 🤖 **A real agent loop, not a completion endpoint.** Tool use (`Read` / `Write` / `Edit` / `Grep` / `Skill`) over a virtual filesystem, prompt caching, and context compression via Haiku for long sessions.
- 📚 **On-demand skills.** DS-specific reference docs in markdown — the agent loads them only when needed. Mirrors Claude Agent Skills.
- 🖼️ **Multimodal prompts.** Drop, paste, or attach screenshots. Say *"build this"* next to a mock — Claude gets the image alongside your text.
- ⚡ **Progressive rendering.** Components appear in the preview as the agent writes them, not at the end.
- 🎯 **Visual inspector.** Click any element in the preview to attach its tag, classes, source file, and line to your next message. The agent edits the right thing, not the closest thing.
- 🔐 **File locks.** Mark `Navbar.tsx`, `Footer.tsx`, or `index.css` as locked and the agent's `Write` / `Edit` tools refuse to touch them.
- 🧩 **Templates + starter files.** Start from a pre-built layout (Homepage, Dashboard, Profile) or a blank canvas seeded with your DS's entry files.
- ✂️ **Split editor.** Resizable three-panel layout — chat on the left, Preview ⇄ Code tabs on the right with a file tree and syntax highlighting.
- 🗂️ **Project switcher.** Jump between experiments from the header dropdown. State persists.
- 📦 **Download as ZIP.** Export the virtual filesystem with an auto-generated `package.json` and a README explaining how to wire it into Vite / Next.js / CRA.
- 🔗 **Share links.** Publish a read-only `/share/[projectId]` URL for design review — full-screen preview with an "Open in editor" handoff.
- 🧪 **Mock fallback.** Works without an API key. Canned responses for demos and CI.

---

## 🚀 Quick start

Ships preloaded with a **HeroUI + Netflix** design system so you can prototype immediately.

```bash
pnpm install
```

Copy `.env.example` to `.env` and paste your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

> 🔑 Get a key at [console.anthropic.com](https://console.anthropic.com). No key? The app falls back to a mock provider so you can still click around.

```bash
pnpm dev
```

Open <http://localhost:3000>. That's it.

<br />

> 👉 **Want to plug in your own design system?** Read [**Prototype with your design system →**](./src/docs/prototype-with-your-design-system.md) for the full tutorial (public npm, private registry, monorepo).

---

## 🎨 Design system gallery

Five ready-to-use configs live in [`src/config-examples/`](./src/config-examples/). Swap between them with a single `cp -r`.

<table>
  <tr>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-netflix"><img src="https://via.placeholder.com/400x250/e50914/ffffff?text=HeroUI+%E2%80%94+Netflix" alt="HeroUI Netflix" /></a>
      <br /><b>HeroUI — Netflix</b><br /><sub>✨ default · cinematic dark + red</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-airbnb"><img src="https://via.placeholder.com/400x250/ff385c/ffffff?text=HeroUI+%E2%80%94+Airbnb" alt="HeroUI Airbnb" /></a>
      <br /><b>HeroUI — Airbnb</b><br /><sub>coral, warm neutrals</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-uber"><img src="https://via.placeholder.com/400x250/000000/ffffff?text=HeroUI+%E2%80%94+Uber" alt="HeroUI Uber" /></a>
      <br /><b>HeroUI — Uber</b><br /><sub>monochrome, clean</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="./src/config-examples/material-ui"><img src="https://via.placeholder.com/400x250/1976d2/ffffff?text=Material+UI" alt="Material UI" /></a>
      <br /><b>Material UI</b><br /><sub>public npm, CSS-in-JS</sub>
    </td>
    <td align="center">
      <a href="./src/config-examples/vanilla-tailwind"><img src="https://via.placeholder.com/400x250/f9fafb/111827?text=Vanilla+%2B+Tailwind" alt="Vanilla" /></a>
      <br /><b>Vanilla Tailwind</b><br /><sub>React + Tailwind, no DS</sub>
    </td>
    <td align="center">
    </td>
  </tr>
</table>

---

## 📖 Learn more

Want to peek under the hood? Start here.

- 🧠 [**How it works**](./src/docs/how-it-works.md) — the pipeline from prompt to live preview, in one page.
- 🤖 [**The AI agent**](./src/docs/ai-agent.md) — tool use, skills, prompt caching, context compression.
- 🖼️ [**Browser preview engine**](./src/docs/browser-preview.md) — Babel, Tailwind, import maps, and the iframe.
- 🔐 [**API key security**](./src/docs/api-key-security.md) — where your key lives and who can see it.
- 🎨 [**Prototype with your design system**](./src/docs/prototype-with-your-design-system.md) — the full BYODS tutorial.
- ⚙️ [**Environment variables**](./src/docs/environment-variables.md) — every env var explained.
- 📜 [**Scripts reference**](./src/docs/scripts.md) — every `pnpm` command explained.

---

## 🛠️ Tech stack

<p>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" /></a>
  <a href="https://www.anthropic.com/claude"><img src="https://img.shields.io/badge/Claude-D97706?style=flat-square&logo=anthropic&logoColor=white" /></a>
  <a href="https://prisma.io"><img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" /></a>
  <a href="https://turso.tech"><img src="https://img.shields.io/badge/Turso-4FF8D2?style=flat-square&logo=turso&logoColor=black" /></a>
  <a href="https://esbuild.github.io"><img src="https://img.shields.io/badge/esbuild-FFCF00?style=flat-square&logo=esbuild&logoColor=black" /></a>
  <a href="https://babeljs.io"><img src="https://img.shields.io/badge/Babel-F9DC3E?style=flat-square&logo=babel&logoColor=black" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white" /></a>
</p>

---

## 🤝 Contributing

Contributions welcome — especially new design-system configs in [`src/config-examples/`](./src/config-examples/). See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and PR workflow.

## 💬 Community

- 🐛 [Report a bug](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=bug_report.md)
- 💡 [Request a feature](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=feature_request.md)
- 🔒 [Security disclosures](./SECURITY.md)
- 📜 [Code of Conduct](./CODE_OF_CONDUCT.md)

## 👤 Author

Built by **Kevin Riveros** — [GitHub](https://github.com/kevin-riveros) · [LinkedIn](https://www.linkedin.com/in/kevin-riveros/)

## 📄 License

MIT © [Kevin Riveros](https://github.com/kevin-riveros). See [LICENSE](./LICENSE).
