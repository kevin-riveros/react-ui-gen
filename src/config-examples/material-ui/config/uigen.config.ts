import {
  defineConfig,
  type UIGenConfig,
} from "@/lib/config/define-config";

/**
 * Material UI example — public-npm design system, no private registry.
 *
 * Demonstrates bringing a popular DS from public npm into the preview iframe.
 * Install the runtime deps, then replace `src/config/` with this folder:
 *
 *   pnpm add @mui/material @emotion/react @emotion/styled
 *   rm -rf src/config && cp -r src/config-examples/material-ui/config src/config
 */
const config: UIGenConfig = {
  brand: {
    name: "UI Gen — MUI",
    tagline:
      "Prototype Material Design UIs with AI — powered by MUI and your own prompts.",
    chatPlaceholder:
      "Describe a page or component and I'll build it with Material UI.",
  },
  ds: {
    name: "material-ui",
    // MUI uses emotion (CSS-in-JS). Tailwind browser runtime would only add
    // weight and competing cascade — leave it off.
    tailwind: false,
    packages: [
      { npm: "@mui/material", outName: "mui-material" },
      { npm: "@emotion/react", outName: "emotion-react" },
      { npm: "@emotion/styled", outName: "emotion-styled" },
    ],
    componentCss: [],
    fonts: [{ family: "Roboto", weights: [300, 400, 500, 700] }],
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
