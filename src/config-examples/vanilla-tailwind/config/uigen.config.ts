import {
  defineConfig,
  type UIGenConfig,
} from "@/lib/config/define-config";

/**
 * Vanilla config — plain Tailwind, no external design system.
 *
 * The model builds with raw HTML elements + Tailwind utilities. Good as a
 * zero-setup starting point, and as a reference for what a minimal config
 * looks like.
 *
 * To use: replace the active `src/config/` folder with this one:
 *   rm -rf src/config && cp -r src/config-examples/vanilla/config src/config
 * Then run `pnpm dev`.
 */
const config: UIGenConfig = {
  brand: {
    name: "UI Gen",
    tagline:
      "Prototype UIs with AI — describe what you want, get live React components.",
    chatPlaceholder:
      "Describe a page, section, or component and I'll generate it.",
  },
  ds: {
    name: "vanilla-tailwind",
    tailwind: true,
    packages: [],
    componentCss: [],
    themeClass: "",
    fonts: [{ family: "Inter", weights: [400, 500, 600, 700] }],
  },
  prompts: {
    systemPromptFile: "./src/config/system-prompt.md",
    skillsDir: "./src/config/skills",
  },
  starterFiles: {
    dir: "./src/config/starter-files",
  },
};

export default defineConfig(config);
