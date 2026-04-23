import "server-only";

import { tool } from "ai";
import matter from "gray-matter";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { getSkillsDir } from "@/lib/config/loader";

/**
 * Catalog of available skills, surfaced in the system prompt so the model
 * knows what it can load. Built at module-load time from the YAML
 * frontmatter of every `.md` file in the directory configured by
 * `prompts.skillsDir` in `uigen.config.ts`. To add a skill, drop a
 * markdown file with `name` + `description` frontmatter — no code change.
 */
export interface SkillEntry {
  name: string;
  description: string;
}

interface SkillEntryWithBody extends SkillEntry {
  /** Markdown content with frontmatter stripped. */
  body: string;
}

function loadSkills(): Map<string, SkillEntryWithBody> {
  const entries = new Map<string, SkillEntryWithBody>();
  const skillsDir = getSkillsDir();
  let files: string[];
  try {
    files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  } catch {
    // Skills dir missing — return an empty registry rather than throwing at
    // boot. The Skill tool will report "unknown skill" for any attempt.
    return entries;
  }

  for (const file of files) {
    const raw = readFileSync(join(skillsDir, file), "utf8");
    const { data, content } = matter(raw);
    const name = typeof data.name === "string" ? data.name : null;
    const description =
      typeof data.description === "string" ? data.description : null;
    if (!name || !description) {
      // Skip silently — a malformed skill shouldn't take down the server.
      // A runtime warning on the first call would be catchable by the model.
      continue;
    }
    entries.set(name, { name, description, body: content });
  }

  return entries;
}

const skills = loadSkills();

/**
 * Maximum characters returned when the model loads a skill. Large reference
 * docs (design-token catalogs, full component APIs) can be tens of KB —
 * capping the single-shot return keeps a careless `Skill` call from
 * dominating the context window. The model can re-request with a more
 * specific query via Grep or Read if it needs the rest.
 *
 * Units: characters (~4 chars ≈ 1 token).
 * Range: 4_000–40_000. Practical: 8_000–16_000.
 * - Lower  → safer token budget, but common skills may feel clipped.
 * - Higher → skills rarely truncated, but one skill can blow out a turn.
 */
const MAX_SKILL_BODY_CHARS = 12_000;

export const SKILLS: SkillEntry[] = Array.from(skills.values()).map(
  ({ name, description }) => ({ name, description })
);

/**
 * Renders the skill catalog as a compact block for inclusion in the system
 * prompt. Callers splice the result directly into the prompt.
 */
export function renderSkillIndex(): string {
  const lines = SKILLS.map((s) => `  - ${s.name}: ${s.description}`);
  return `<available_skills>\n${lines.join(
    "\n"
  )}\n  Call the \`Skill\` tool with one of these names to load its full content on demand.\n</available_skills>`;
}

export const buildSkillTool = () =>
  tool({
    description:
      "Load a skill (a markdown reference document) into context. Skills contain detailed knowledge — component docs, design tokens, image IDs, design standards — that isn't preloaded in the system prompt. Look at <available_skills> to see what's available and load only what you need.",
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          "The skill name, e.g. 'design-system-components' or 'design-tokens'."
        ),
    }),
    execute: async ({ name }) => {
      const entry = skills.get(name);
      if (!entry) {
        const valid = [...skills.keys()].join(", ");
        return `Error: unknown skill '${name}'. Valid skills: ${valid}`;
      }
      if (entry.body.length > MAX_SKILL_BODY_CHARS) {
        return `${entry.body.slice(0, MAX_SKILL_BODY_CHARS)}\n\n[... truncated at ${MAX_SKILL_BODY_CHARS} chars of ${entry.body.length}. Use Grep/Read against the skills directory for the full document.]`;
      }
      return entry.body;
    },
  });
