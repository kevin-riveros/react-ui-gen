import {
  defineConfig,
  type UIGenConfig,
} from "@/lib/config/define-config";

/**
 * UI Gen — active configuration (currently: HeroUI with Airbnb-inspired theme).
 *
 * HeroUI ships the React components; the aesthetic comes from the CSS
 * variables in `src/config/starter-files/index.css` — paste the "Airbnb"
 * preset export from https://heroui.com/themes into that file.
 *
 * Runtime deps (already installed):
 *   pnpm add @heroui/react framer-motion
 */
const config: UIGenConfig = {
  brand: {
    name: "UI Gen — Airbnb",
    tagline:
      "Airbnb-inspired hospitality UIs — warm off-white neutrals, coral primary",
    chatPlaceholder:
      "Describe a page or component and I'll build it with HeroUI + the Airbnb theme.",
    previewDomain: "airbnb.com",
  },
  ds: {
    name: "heroui-airbnb",
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
  starterFiles: {
    dir: "./src/config/starter-files",
  },
  templates: {
    dir: "./src/config/templates",
  },
};

export default defineConfig(config);
