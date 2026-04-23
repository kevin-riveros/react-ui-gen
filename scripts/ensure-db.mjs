#!/usr/bin/env node
// Zero-setup bootstrap for `pnpm dev`:
// - If DATABASE_URL is empty/SQLite, make sure the file + schema exist.
// - If DATABASE_URL points at a remote DB (libsql://, https://…), skip —
//   remote DBs are the deployer's responsibility.
//
// Idempotent: safe to run on every dev start. Prisma no-ops if the schema
// already matches the DB.

import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim();
const isRemote = url && !url.startsWith("file:");
if (isRemote) {
  console.log("[ensure-db] remote DATABASE_URL detected, skipping local bootstrap");
  process.exit(0);
}

const dbUrl = url || "file:./prisma/dev.db";
const dbPath = dbUrl.replace(/^file:/, "");
const absDbPath = resolve(process.cwd(), dbPath);
const dbDir = dirname(absDbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const alreadyExists = existsSync(absDbPath);
console.log(
  alreadyExists
    ? `[ensure-db] syncing schema → ${dbPath}`
    : `[ensure-db] creating ${dbPath} and syncing schema`
);

const result = spawnSync(
  "pnpm",
  ["exec", "prisma", "db", "push", "--accept-data-loss"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  }
);

process.exit(result.status ?? 0);
