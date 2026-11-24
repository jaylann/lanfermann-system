/**
 * Writes what stands beside the prebuilt player's script in `player/` (tsdown writes
 * `player.global.js` there first; see tsdown.config.ts), so a deck can be one HTML file that
 * needs no network:
 *
 *   player.css        Tailwind, the library's tokens, slides.css and the player's own rules,
 *                     with the classes the slide parts and the player use and the twelve
 *                     spans of the grid, and no others
 *   classes.json      those classes, sorted: the vocabulary a deck may use
 *   fonts.inline.css  the kit's three faces as data URLs, for the single file
 *   fonts.css, fonts/ the same faces as files, for a deck served from a folder
 *   NOTICES.txt       what is inside from others, and under which licence
 *   manifest.json     every file with its size and hash
 *
 *   node scripts/slides/build-player.ts     (part of `bun run build`)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

import {
  classesOf,
  faceOf,
  fontFaceRule,
  type Notice,
  renderNotices,
} from "./render-player-assets.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const out = join(root, "player");
const require = createRequire(import.meta.url);

/** A field of a package.json, if it is a string. */
function fieldOf(file: string, field: string): string | undefined {
  const json: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (typeof json !== "object" || json === null || !(field in json)) return undefined;
  const value = (json as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

/**
 * The folder of an installed package, found from its entry (not every package exports its
 * package.json). `from` is a package that depends on it, for one this package does not name.
 */
function packageDir(name: string, from?: string): string {
  const resolve = from ? createRequire(require.resolve(from)).resolve : require.resolve;
  let dir = dirname(resolve(name));
  for (;;) {
    const manifest = join(dir, "package.json");
    if (existsSync(manifest) && fieldOf(manifest, "name") === name) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Cannot find the folder of ${name}.`);
    dir = parent;
  }
}

async function licenseOf(name: string, from?: string): Promise<string> {
  const dir = packageDir(name, from);
  const file = (await readdir(dir)).find((entry) => /^licen[cs]e(\.md|\.txt)?$/i.test(entry));
  if (!file) throw new Error(`${name} has no licence file.`);
  return readFile(join(dir, file), "utf8");
}

function copyrightOf(license: string): string[] {
  return license.split("\n").filter((line) => line.startsWith("Copyright"));
}

/*
 * The stylesheet. The `@source` lines of styles.css and slides.css point at `dist` for apps; here
 * they are not followed (`source(none)`, and only the Scanner below feeds the compiler), so the
 * classes of the library's other components stay out.
 */
async function stylesheet(): Promise<{ css: string; classes: string[] }> {
  const input = [
    '@import "tailwindcss" source(none);',
    '@import "./src/styles.css";',
    '@import "./src/styles/slides.css";',
    '@import "./src/slides/player/chrome.css";',
    // The grid is a deck's own to use, all twelve spans of it: the parts themselves happen to
    // use seven, and an example in the catalog already sets a twelfth by hand.
    '@source inline("slide-span-{1..12}");',
  ].join("\n");
  const compiler = await compile(input, { base: root, onDependency: () => {} });
  const slides = join(root, "src/slides");
  const scanner = new Scanner({
    sources: [
      { base: slides, pattern: "**/*.{ts,tsx}", negated: false },
      // What shows the parts, not what they are: stories, examples and the catalog made of
      // them, tests.
      { base: slides, pattern: "**/*.stories.tsx", negated: true },
      { base: slides, pattern: "**/*.example.tsx", negated: true },
      { base: slides, pattern: "**/*.test.{ts,tsx}", negated: true },
      { base: slides, pattern: "story-*.tsx", negated: true },
      { base: slides, pattern: "catalog/**", negated: true },
      // The one part of the library the player draws with: its icons.
      { base: join(root, "src/components/icon"), pattern: "icon.tsx", negated: false },
    ],
  });
  const css = optimize(compiler.build(scanner.scan()), { minify: true }).code;
  return { css, classes: classesOf(css) };
}

/** The kit's faces: the Latin subset covers German, its quotes and the narrow space. */
const FACES = [
  { pkg: "@fontsource-variable/sofia-sans", css: "wght.css", name: "sofia-sans-latin-wght-normal" },
  {
    pkg: "@fontsource-variable/sofia-sans",
    css: "wght-italic.css",
    name: "sofia-sans-latin-wght-italic",
  },
  {
    pkg: "@fontsource-variable/jetbrains-mono",
    css: "wght.css",
    name: "jetbrains-mono-latin-wght-normal",
  },
];

async function fonts(): Promise<{ inline: string; linked: string }> {
  await mkdir(join(out, "fonts"), { recursive: true });
  let inline = "";
  let linked = "";
  for (const { pkg, css, name } of FACES) {
    const dir = packageDir(pkg);
    const face = faceOf(await readFile(join(dir, css), "utf8"), name);
    const file = join(dir, "files", `${name}.woff2`);
    const data = await readFile(file);
    inline += fontFaceRule(face, `data:font/woff2;base64,${data.toString("base64")}`);
    linked += fontFaceRule(face, `./fonts/${name}.woff2`);
    await copyFile(file, join(out, "fonts", `${name}.woff2`));
  }
  return { inline, linked };
}

async function notices(): Promise<string> {
  const mit = async (name: string, part: string, from?: string): Promise<Notice> => ({
    name,
    part,
    license: "MIT",
    copyright: copyrightOf(await licenseOf(name, from)),
  });
  const font = async (pkg: string, name: string): Promise<Notice> => ({
    name,
    part: "fonts.css, fonts.inline.css, fonts/",
    license: "OFL-1.1",
    // The licence file opens with the copyright lines of both styles, on one line.
    copyright: [(await licenseOf(pkg)).split("\n")[0] ?? ""],
  });
  const list: Notice[] = [
    await mit("react", "player.global.js"),
    await mit("react-dom", "player.global.js"),
    await mit("scheduler", "player.global.js", "react-dom"),
    await mit("clsx", "player.global.js"),
    await mit("tailwind-merge", "player.global.js"),
    await mit("@hugeicons/react", "player.global.js (the icons of the player's controls)"),
    await mit(
      "@hugeicons/core-free-icons",
      "player.global.js (the icons of the player's controls)",
    ),
    await mit("tailwindcss", "player.css (the base styles)"),
    await font("@fontsource-variable/sofia-sans", "Sofia Sans"),
    await font("@fontsource-variable/jetbrains-mono", "JetBrains Mono"),
    {
      name: "Phosphor Icons",
      part: "player.global.js (the pictograms of the slide kit, bold weight)",
      license: "MIT",
      copyright: ["Copyright (c) 2023 Phosphor Icons"],
    },
    {
      name: "Simple Icons",
      part: "player.global.js (the product marks of the slide kit)",
      license: "CC0-1.0",
      copyright: [
        "Dedicated to the public domain. The marks are trademarks of their owners and stand",
        "only for the product they name.",
      ],
    },
  ];
  const mitText = (await licenseOf("react")).split("\n").slice(4).join("\n");
  const oflText = (await licenseOf("@fontsource-variable/sofia-sans")).split("\n").slice(1);
  return renderNotices(list, {
    "MIT License": mitText,
    "SIL Open Font License 1.1": oflText.join("\n"),
  });
}

async function filesUnder(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await filesUnder(path)));
    else found.push(path);
  }
  return found.sort();
}

const script = join(out, "player.global.js");
if (!existsSync(script)) {
  throw new Error("player/player.global.js is missing: run tsdown first (`bun run build`).");
}

const version = fieldOf(join(root, "package.json"), "version");
if (version === undefined) throw new Error("package.json has no version.");
const { css, classes } = await stylesheet();
const { inline, linked } = await fonts();

await writeFile(join(out, "player.css"), css);
await writeFile(join(out, "classes.json"), `${JSON.stringify(classes, null, 2)}\n`);
await writeFile(join(out, "fonts.inline.css"), inline);
await writeFile(join(out, "fonts.css"), linked);
await writeFile(join(out, "NOTICES.txt"), await notices());

// Last, over everything else that is there now.
await rm(join(out, "manifest.json"), { force: true });
const files: Record<string, { bytes: number; sha256: string }> = {};
for (const path of await filesUnder(out)) {
  const data = await readFile(path);
  files[relative(out, path).replaceAll("\\", "/")] = {
    bytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  };
}
await writeFile(join(out, "manifest.json"), `${JSON.stringify({ version, files }, null, 2)}\n`);

const kB = (name: string) => `${((files[name]?.bytes ?? 0) / 1000).toFixed(1)} kB`;
console.log(
  `wrote player/: player.global.js ${kB("player.global.js")}, player.css ${kB("player.css")}, ` +
    `fonts.inline.css ${kB("fonts.inline.css")}, ${classes.length} classes`,
);
