import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  WORDMARK_DOT,
  WORDMARK_LETTERS,
  WORDMARK_SHORT_DOT,
  WORDMARK_SHORT_LETTERS,
} from "./logo-paths";
import { logomarkPaths, logomarkSeam } from "./logomark";

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

describe("the wordmark's outlines", () => {
  // The logo is drawn in the brand kit and copied here. If one of these fails, somebody edited a
  // path by hand: take the paths from the kit's files again instead.
  it.each([
    [
      "letters",
      WORDMARK_LETTERS,
      "e52f765f32603379605ad711651642c0cb18dc1d7225398e407c71fa44175d86",
    ],
    ["dot", WORDMARK_DOT, "7c923f4f2e03c38ed2cfd697c098acb954ff41eb1bd33959195b13ad9996fde3"],
    [
      "short letters",
      WORDMARK_SHORT_LETTERS,
      "e64595280174708bba5ec77fc07ecefc6f07bfa95fbc37d90383d28fb4c5029c",
    ],
    [
      "short dot",
      WORDMARK_SHORT_DOT,
      "7c923f4f2e03c38ed2cfd697c098acb954ff41eb1bd33959195b13ad9996fde3",
    ],
  ])("%s are the kit's", (_name, path, checksum) => {
    expect(sha256(path)).toBe(checksum);
  });
});

describe("the symbol", () => {
  it("draws the kit's two-tone mitre from 48px up", () => {
    // symbol-ink.svg
    expect(logomarkPaths(logomarkSeam(48, "duo"))).toEqual({
      stem: "M0 -0.21L0 -12L3 -12L3 -3.21Z",
      foot: "M0.21 0L10 0L10 -3L3.21 -3Z",
    });
  });

  it("closes the seam below 48px, as the kit's favicon does", () => {
    expect(logomarkPaths(logomarkSeam(24, "duo"))).toEqual({
      stem: "M0 0L0 -12L3 -12L3 -3Z",
      foot: "M0 0L10 0L10 -3L3 -3Z",
    });
  });

  it("draws the kit's one-colour mitre with the wider seam at every size", () => {
    // symbol-white.svg
    for (const size of [16, 24, 96]) {
      expect(logomarkPaths(logomarkSeam(size, "mono"))).toEqual({
        stem: "M0 -0.35L0 -12L3 -12L3 -3.35Z",
        foot: "M0.35 0L10 0L10 -3L3.35 -3Z",
      });
    }
  });
});

describe("the brand files", () => {
  // Copied from the kit as they are: favicon (16 to 32px), app icon and avatar (from 48px).
  it.each([
    ["favicon.svg", "c90f488b58b3089f56d9a94def86b6d07787b7a1f443c6642d6008cfc7caed67"],
    ["app-icon.svg", "1919bca3734f41c10677e64a6d9a370820dd01beb5477db939006589336ec67b"],
    ["avatar.svg", "db01d36a0e991a43488bce063be7668e3201a67542417f552c02d1e9973a27bf"],
  ])("%s is the kit's file", (file, checksum) => {
    expect(sha256(readFileSync(resolve(import.meta.dirname, "../../../brand", file), "utf8"))).toBe(
      checksum,
    );
  });
});
