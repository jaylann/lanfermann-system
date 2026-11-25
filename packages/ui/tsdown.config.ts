import { defineConfig } from "tsdown";

// One output file per source module (`unbundle`) so module-level "use client" directives survive
// and consumers only pull in the components they import. dependencies + peerDependencies stay
// external by default.
//
// Three entries: the library; the slide parts (`@lanfermann/ui/slides`), which an app that shows
// no deck never loads; and their catalog as plain data (`@lanfermann/ui/slides/catalog`).
export default defineConfig({
  entry: ["src/index.ts", "src/slides/index.ts", "src/slides/catalog/index.ts"],
  format: "esm",
  platform: "neutral",
  unbundle: true,
  fixedExtension: false,
  dts: true,
  clean: true,
});
