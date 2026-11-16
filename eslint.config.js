// ESLint flat config for the whole workspace (root owns linting; workspaces have no own config).
//
// Layering (order matters — later configs win):
//   1. @eslint/js recommended
//   2. typescript-eslint recommended-type-checked (type info via projectService, per workspace tsconfig)
//   3. react-hooks + import sorting + `@/` alias enforcement
//   4. Next.js rules, scoped to apps/docs
//   5. Storybook rules for stories and the .storybook folder
//   6. eslint-config-prettier LAST — Prettier owns formatting.
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.next/**",
    "**/next-env.d.ts",
    "**/storybook-static/**",
    "**/.visual/**",
    // ESLint skips dot-folders by default; the Storybook config is code we own.
    "!**/.storybook",
  ]),

  js.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["**/*.{js,ts,tsx}"],
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-duplicate-imports": "error",
      // Force the `@/` alias instead of deep parent-relative climbs.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message: "Use the `@/` path alias instead of deep parent-relative imports.",
            },
          ],
        },
      ],
    },
  },

  // The library exports by name only. Stories are the exception: CSF needs a default export.
  {
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    ignores: ["**/*.stories.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Named exports only in @lanfermann/ui.",
        },
      ],
    },
  },

  // Next.js rules for the docs app only.
  {
    files: ["apps/docs/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    settings: { next: { rootDir: "apps/docs" } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  storybook.configs["flat/recommended"],

  // Prettier compatibility — MUST stay last.
  prettier,
);
