import { defineConfig } from "vitest/config";

// Plain Node tests. A deck is type-checked and bundled in several of them, which takes a second
// or two each on a loaded machine: hence the longer limit.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
