import { defineConfig } from "tsdown";

export default defineConfig([
  // The library. One output file per source module (`unbundle`) so module-level "use client"
  // directives survive and consumers only pull in the components they import. dependencies +
  // peerDependencies stay external by default.
  //
  // Four entries: the library; the slide parts (`@lanfermann/ui/slides`), which an app that shows
  // no deck never loads; their catalog as plain data (`@lanfermann/ui/slides/catalog`); and the
  // player that presents a deck (`@lanfermann/ui/slides/player`).
  {
    entry: [
      "src/index.ts",
      "src/slides/index.ts",
      "src/slides/catalog/index.ts",
      "src/slides/player/index.ts",
    ],
    format: "esm",
    platform: "neutral",
    unbundle: true,
    fixedExtension: false,
    dts: true,
    clean: true,
  },
  // The prebuilt player: one script with React, the slide parts and the player inside, for a deck
  // that is a single HTML file and runs without a network (`player/player.global.js`, beside the
  // stylesheets scripts/slides/build-player.ts writes). It sets `globalThis.__LF_SLIDES__`.
  {
    entry: { "player.global": "src/slides/player/global.ts" },
    format: "iife",
    globalName: "__LF_SLIDES__",
    platform: "browser",
    outDir: "player",
    outputOptions: { entryFileNames: "[name].js" },
    // Everything inside: a file opened from disk can load nothing.
    deps: { alwaysBundle: [/./], onlyBundle: false },
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    // One script has no modules, so "use client" at the head of one means nothing here.
    checks: { moduleLevelDirective: false },
    dts: false,
    // build-player.ts owns the folder; a watch run must not empty it under a page that reads it.
    clean: false,
  },
]);
