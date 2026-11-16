import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

import { springs } from "../src/motion/springs.ts";
import { renderMotionCss } from "./render-motion-css.ts";

it("motion.generated.css is in sync with the spring table (run `bun run gen:motion`)", () => {
  const onDisk = readFileSync(
    new URL("../src/styles/motion.generated.css", import.meta.url),
    "utf8",
  );
  expect(onDisk).toBe(renderMotionCss(springs));
});
