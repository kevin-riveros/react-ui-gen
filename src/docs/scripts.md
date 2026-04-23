# 📜 Scripts reference

Every `pnpm` command in the repo, and when you'd actually run it.

---

## 🏃 Daily drivers

### `pnpm dev`

Start the dev server. Validates the config, makes sure design-system bundles and the SQLite DB exist, then boots Next.js with Turbopack.

This is the one you run 99% of the time.

### `pnpm build`

Production build. Runs `prebuild` first, then `next build`.

### `pnpm start`

Start the production server (after `pnpm build`).

---

## 🧩 Design-system pipeline

### `pnpm validate-config`

Checks that `src/config/uigen.config.ts` and every path it references are intact. Runs automatically before `dev` and `build`.

### `pnpm prebuild`

Regenerates the Prisma client and re-bundles your design-system packages into `public/packages/`. Run this after editing `uigen.config.ts` or swapping design systems.

---

## 🗄️ Database

### `pnpm db:push:local`

Create or sync the local SQLite DB against the Prisma schema.

### `pnpm db:push:remote`

Push the schema to the remote DB at `DATABASE_URL` (Turso or similar). Needs `DATABASE_URL` and `DATABASE_AUTH_TOKEN` set.

---

## 🧪 Quality

### `pnpm lint` / `pnpm lint:fix`

Run ESLint. `lint:fix` auto-fixes what it can.

### `pnpm test` / `pnpm test:watch`

Run the Vitest suite once (`test`) or in watch mode (`test:watch`).

---

## ▲ Vercel

### `pnpm vercel-build`

Alias of `pnpm build`. Set as the Vercel build command in `vercel.json`.
