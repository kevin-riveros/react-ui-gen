/**
 * Config schema for UI Gen. Declares the full shape of `uigen.config.ts`
 * at the repo root. Two helpers: `defineConfig()` gives you IDE autocompletion
 * when authoring the file, and `UIGenConfig` is the exported type used by the
 * loader at runtime.
 *
 * The config is the single source of truth for:
 *   - Branding (name, tagline, chat placeholder)
 *   - The Design System to generate against (npm packages, CSS, fonts, tokens)
 *   - Where to find the system prompt and skill markdown files
 *   - Where to find starter templates (optional)
 */

export interface UIGenConfig {
  brand: BrandConfig;
  ds: DesignSystemConfig;
  prompts: PromptsConfig;
  templates?: TemplatesConfig;
  starterFiles?: StarterFilesConfig;
}

export interface BrandConfig {
  /** Shown as the `<title>`, header text on the home page, and in the system prompt identity. */
  name: string;
  /** One-line pitch shown under the hero on the home page. */
  tagline: string;
  /** Empty-state placeholder in the chat screen. */
  chatPlaceholder: string;
  /**
   * Domain shown in the simulated browser chrome around the preview (just
   * for flavor — no networking involved). Defaults to "preview.app" when
   * unset. Leave out or set to "" to hide the domain entirely.
   */
  previewDomain?: string;
}

export interface DesignSystemConfig {
  /** Short identifier for the DS — surfaced in the system prompt (e.g. "material-ui"). */
  name: string;
  /**
   * Load the Tailwind v4 browser runtime into the preview iframe. Enable for
   * DS's that rely on Tailwind utilities or ship `@theme`/`@utility` tokens.
   * Disable for DS's with self-contained styling like Material UI, Chakra,
   * Ant Design — the runtime would only add weight with no payoff. Default: false.
   */
  tailwind?: boolean;
  /** Packages to esbuild-bundle into `public/packages/*.js` for the preview iframe. */
  packages: DsPackage[];
  /**
   * Pre-compiled CSS files (inside node_modules) to concatenate into
   * `public/packages/styles-bundle.css`. Loaded as a stylesheet inside the
   * preview iframe. Leave empty if your DS only ships JS.
   */
  componentCss?: string[];
  /**
   * Path (inside node_modules) to a Tailwind v4 config CSS file containing
   * `@theme static`, `@utility`, and `@layer base` directives. Inlined into
   * `<style type="text/tailwindcss">` in the preview so @tailwindcss/browser
   * processes it at runtime. Leave undefined if your DS doesn't ship tokens.
   */
  tailwindConfigCss?: string;
  /** Class applied to `<body>` inside the preview iframe (for scoped DS themes). */
  themeClass?: string;
  /** Google Fonts to load inside the preview iframe. */
  fonts?: FontConfig[];
}

export interface DsPackage {
  /** Package specifier passed to esbuild (`entryPoints`). */
  npm: string;
  /** Base filename for the output: `public/packages/<outName>.js`. */
  outName: string;
}

export interface FontConfig {
  /** Google Fonts family name, e.g. "Inter". */
  family: string;
  /** Numeric weights to request. Defaults to `[400]` if omitted. */
  weights?: number[];
  /** If true, also request italic variants. */
  italic?: boolean;
}

export interface PromptsConfig {
  /** Path (relative to repo root) to the DS-specific system prompt markdown. */
  systemPromptFile: string;
  /** Directory (relative to repo root) containing `.md` skill files with YAML frontmatter. */
  skillsDir: string;
}

export interface TemplatesConfig {
  /** Directory (relative to repo root) containing starter template subfolders. */
  dir?: string;
}

export interface StarterFilesConfig {
  /**
   * Directory (relative to repo root) whose contents seed every blank
   * project's virtual filesystem. Useful for shipping DS-specific scaffolding
   * the model would otherwise have to reinvent on every first generation —
   * e.g. an MUI `theme.js` + `App.jsx` wrapping `<ThemeProvider>`, or a
   * Tailwind `styles/theme.css` with CSS custom properties.
   *
   * The folder's structure is mirrored into the VFS: `./App.jsx` becomes
   * `/App.jsx`, `./styles/theme.css` becomes `/styles/theme.css`, etc.
   */
  dir?: string;
}

/**
 * Author-side helper. Wrap your config with `defineConfig({ ... })` to get
 * strict type-checking and IDE autocompletion in `uigen.config.ts`.
 */
export function defineConfig(c: UIGenConfig): UIGenConfig {
  return c;
}
