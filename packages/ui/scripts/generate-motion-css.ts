import { writeFileSync } from "node:fs";

import { springs } from "../src/motion/springs.ts";
import { renderMotionCss } from "./render-motion-css.ts";

const target = new URL("../src/styles/motion.generated.css", import.meta.url);
writeFileSync(target, renderMotionCss(springs));
console.log(`wrote ${target.pathname}`);
