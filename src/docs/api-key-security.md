# 🔐 API key security

Short version: **your Anthropic API key never reaches the browser.**

---

## 🚪 Where the key lives

`ANTHROPIC_API_KEY` is read from `process.env` inside Next.js server code only. Specifically:

- The `/api/chat` route handler (server-side).
- The Anthropic SDK instance is constructed on the server.

The browser never imports the key, never receives it in a response, and never sees it in dev tools.

---

## 🔄 The request flow

```text
Browser             Next.js server          Anthropic API
   │                      │                      │
   │  your prompt ───────►│                      │
   │                      │  + ANTHROPIC_API_KEY │
   │                      │─────────────────────►│
   │                      │                      │
   │                      │◄──── stream ─────────│
   │◄──── stream ─────────│                      │
   │                      │                      │
```

Your browser talks to your server. Your server talks to Anthropic. The key lives on the server only.

---

## 🧪 Mock mode

When `ANTHROPIC_API_KEY` is empty, the server swaps in a mock provider. No external call is made. Useful for demos, CI, and contributor onboarding without a paid key.

---

## 🛡️ What to watch for

- **Never** prefix an Anthropic-related env var with `NEXT_PUBLIC_`. That flag exposes env vars to the browser bundle.
- **Never** commit a `.env` file. It's in `.gitignore` for a reason.
- **On Vercel:** set `ANTHROPIC_API_KEY` in the Environment Variables tab, not in code.
- If you fork the repo and change the API route, double-check the key stays server-side.

---

## 📖 Related

- [Environment variables](./environment-variables.md) — every env var explained.
- [The AI agent](./ai-agent.md) — how the server uses the key.
