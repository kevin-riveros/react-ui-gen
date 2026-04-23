#!/usr/bin/env node
// Fast check for the two generated artifacts that the dev server needs:
//   1. the Prisma client at prisma/generated/client.js
//   2. the DS package bundles in public/packages/ — using the Tailwind config
//      output file as the marker because build-packages always writes it
//      (even empty), regardless of which DS packages are configured.
// If either is missing — fresh clone, deleted node_modules, etc. — generate
// it. Subsequent `pnpm dev` starts hit this script and exit in a few ms.
//
// For reproducible production builds, use `pnpm prebuild` instead: that
// always regenerates both, regardless of cache.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PRISMA_MARKER = "prisma/generated/client.js";
const DS_MARKER = "public/packages/ds-tailwind-config.css";

function run(label, command, args) {
  console.log(`[ensure-assets] ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(PRISMA_MARKER)) {
  run("generating Prisma client", "pnpm", ["exec", "prisma", "generate"]);
}

if (!existsSync(DS_MARKER)) {
  run("bundling DS packages", "node", ["scripts/build-packages.mjs"]);
}
