import * as esbuild from "esbuild";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";

// ---------------------------------------------------------------------------
// Config validator
//
// Runs before `dev` and `build` so a missing skill file, a renamed package,
// or an accidentally-deleted starter file surfaces as a clear error instead
// of a cryptic 500 at request time.
//
// Checks, in order:
//   1. `src/config/uigen.config.ts` exists and loads
//   2. Required sections (`brand`, `ds`, `prompts`) are present
//   3. `prompts.systemPromptFile` resolves to an existing file
//   4. `prompts.skillsDir` exists and every `*.md` inside has valid
//      YAML frontmatter with `name` and `description`
//   5. Optional `starterFiles.dir` / `templates.dir` exist when declared
//   6. Each `ds.packages[].npm` has a reachable package.json in node_modules
//   7. Each `ds.componentCss` and `ds.tailwindConfigCss` path exists under
//      node_modules
//   8. Fonts have non-empty family names
//
// Exits 1 on any hard error; warnings don't block.
// ---------------------------------------------------------------------------

const CWD = process.cwd();
const CONFIG_PATH = "src/config/uigen.config.ts";
const require = createRequire(import.meta.url);

const errors = [];
const warnings = [];
const passes = [];

function pass(msg) { passes.push(msg); }
function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function repoPath(p) { return isAbsolute(p) ? p : join(CWD, p); }

async function loadConfig() {
  const cfgPath = resolve(CONFIG_PATH);
  if (!existsSync(cfgPath)) {
    err(`Config file not found at ${CONFIG_PATH}. Copy one from src/config-examples/<name>/config/.`);
    return null;
  }
  const tmpDir = join(tmpdir(), "uigen-validate");
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `config-${Date.now()}.mjs`);
  try {
    await esbuild.build({
      entryPoints: [cfgPath],
      bundle: true,
      format: "esm",
      platform: "node",
      outfile: tmpFile,
      logLevel: "silent",
    });
    const mod = await import(pathToFileURL(tmpFile).href);
    return mod.default;
  } catch (e) {
    err(`Failed to load ${CONFIG_PATH}: ${e.message}`);
    return null;
  } finally {
    rmSync(tmpFile, { force: true });
  }
}

function validateBrand(brand) {
  if (!brand || typeof brand !== "object") {
    err("`brand` section missing or not an object.");
    return;
  }
  for (const field of ["name", "tagline", "chatPlaceholder"]) {
    if (!brand[field] || typeof brand[field] !== "string") {
      err(`brand.${field} is required and must be a non-empty string.`);
    }
  }
  pass(`brand.name = "${brand.name ?? "?"}"`);
}

function validatePrompts(prompts) {
  if (!prompts || typeof prompts !== "object") {
    err("`prompts` section missing.");
    return;
  }
  if (!prompts.systemPromptFile) {
    err("prompts.systemPromptFile is required.");
  } else {
    const abs = repoPath(prompts.systemPromptFile);
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      err(`prompts.systemPromptFile does not exist: ${prompts.systemPromptFile}`);
    } else {
      pass(`systemPromptFile → ${prompts.systemPromptFile}`);
    }
  }
  if (!prompts.skillsDir) {
    err("prompts.skillsDir is required.");
    return;
  }
  const absDir = repoPath(prompts.skillsDir);
  if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
    err(`prompts.skillsDir does not exist: ${prompts.skillsDir}`);
    return;
  }
  const skillFiles = readdirSync(absDir).filter((f) => f.endsWith(".md"));
  if (skillFiles.length === 0) {
    warn(`skillsDir has no .md files: ${prompts.skillsDir}`);
  }
  for (const f of skillFiles) {
    const raw = readFileSync(join(absDir, f), "utf8");
    let fm;
    try {
      fm = matter(raw).data;
    } catch (e) {
      err(`Skill file ${f} has malformed YAML frontmatter: ${e.message}`);
      continue;
    }
    if (!fm.name) err(`Skill file ${f} is missing \`name\` in frontmatter.`);
    if (!fm.description) err(`Skill file ${f} is missing \`description\` in frontmatter.`);
  }
  pass(`skillsDir → ${prompts.skillsDir} (${skillFiles.length} skill${skillFiles.length === 1 ? "" : "s"})`);
}

function validateOptionalDir(key, rawDir) {
  if (!rawDir) return;
  const abs = repoPath(rawDir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    err(`${key} declared but directory missing: ${rawDir}`);
    return;
  }
  pass(`${key} → ${rawDir}`);
}

function validateDs(ds) {
  if (!ds || typeof ds !== "object") {
    err("`ds` section missing.");
    return;
  }
  if (!ds.name) err("ds.name is required.");

  const packages = Array.isArray(ds.packages) ? ds.packages : [];
  for (const pkg of packages) {
    if (!pkg.npm || !pkg.outName) {
      err(`ds.packages entry is missing npm/outName: ${JSON.stringify(pkg)}`);
      continue;
    }
    try {
      require.resolve(`${pkg.npm}/package.json`, { paths: [CWD] });
      pass(`package resolved → ${pkg.npm}`);
    } catch {
      err(`ds.packages[].npm not installed: "${pkg.npm}". Run \`pnpm install\` or check for a typo.`);
    }
  }

  const componentCss = Array.isArray(ds.componentCss) ? ds.componentCss : [];
  for (const rel of componentCss) {
    const abs = join(CWD, "node_modules", rel);
    if (!existsSync(abs)) {
      err(`ds.componentCss file not found under node_modules: ${rel}`);
    } else {
      pass(`componentCss → ${rel}`);
    }
  }

  if (ds.tailwindConfigCss) {
    const abs = join(CWD, "node_modules", ds.tailwindConfigCss);
    if (!existsSync(abs)) {
      err(`ds.tailwindConfigCss file not found: ${ds.tailwindConfigCss}`);
    } else {
      pass(`tailwindConfigCss → ${ds.tailwindConfigCss}`);
    }
  }

  const fonts = Array.isArray(ds.fonts) ? ds.fonts : [];
  for (const font of fonts) {
    if (!font.family || typeof font.family !== "string") {
      err(`ds.fonts entry has empty/invalid family: ${JSON.stringify(font)}`);
    }
  }
  if (fonts.length) pass(`fonts → ${fonts.map((f) => f.family).join(", ")}`);
}

const config = await loadConfig();
if (config) {
  validateBrand(config.brand);
  validatePrompts(config.prompts);
  validateDs(config.ds);
  validateOptionalDir("starterFiles.dir", config.starterFiles?.dir);
  validateOptionalDir("templates.dir", config.templates?.dir);
}

for (const p of passes) console.log(`✓ ${p}`);
for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error${errors.length === 1 ? "" : "s"} in ${CONFIG_PATH}. Fix and rerun.`);
  process.exit(1);
}
console.log(`\n✓ Config is valid (${passes.length} checks passed${warnings.length ? `, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}).`);
