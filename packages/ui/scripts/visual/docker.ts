/**
 * Visual regression against the committed baseline (`visual-baseline/`).
 *
 *   node scripts/visual/docker.ts check       capture, compare; exit 1 when a shot differs
 *   node scripts/visual/docker.ts baseline    capture and accept: rewrites visual-baseline/
 *
 *   --here    run the steps in this process instead of starting the container. CI passes it:
 *             its job already runs inside the image.
 *
 * Pixels are only comparable when the same browser build draws them with the same fonts and
 * rasteriser, so both commands draw inside one pinned Playwright container (see image.ts), on a
 * laptop and in CI alike. The Storybook is built outside it (`bun run build-storybook`): the
 * image has Node and the browsers, not bun. The container sees the repository at the same path
 * the host does, so the symlinks of bun's install resolve.
 *
 * What is drawn: every story's shot at scale 1 on Paper, Ink and Indigo, each taken until two
 * captures agree byte for byte.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { BASELINE_GROUNDS, PLAYWRIGHT_IMAGE } from "./image.ts";

const packageRoot = resolve(import.meta.dirname, "../..");
const repoRoot = resolve(packageRoot, "../..");
const current = ".visual/container";

const [mode, ...flags] = process.argv.slice(2);
if (mode !== "check" && mode !== "baseline") {
  console.error("usage: node scripts/visual/docker.ts <check|baseline> [--here]");
  process.exit(2);
}
const here = flags.includes("--here");

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/** The two steps, run where the browser lives. */
function steps(): number {
  const node = [process.execPath, "--experimental-strip-types", "--no-warnings"];
  const capture = run(
    node[0]!,
    [
      ...node.slice(1),
      "scripts/visual/capture.ts",
      "shots",
      "--static",
      "storybook-static",
      "--grounds",
      BASELINE_GROUNDS,
      "--scale",
      "1",
      "--no-sheets",
      "--stable",
      "--out",
      current,
    ],
    { VISUAL_BROWSER: "chromium" },
  );
  if (capture !== 0) return capture;
  return run(node[0]!, [
    ...node.slice(1),
    "scripts/visual/compare.ts",
    "--baseline",
    "visual-baseline",
    "--current",
    current,
    ...(mode === "baseline" ? ["--update"] : []),
  ]);
}

if (!existsSync(join(packageRoot, "storybook-static", "index.json"))) {
  console.error("No storybook-static: run `bun run build-storybook` first.");
  process.exit(2);
}

if (here) {
  process.exit(steps());
}

const status = run("docker", [
  "run",
  "--rm",
  "--init",
  // Chromium needs more shared memory than Docker's default 64MB.
  "--ipc=host",
  "--volume",
  `${repoRoot}:${repoRoot}`,
  "--workdir",
  packageRoot,
  PLAYWRIGHT_IMAGE,
  "node",
  "--experimental-strip-types",
  "--no-warnings",
  join(dirname(import.meta.filename), "docker.ts"),
  mode,
  "--here",
]);
process.exit(status);
