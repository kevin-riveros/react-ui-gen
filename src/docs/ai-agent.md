# 🤖 The AI agent

UI Gen doesn't just call Claude with a prompt and paste the output. It runs Claude as a real agent — with tools, a filesystem, and on-demand reference docs.

---

## 🔧 The tools

Claude can call any of these during a turn:

| Tool | What it does |
|---|---|
| **`Read`** | Read a file from the virtual filesystem. |
| **`Write`** | Create a new file. |
| **`Edit`** | Modify an existing file (string replacement, with locked-file protection). |
| **`Grep`** | Search for patterns across the VFS. |
| **`Skill`** | Load a design-system reference doc on demand. |

The loop continues until Claude decides it's done (or hits a hard turn limit).

---

## 📚 Skills — reference docs that load only when needed

A skill is just a markdown file with YAML frontmatter:

```markdown
---
name: heroui-components
description: HeroUI component API reference — props, variants, composition patterns.
---

# Full component reference here...
```

Skills live in `src/config/skills/`. At boot, UI Gen scans the folder and lists every skill in `<available_skills>` so Claude sees them as options. The body of each skill only enters the conversation when Claude calls the `Skill` tool.

**Why this matters:** you can give the agent a 10,000-word component reference without paying for those tokens on every turn. Claude pulls it in only when it's actually building that component.

This mirrors [Claude Agent Skills](https://www.anthropic.com/news/agent-skills).

---

## 💾 Prompt caching

Static parts of the system prompt (your DS persona, the engine rules, the tool schemas) are marked with `cacheControl: ephemeral`. Anthropic caches them for ~5 minutes, so every turn after the first is cheaper and faster.

---

## 📉 Context compression

Long sessions accumulate turns. When context gets heavy, UI Gen spins up a Haiku call to summarize earlier turns and replaces them with the summary — keeping the key decisions, dropping the noise. You get longer coherent sessions without blowing the window.

---

## 🖼️ Multimodal input

Drop, paste, or attach screenshots in the chat. Images are:

1. Resized to a max of 2048px.
2. Encoded as base64.
3. Sent alongside your text in the same message.

So you can literally drag a Figma screenshot into the chat and say *"build this."*

---

## 🧪 Mock mode

No `ANTHROPIC_API_KEY`? UI Gen falls back to a canned-response provider. You can still click around, see the UI, and demo the app. Handy for CI and quick screenshots.

---

## 📖 Related

- [How it works](./how-it-works.md) — the whole pipeline.
- [Browser preview engine](./browser-preview.md) — what happens after Claude writes code.
- [Prototype with your design system](./prototype-with-your-design-system.md) — how to write good skills for your DS.
