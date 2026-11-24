import { defineConfig } from "tsdown";

// One output file per source module (`unbundle`) so module-level "use client" directives survive
// and consumers only pull in the components they import. dependencies + peerDependencies stay
// external by default.
//
// Two entries: the library, and the slide parts (`@lanfermann/ui/slides`), which an app that shows
// no deck never loads.
export default defineConfig({
  entry: ["src/index.ts", "src/slides/index.ts"],
  format: "esm",
  platform: "neutral",
  unbundle: true,
  fixedExtension: false,
  dts: true,
  clean: true,
});
