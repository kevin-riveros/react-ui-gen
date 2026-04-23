import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { config } from "./client";

/**
 * Server-only config loader. Reads markdown files referenced by
 * `uigen.config.ts` and caches their contents in-memory at module load so
 * request handlers don't pay the disk I/O on every turn.
 *
 * The system prompt and skill index both flow through here; the iframe import
 * map and brand info stay in `./client` because they're pure data.
 */

const CWD = process.cwd();

function resolveRepoPath(p: string): string {
  return isAbsolute(p) ? p : join(CWD, p);
}

let cachedSystemPrompt: string | null = null;

/**
 * Read the DS-specific system prompt markdown referenced by
 * `config.prompts.systemPromptFile`. Cached on first call.
 *
 * Throws with a pointer to the config file if the path is wrong — silently
 * falling back to an empty prompt would generate useless UI.
 */
export function getSystemPromptContent(): string {
  if (cachedSystemPrompt !== null) return cachedSystemPrompt;
  const path = resolveRepoPath(config.prompts.systemPromptFile);
  try {
    cachedSystemPrompt = readFileSync(path, "utf8").trim();
  } catch (err) {
    throw new Error(
      `[uigen config] Failed to read systemPromptFile at ${path}. ` +
        `Check the 'prompts.systemPromptFile' entry in uigen.config.ts.\n` +
        `Underlying error: ${(err as Error).message}`
    );
  }
  return cachedSystemPrompt;
}

/**
 * Absolute path to the skills directory declared in
 * `config.prompts.skillsDir`. Used by the Skill tool to scan `.md` files.
 */
export function getSkillsDir(): string {
  return resolveRepoPath(config.prompts.skillsDir);
}

/**
 * Absolute path to the templates directory, or `null` if templates aren't
 * configured. When `null`, the home page shows no starter templates.
 */
export function getTemplatesDir(): string | null {
  const dir = config.templates?.dir;
  if (!dir) return null;
  return resolveRepoPath(dir);
}

/**
 * Walk `starterFiles.dir` (if configured) and return every file as a
 * `{ path, content }` pair ready to pour into a fresh `VirtualFileSystem`.
 * Directory structure is preserved: `./App.jsx` → `/App.jsx`,
 * `./styles/theme.css` → `/styles/theme.css`.
 */
export function loadStarterFiles(): Array<{ path: string; content: string }> {
  const dir = config.starterFiles?.dir;
  if (!dir) return [];
  const absDir = resolveRepoPath(dir);
  if (!existsSync(absDir)) return [];

  const files: Array<{ path: string; content: string }> = [];
  function walk(currentDir: string, virtualPrefix: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const full = join(currentDir, entry.name);
      const virtual = virtualPrefix + "/" + entry.name;
      if (entry.isDirectory()) {
        walk(full, virtual);
      } else if (entry.isFile()) {
        files.push({ path: virtual, content: readFileSync(full, "utf8") });
      }
    }
  }
  walk(absDir, "");
  return files;
}

export { config };
