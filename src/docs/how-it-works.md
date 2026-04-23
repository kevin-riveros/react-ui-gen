# 🧠 How it works

UI Gen turns a prompt into a live React preview in about a second. Here's the whole pipeline, in one page.

---

## 🌊 The flow

```text
You type a prompt
       │
       ▼
POST /api/chat  ──►  Claude (streaming, with tool use)
                          │
                          ▼
                   The agent calls tools:
                   Read · Write · Edit · Grep · Skill
                          │
                          ▼
                   Virtual filesystem (in-memory)
                          │
                          ▼
                   Babel transforms JSX → JS
                          │
                          ▼
                   Import map points at your DS bundles
                          │
                          ▼
                   Everything renders in an iframe.srcdoc
                          │
                          ▼
                   You see your UI 🎉
```

---

## 🧩 The moving parts

### 1. The chat UI

You type a prompt (and optionally drop a screenshot). The request goes to `/api/chat`.

### 2. The agent

Claude runs in a tool-use loop. It can `Read` existing files, `Write` or `Edit` new ones, `Grep` for patterns, and call `Skill` to load design-system reference docs on demand. See [The AI agent](./ai-agent.md).

### 3. The virtual filesystem

Every file the agent writes lives in an in-memory VFS — not your disk. This is why UI Gen scales: there's no per-user workspace to provision.

### 4. The browser preview

The VFS gets handed to a preview iframe. Babel transforms JSX in-browser, `@tailwindcss/browser` handles Tailwind at runtime, and an import map resolves `@heroui/react` (or your DS) to ESM bundles already sitting in `public/packages/`. See [Browser preview engine](./browser-preview.md).

### 5. Your design system

Your DS packages are pre-bundled by esbuild at `pnpm prebuild`. The preview iframe loads them directly — no server round-trip, no CDN. See [Prototype with your design system](./prototype-with-your-design-system.md).

---

## ⚡ Why it's fast (and cheap)

- **No containers.** No WebContainer boot, no Docker, no sandbox VM. Just an iframe.
- **No server compute for the preview.** Once the agent finishes writing code, rendering happens 100% in your browser.
- **Prompt caching.** Static parts of the system prompt are cached with `cacheControl: ephemeral` so subsequent turns are cheaper.
- **Skills load on demand.** DS reference docs (component APIs, design tokens) only enter context when Claude calls the `Skill` tool.

---

## 📖 Go deeper

- [The AI agent](./ai-agent.md) — tool use, skills, prompt caching, context compression.
- [Browser preview engine](./browser-preview.md) — how the iframe actually renders your code.
- [API key security](./api-key-security.md) — where your Claude key lives.
