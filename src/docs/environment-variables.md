# ⚙️ Environment variables

Every env var UI Gen reads, and when you need to set it.

Copy `.env.example` to `.env` to get started:

```bash
cp .env.example .env
```

---

## 🔑 The only one that matters for local dev

### `ANTHROPIC_API_KEY`

Your Claude API key. Get one at [console.anthropic.com](https://console.anthropic.com).

- **Required for real AI.** Without it, UI Gen falls back to a mock provider with canned responses — the UI still works, but you can't actually prototype.
- Read server-side only. Never exposed to the browser.

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🗄️ Database (production only)

Local dev auto-creates a SQLite file at `./prisma/dev.db`. You don't need to touch these unless you're deploying.

### `DATABASE_URL`

A `libsql://` URL for remote SQLite. [Turso](https://turso.tech) works out of the box. Leave empty for local dev.

### `DATABASE_AUTH_TOKEN`

Auth token for the remote database. Required when `DATABASE_URL` points at a remote instance.

---

## 🐛 Debug logging

Useful if you're digging into how UI Gen talks to Claude.

### `LOG_LEVEL`

- `info` (default) — normal logs.
- `debug` — unlocks the Anthropic request/response middleware in `src/lib/ai-debug-middleware.ts`.

### `DEBUG_AI_FULL_PAYLOAD`

- `false` (default)
- `true` — dump every streamed chunk plus full tool schemas. Very noisy. Only turn on when you're actively debugging the agent loop.

---

## 📝 Notes

- `.env` is gitignored. Never commit it.
- The Claude model is picked from the chat UI and validated server-side against [`src/lib/ai/models.ts`](../lib/ai/models.ts) — there's no env var for it.
- On Vercel, set these in the project's Environment Variables tab. Use Turso for the database.
