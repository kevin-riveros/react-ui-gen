<div align="center">

<img width="927" height="540" alt="Screenshot 2026-04-22 at 10 56 33 PM" src="https://github.com/user-attachments/assets/897fad90-0a54-4ebd-b09b-013a9ecfb651" />


# React UI Gen

### Prompt → Live React UI. Built with **your** design system. Rendered in your browser.

Describe what you want in plain English. Claude writes real React against any design system you plug in — public npm, private registry, or your own monorepo package. The preview renders in your browser as the agent types. No servers to spin up, no WebContainers to boot, no infra to maintain.

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

<img width="718" height="374" alt="react-gen-ui-gift" src="https://github.com/user-attachments/assets/5da85460-d37c-4204-b526-1a8d4e8cfabe" />




**[Live demo](https://www.youtube.com/watch?v=pS647ckCcN4)** · [Plug in your design system](./src/docs/prototype-with-your-design-system.md) · [Design gallery](./src/config-examples) · [Report a bug](https://github.com/kevin-riveros/react-ui-gen/issues/new?template=bug_report.md)

<br />


</div>

---

## What it is

React UI Gen is a **prototyping surface**, not an IDE. You open it, pick a template, and describe the UI you want. Claude writes real React against *your* design system — the one your team actually uses, even if it lives on a private registry. The preview renders live in your browser as the agent writes.

You're not running your production app here. You're iterating on components — fast, in isolation, against the real design-system contract.

---

## Why not v0, Bolt, or Lovable

Every other AI UI prototyper ships heavy runtime infra **and** a fixed stack. UI Gen does the opposite.

|                           | **UI Gen**       | v0                | Bolt.new                    | Lovable              |
| ------------------------- | ------------ | ----------------- | ----------------------- | -------------------- |
| Your own design system?   | ✅ **Yes**      | shadcn only (beta) | ❌ No                      | ❌ No                   |
| Preview compute           | 🌐 **Browser**  | ☁️ Server            | 🐳 WebContainer | ☁️ Server             |
| Open source               | 📖 **MIT**      | ❌ No                | Partial                 | ❌ No                   |
| Private registry support  | 🔒 **Yes**      | ❌ No                | ❌ No                      | ❌ No                   |

The design system is a plug-in, not a hardcode. Point `src/config/uigen.config.ts` at Material UI, HeroUI, a private `@your-scope/ds-core`, or a monorepo workspace — no engine changes, no rebuild.

---


<br />
<img alt="Screenshot 2026-04-22 at 9 23 40 PM" src="https://github.com/user-attachments/assets/939e730d-5308-4995-982b-5d57f8aae9c1" />
<br />


## How it works

### 🌐 Browser-only preview

Babel standalone + `@tailwindcss/browser` + ESM import maps, rendered inside a `srcdoc` iframe. No per-user container, no WebContainer, no server-side preview compute. A hosted instance serves 1 user or 10,000 with the same footprint.

### 🎨 Your design system, not a fixed one

One config file (`src/config/uigen.config.ts`) points the engine at any DS — public npm, GitHub Packages, `file:` deps, `pnpm link`, or a monorepo workspace. Swap Material UI for HeroUI for `@your-scope/ds-core` without touching engine code.

### 🧪 Built to prototype, not to run a project

Every session starts from an **isolated template** — not a blank `create-next-app`. The agent only sees the DS contract and the canvas, not 10k files of boilerplate. Every token goes into *your* components instead of Claude re-scaffolding Next.js on every turn. Short context, cheap sessions, fast iteration.

### 🛡️ Security by default

Tool use writes to an **in-memory virtual filesystem**, not your disk. The preview runs inside a **browser iframe**, not on your host. Private packages resolve inside that sandbox — nothing ever lands in your `node_modules`. A malicious skill or a prompt injection has no shell, no filesystem, nowhere to go.

### 🤖 A real agent loop

Tool use (`Read` / `Write` / `Edit` / `Grep` / `Skill`) over the virtual filesystem. Prompt caching trims long sessions; context compression via Haiku keeps them alive past the usual wall. DS-specific docs load on-demand through `Skill`, so the system prompt stays short.

---

## Everything else in the box

- 🖼️ **Multimodal chat.** Drop a screenshot, paste from clipboard, or attach from disk. Say *"build this"* next to a mock — Claude gets the image alongside your text, in the same turn.
- 🎯 **Visual inspector.** Click any element in the preview. Its tag, classes, source file, and line attach to your next message — the agent edits the right thing, not the closest thing.
- 🔐 **File locks.** Mark `Navbar.tsx`, `Footer.tsx`, or `index.css` as locked. The agent's `Write` / `Edit` tools refuse to touch them.
- ⚡ **Progressive rendering.** Components appear in the preview as the agent writes them, not at the end of a batch response.
- 🧩 **Templates + project switcher.** Start from Homepage, Dashboard, Profile, or a blank canvas seeded with your DS entry files. Jump between experiments from the header.
- 🔗 **Share links.** Publish a read-only `/share/[projectId]` URL for design review — full-screen preview with an "Open in editor" handoff.
- 📦 **Download as ZIP.** Export the virtual filesystem with a generated `package.json` and a README explaining how to wire into Vite / Next.js / CRA.
- ✂️ **Split editor.** Resizable three-panel layout — chat on the left, Preview ⇄ Code tabs on the right with a file tree and syntax highlighting.
- 🧪 **Mock fallback.** Works without an API key — canned responses for demos and CI.

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
      <a href="./src/config-examples/heroui-netflix">
        <img width="1506" height="783" alt="Screenshot 2026-04-22 at 10 20 00 PM" src="https://github.com/user-attachments/assets/0b7f0c0b-8156-4520-9970-b344bc192d69" />
      </a>
      <br /><b>HeroUI — Netflix</b><br /><sub>✨ cinematic dark + red</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-airbnb"><img width="1506" height="786" alt="Screenshot 2026-04-22 at 10 20 39 PM" src="https://github.com/user-attachments/assets/41e06eb5-57a3-4a95-8ef0-85046d5292e3" /></a>
      <br /><b>HeroUI — Airbnb</b><br /><sub>coral, warm neutrals</sub>
    </td>
    <td align="center" width="33%">
      <a href="./src/config-examples/heroui-uber">
        <img width="1510" height="781" alt="Screenshot 2026-04-22 at 10 23 06 PM" src="https://github.com/user-attachments/assets/8f8f26d9-4e32-49a3-952b-0bbdbae58d26" />
      </a>
      <br /><b>HeroUI — Uber</b><br /><sub>monochrome, clean</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="./src/config-examples/material-ui">Material UI</a>
      <br /><sub>public npm, CSS-in-JS</sub>
    </td>
    <td align="center">
      <a href="./src/config-examples/vanilla-tailwind">Vanilla Tailwind</a>
      <br /><sub>React + Tailwind, no DS</sub>
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
