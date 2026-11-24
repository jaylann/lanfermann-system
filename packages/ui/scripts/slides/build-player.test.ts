import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { classesOf, faceOf, fontFaceRule, renderNotices } from "./render-player-assets.ts";

describe("the classes a stylesheet defines", () => {
  it("finds every class in a selector, with its escapes undone", () => {
    const css = [
      ".bg-ground{background-color:var(--color-ground)}",
      ".p-\\[128px\\]{padding:128px}",
      ".hover\\:bg-hover:hover{background-color:var(--color-hover)}",
      ".\\32 xl\\:flex{display:flex}",
      ".w-1\\/2,.text-\\[13\\.5px\\]{width:50%}",
      ".group:hover .group-hover\\:underline{text-decoration-line:underline}",
    ].join("");
    expect(classesOf(css)).toEqual([
      "2xl:flex",
      "bg-ground",
      "group",
      "group-hover:underline",
      "hover:bg-hover",
      "p-[128px]",
      "text-[13.5px]",
      "w-1/2",
    ]);
  });

  it("looks into nested rules and under at-rules, but not at their heads", () => {
    const css =
      "@media (width>=40.5rem){.sm\\:flex{display:flex;&:hover{.inner{color:red}}}}" +
      "@layer utilities{.truncate{overflow:hidden}}";
    expect(classesOf(css)).toEqual(["inner", "sm:flex", "truncate"]);
  });

  it("takes no number, string or comment for a class", () => {
    const css =
      "/* .not-a-class */" +
      '.a{margin:.5rem 1.25rem;content:".b{";background:url("x.woff2")}' +
      ".c{transition:opacity .2s}";
    expect(classesOf(css)).toEqual(["a", "c"]);
  });
});

describe("the faces of the kit", () => {
  const fontsource = `
/* sofia-sans-latin-ext-wght-normal */
@font-face {
  font-family: 'Sofia Sans Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 1 1000;
  src: url(./files/sofia-sans-latin-ext-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0100-0240;
}
/* sofia-sans-latin-wght-normal */
@font-face {
  font-family: 'Sofia Sans Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 1 1000;
  src: url(./files/sofia-sans-latin-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+2000-206F;
}`;

  it("reads one face by its name", () => {
    expect(faceOf(fontsource, "sofia-sans-latin-wght-normal")).toEqual({
      family: "Sofia Sans Variable",
      style: "normal",
      weight: "1 1000",
      unicodeRange: "U+0000-00FF,U+2000-206F",
    });
  });

  it("fails loudly for a face the stylesheet does not have", () => {
    expect(() => faceOf(fontsource, "sofia-sans-cyrillic-wght-normal")).toThrow(/No @font-face/);
  });

  it("writes a rule that blocks instead of swapping", () => {
    const rule = fontFaceRule(
      faceOf(fontsource, "sofia-sans-latin-wght-normal"),
      "data:font/woff2;base64,AAAA",
    );
    expect(rule).toContain('font-family: "Sofia Sans Variable";');
    expect(rule).toContain("font-display: block;");
    expect(rule).toContain('src: url(data:font/woff2;base64,AAAA) format("woff2-variations");');
    expect(rule).not.toContain("swap");
  });
});

describe("the notices", () => {
  it("names every work with its licence and copyright, then the licences' texts", () => {
    const text = renderNotices(
      [
        { name: "react", part: "player.global.js", license: "MIT", copyright: ["Copyright (c) M"] },
        { name: "Simple Icons", part: "marks", license: "CC0-1.0", copyright: [] },
      ],
      { "MIT License": "Permission is hereby granted" },
    );
    expect(text).toContain("react (MIT)\n  player.global.js\n  Copyright (c) M\n");
    expect(text).toContain("Simple Icons (CC0-1.0)\n  marks\n");
    expect(text.indexOf("MIT License\n")).toBeGreaterThan(text.indexOf("Simple Icons"));
    expect(text).toContain("Permission is hereby granted");
  });
});

/*
 * The built player, if this checkout has one (`bun run build` writes it; a fresh checkout that
 * only runs the tests has none, and the build's own run of this file in CI has).
 */
describe("the prebuilt player", () => {
  const dir = fileURLToPath(new URL("../../player/", import.meta.url));
  const built = existsSync(`${dir}manifest.json`);

  it.runIf(built)("fits in a single file: script, styles and fonts stay under 900 kB", () => {
    const size = (name: string) => readFileSync(`${dir}${name}`).byteLength;
    const total = size("player.global.js") + size("player.css") + size("fonts.inline.css");
    expect(total).toBeLessThan(900_000);
  });

  it.runIf(built)("defines the classes a deck is written in", () => {
    const classes: unknown = JSON.parse(readFileSync(`${dir}classes.json`, "utf8"));
    expect(classes).toEqual(
      expect.arrayContaining(["text-slide-title", "slide-span-10", "bg-ground"]),
    );
  });

  it.runIf(built)("lists every file it ships with its size", () => {
    const manifest: unknown = JSON.parse(readFileSync(`${dir}manifest.json`, "utf8"));
    const bytes = (name: string) => ({ bytes: readFileSync(`${dir}${name}`).byteLength });
    expect(manifest).toMatchObject({
      files: {
        "player.global.js": bytes("player.global.js"),
        "player.css": bytes("player.css"),
        "fonts.inline.css": bytes("fonts.inline.css"),
        "fonts.css": bytes("fonts.css"),
        "classes.json": bytes("classes.json"),
        "NOTICES.txt": bytes("NOTICES.txt"),
        "fonts/sofia-sans-latin-wght-normal.woff2": bytes(
          "fonts/sofia-sans-latin-wght-normal.woff2",
        ),
      },
    });
  });
});
