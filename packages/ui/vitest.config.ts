import { join } from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Two projects:
 *
 *   unit       plain Node tests: class merging, token contrast, generated-file drift, image diff.
 *   storybook  every story as a test in a real browser: it must render, its `play` function (if
 *              any) must pass, and axe must find nothing (`a11y.test: "error"` in the preview).
 *
 * The story project takes two environment variables:
 *   VISUAL_BROWSER  chromium (default, Playwright's build) | chrome (the system's) | webkit | firefox
 *   SB_GROUND       the ground to render on (default paper), so contrast is checked on Ink too
 */
const engine = process.env.VISUAL_BROWSER ?? "chromium";
const browser = engine === "chrome" ? "chromium" : (engine as "chromium" | "firefox" | "webkit");

export default defineConfig({
  // `@/` comes from tsconfig `paths`.
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          // Reads .storybook/main.ts (and its `viteFinal`: Tailwind, the `@/` alias) and turns
          // each story into a test. It applies the preview's annotations itself.
          storybookTest({
            configDir: join(import.meta.dirname, ".storybook"),
            initialGlobals: { ground: process.env.SB_GROUND ?? "paper" },
          }),
        ],
        test: {
          name: "storybook",
          // One story file at a time. Parallel files are frames of one window, and only one frame
          // can hold the focus: a story that waits for a popup to take it would wait forever.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: engine === "chrome" ? { channel: "chrome" } : {},
            }),
            instances: [{ browser }],
          },
        },
      },
    ],
  },
});
