import fs from "fs";
import path from "path";
import { getTemplatesDir } from "@/lib/config/loader";

export interface TemplateMeta {
  name: string;
  description: string;
  slug: string;
  lockedFiles?: string[];
  urlPath?: string;
  /**
   * Optional emoji (or short glyph) shown next to the template in the
   * picker UI. Kept in the template's own `meta.json` so the host app
   * stays config-driven — no hardcoded slug→icon maps in the UI layer.
   * Omit to fall back to the generic page icon.
   */
  icon?: string;
}

export function getTemplates(): TemplateMeta[] {
  const dir = getTemplatesDir();
  if (!dir || !fs.existsSync(dir)) return [];
  const dirs = fs.readdirSync(dir, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => {
      const metaPath = path.join(dir, d.name, "meta.json");
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return meta as TemplateMeta;
    });
}

export interface TemplateData {
  files: Record<string, string>;
  lockedFiles: string[];
}

export function loadTemplate(slug: string): TemplateData {
  const dir = getTemplatesDir();
  if (!dir) {
    throw new Error(
      `Template "${slug}" requested but no templates.dir is configured in uigen.config.ts`
    );
  }
  const templateDir = path.join(dir, slug);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${slug}" not found`);
  }

  // Read meta for lockedFiles
  const metaPath = path.join(templateDir, "meta.json");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as TemplateMeta;
  const lockedFiles = meta.lockedFiles ?? [];

  const files: Record<string, string> = {};

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "meta.json") continue;
      const fullPath = path.join(dir, entry.name);
      const virtualPath = prefix + "/" + entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, virtualPath);
      } else {
        files[virtualPath] = fs.readFileSync(fullPath, "utf-8");
      }
    }
  }

  walk(templateDir, "");

  // Normalize paths: /App.jsx instead of //App.jsx
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(files)) {
    normalized[key.replace(/^\/\//, "/")] = value;
  }

  return { files: normalized, lockedFiles };
}
