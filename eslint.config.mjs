import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Catch stray console calls — pino is the project's structured logger.
      // `warn`/`error` are allowed because they're rarely wrong.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prefer `import type` for type-only imports so bundlers can drop them.
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      // Low-risk hygiene rules — codebase already passes these (0 violations).
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
    },
  },
  {
    // CLI scripts legitimately write to stdout — `console.log` is their I/O.
    files: ["scripts/**/*.mjs", "scripts/**/*.js"],
    rules: {
      "no-console": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific:
    "public/packages/**",
    "prisma/generated/**",
    "prisma/dev.db*",
    // Templates are string content loaded at runtime into the virtual file
    // system via fs.readFileSync — they are not part of the Next build and
    // intentionally violate our source conventions (apostrophes, etc.).
    // `**/templates/**` matches both root-level and config-scoped dirs
    // like `src/config/templates/…`.
    "**/templates/**",
    "src/config-examples/**",
  ]),
]);

export default eslintConfig;
