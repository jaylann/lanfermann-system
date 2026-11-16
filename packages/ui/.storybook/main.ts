import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Every package entry the library's sources import from Base UI and the calendar, e.g.
 * `@base-ui/react/slider`.
 *
 * Vite bundles a dependency the first time a page asks for it, and then reloads the page. In the
 * story tests that happens in the middle of a run: with a cold cache the first stories of every
 * component that brings a new entry fail ("Cannot read properties of null (reading 'useId')",
 * two copies of React for a moment). Listing the entries up front bundles them before the first
 * test, so a cold run (CI, a fresh checkout) is as good as a warm one.
 */
function lazyDependencies(): string[] {
  const root = join(import.meta.dirname, "../src");
  const found = new Set<string>();
  for (const file of readdirSync(root, { recursive: true, encoding: "utf8" })) {
    if (!/\.tsx?$/.test(file)) continue;
    const source = readFileSync(join(root, file), "utf8");
    for (const match of source.matchAll(
      /from "(@base-ui\/react\/[a-z-]+|react-day-picker[a-z/]*)"/g,
    )) {
      found.add(match[1]!);
    }
  }
  return [...found].sort();
}

// The workshop for @lanfermann/ui. It lives inside the package (not in apps/) because bun installs
// are isolated per workspace: one Vite root keeps Tailwind's source scan, the `@/` alias and
// Storybook's preview singletons in a single place.
const config: StorybookConfig = {
  framework: { name: "@storybook/react-vite", options: {} },
  stories: ["../stories/**/*.stories.tsx", "../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // The kit's favicon for the workshop's own tab.
  staticDirs: ["../brand"],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  typescript: { reactDocgen: "react-docgen" },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import("vite");
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        // `@/` comes from this package's tsconfig `paths`.
        tsconfigPaths: true,
        dedupe: ["react", "react-dom", "motion", "framer-motion"],
      },
      optimizeDeps: { include: lazyDependencies() },
    });
  },
};

export default config;
