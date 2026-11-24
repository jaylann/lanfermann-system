import { defineConfig } from "tsdown";

// Two entries: the library (what the hub reuses for its own check and build) and the command
// line, which only maps arguments onto it. dependencies and peerDependencies stay external:
// esbuild and TypeScript are loaded from the install, and playwright-core only if it is there.
export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: "esm",
  platform: "node",
  fixedExtension: false,
  dts: true,
  clean: true,
});
