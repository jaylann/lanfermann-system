/**
 * Visual regression: compares the shots of a capture run with a baseline.
 *
 *   node scripts/visual/compare.ts [options]
 *
 *   --baseline <dir>       the accepted shots (default visual-baseline)
 *   --current <dir>        the output folder of a capture run (default .visual/current)
 *   --out <dir>            where the difference strips and the summary go (default .visual/diff)
 *   --update               accept the current shots: copy them over the baseline
 *   --partial              the run covered only some stories (`capture.ts --only`): baseline
 *                          shots without a current counterpart are not reported as removed
 *   --threshold <0..1>     colour distance still counted as equal (default 0: exact)
 *   --max-diff-pixels <n>  differing pixels still accepted per shot (default 0)
 *
 * A baseline is `<story-id>/<variant>.png` plus `manifest.json`, the record of what drew it
 * (browser build, platform, architecture, scale). Shots are only comparable when the current run
 * was drawn by the same thing, so a mismatch stops the comparison instead of reporting hundreds
 * of differences that are really one.
 *
 * Exit codes: 0 nothing differs, 1 shots differ, 2 the two sides are not comparable.
 */
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { comparePng } from "./diff.ts";

type Finding = { shot: string; change: string; strip?: string };

function parseArgs(argv: string[]) {
  const options = {
    baseline: "visual-baseline",
    current: ".visual/current",
    out: ".visual/diff",
    update: false,
    partial: false,
    threshold: 0,
    maxDiffPixels: 0,
  };
  const args = [...argv];
  const next = (flag: string) => {
    const value = args.shift();
    if (value === undefined) throw new Error(`${flag} needs a value`);
    return value;
  };
  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "--baseline") options.baseline = next(arg);
    else if (arg === "--current") options.current = next(arg);
    else if (arg === "--out") options.out = next(arg);
    else if (arg === "--update") options.update = true;
    else if (arg === "--partial") options.partial = true;
    else if (arg === "--threshold") options.threshold = Number(next(arg));
    else if (arg === "--max-diff-pixels") options.maxDiffPixels = Number(next(arg));
    else if (arg !== "--") throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

/** Every PNG below `dir`, as paths relative to it, sorted. */
async function shotsIn(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

async function readJson(file: string): Promise<Record<string, unknown> | undefined> {
  if (!existsSync(file)) return undefined;
  return JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
}

/** What has to match for two runs to be comparable pixel by pixel. */
function fingerprint(meta: Record<string, unknown>) {
  const { engines, platform, arch, scale, touch } = meta;
  return JSON.stringify({ engines, platform, arch, scale, touch });
}

const options = parseArgs(process.argv.slice(2));
const baselineDir = resolve(options.baseline);
const currentDir = resolve(options.current);
const currentShots = join(currentDir, "shots");
const outDir = resolve(options.out);

const meta = await readJson(join(currentDir, "meta.json"));
if (!meta) {
  console.error(
    `no capture run in ${options.current} (run capture.ts with --out ${options.current})`,
  );
  process.exit(2);
}

if (options.update) {
  const fresh = await shotsIn(currentShots);
  if (fresh.length === 0) {
    console.error(`${options.current} holds no shots`);
    process.exit(2);
  }
  // A partial run replaces what it drew and leaves the rest; a full run replaces everything.
  if (!options.partial && existsSync(baselineDir)) {
    // Only ever empty a folder that is a baseline: a mistyped --baseline must not cost anything.
    const isBaseline =
      existsSync(join(baselineDir, "manifest.json")) || (await readdir(baselineDir)).length === 0;
    if (!isBaseline) {
      console.error(
        `${options.baseline} exists and is not a baseline (no manifest.json): left alone`,
      );
      process.exit(2);
    }
    await rm(baselineDir, { recursive: true, force: true });
  }
  for (const shot of fresh) {
    await mkdir(dirname(join(baselineDir, shot)), { recursive: true });
    await cp(join(currentShots, shot), join(baselineDir, shot));
  }
  await writeFile(join(baselineDir, "manifest.json"), `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`baseline updated: ${fresh.length} shots in ${options.baseline}`);
  process.exit(0);
}

const manifest = await readJson(join(baselineDir, "manifest.json"));
if (!manifest) {
  console.error(`no baseline in ${options.baseline} (create one with --update)`);
  process.exit(2);
}
if (fingerprint(manifest) !== fingerprint(meta)) {
  console.error(
    [
      "the baseline and this run were not drawn by the same thing, so their pixels cannot be compared:",
      `  baseline  ${fingerprint(manifest)}`,
      `  current   ${fingerprint(meta)}`,
    ].join("\n"),
  );
  process.exit(2);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const before = await shotsIn(baselineDir);
const after = await shotsIn(currentShots);
const findings: Finding[] = [];

for (const shot of [...new Set([...before, ...after])].sort()) {
  const hasBefore = before.includes(shot);
  const hasAfter = after.includes(shot);
  if (!hasAfter) {
    if (!options.partial) findings.push({ shot, change: "removed" });
    continue;
  }
  if (!hasBefore) {
    findings.push({ shot, change: "new" });
    continue;
  }
  const result = comparePng(
    await readFile(join(baselineDir, shot)),
    await readFile(join(currentShots, shot)),
    { threshold: options.threshold, maxDiffPixels: options.maxDiffPixels },
  );
  if (result.kind === "same") continue;
  const strip = join(outDir, shot);
  await mkdir(dirname(strip), { recursive: true });
  await writeFile(strip, result.strip);
  findings.push({
    shot,
    change:
      result.kind === "resized"
        ? `size ${result.from} → ${result.to}`
        : `${result.pixels.toLocaleString("en")} px`,
    strip: relative(process.cwd(), strip),
  });
}

const compared = options.partial ? after.length : new Set([...before, ...after]).size;
const summary =
  findings.length === 0
    ? `## Visual regression\n\nAll ${compared} shots match the baseline.\n`
    : [
        "## Visual regression",
        "",
        `${findings.length} of ${compared} shots differ from the baseline.`,
        "",
        "| Shot | Change | Strip (baseline, current, difference) |",
        "| --- | --- | --- |",
        ...findings.map(
          ({ shot, change, strip }) =>
            `| \`${shot.replace(/\.png$/, "")}\` | ${change} | ${strip ? `\`${strip}\`` : ""} |`,
        ),
        "",
        "If the change is intended, accept it: `bun run visual:baseline`, look at the changed",
        "files in `packages/ui/visual-baseline`, and commit them with the change.",
        "",
      ].join("\n");
await writeFile(join(outDir, "summary.md"), summary);
console.log(summary);
process.exit(findings.length === 0 ? 0 : 1);
