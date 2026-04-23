import {
  defineConfig,
  type UIGenConfig,
} from "@/lib/config/define-config";

/**
 * HeroUI with a Netflix-inspired theme.
 *
 * HeroUI ships the React components; the aesthetic comes from the CSS
 * variables in `config/starter-files/index.css` — generate and paste the
 * "Netflix" preset from https://heroui.com/themes into that file.
 *
 * Runtime deps (install into the repo root):
 *   pnpm add @heroui/react framer-motion
 */
const config: UIGenConfig = {
  brand: {
    name: "UI Gen — Netflix",
    tagline:
      "Netflix-inspired streaming UIs — cinematic dark aesthetic + strong red accent",
    chatPlaceholder:
      "Describe a page or component and I'll build it with HeroUI + the Netflix theme.",
    previewDomain: "netflix.com",
  },
  ds: {
    name: "heroui-netflix",
    tailwind: true,
    packages: [
      { npm: "@heroui/react", outName: "heroui-react" },
      { npm: "framer-motion", outName: "framer-motion" },
    ],
    componentCss: ["@heroui/styles/dist/heroui.min.css"],
    // Ships HeroUI's `@theme inline { --color-background: var(--background); … }`
    // block to Tailwind's browser runtime so utilities like `bg-background`,
    // `text-foreground`, `bg-surface`, etc. resolve. Without this, only
    // arbitrary values (`bg-[#fff]`) work in the preview iframe.
    tailwindConfigCss: "@heroui/styles/dist/themes/shared/theme.css",
    themeClass: "",
    fonts: [{ family: "Inter", weights: [400, 500, 600, 700] }],
  },
  prompts: {
    systemPromptFile: "./src/config/system-prompt.md",
    skillsDir: "./src/config/skills",
  },
  templates: {
    dir: "./src/config/templates",
  },
  starterFiles: {
    dir: "./src/config/starter-files",
  },
};

export default defineConfig(config);
