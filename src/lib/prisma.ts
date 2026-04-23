import { PrismaClient } from "#prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Default to a file-backed SQLite DB at ./prisma/dev.db so `pnpm dev` works
// on a fresh clone with zero setup. Set `DATABASE_URL` (+ optional
// `DATABASE_AUTH_TOKEN`) to point at a remote libSQL / Turso instance in
// production. Keep this path in sync with `prisma.config.ts`.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const prisma = new PrismaClient({ adapter });
