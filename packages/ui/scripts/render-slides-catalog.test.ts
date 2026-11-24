import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { slideGroups } from "../src/slides/catalog/groups.ts";
import { exportedParts, readSlidesCatalog, renderSlidesCatalog } from "./render-slides-catalog.ts";
import { readSlideSource } from "./slides-catalog-source.ts";

const entries = readSlidesCatalog(slideGroups, readSlideSource);

/** Parts that are not written in a deck by hand, so they carry no example. */
const WITHOUT_EXAMPLE = ["Deck", "Stage", "Spacer", "Footer"];

describe("the slides catalog", () => {
  it("catalog.generated.ts is in sync with the parts (run `bun run gen:slides-catalog`)", () => {
    const onDisk = readFileSync(
      new URL("../src/slides/catalog/catalog.generated.ts", import.meta.url),
      "utf8",
    );
    expect(onDisk).toBe(renderSlidesCatalog(entries));
  });

  it("lists every part the entry exports, once", () => {
    const listed = Object.values(slideGroups).flat();
    expect([...listed].sort()).toEqual(exportedParts(readSlideSource).sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("says what every part is for, and what every prop does", () => {
    const silent = entries.flatMap((entry) => [
      ...(entry.summary ? [] : [entry.name]),
      ...entry.props
        .filter((prop) => !prop.description)
        .map((prop) => `${entry.name}.${prop.name}`),
    ]);
    expect(silent).toEqual([]);
  });

  it("spells every prop's type out, so it can be read without the source", () => {
    const opaque = entries.flatMap((entry) =>
      entry.props
        .filter((prop) => /\btypeof\b|\bkeyof\b/.test(prop.type))
        .map((prop) => `${entry.name}.${prop.name}: ${prop.type}`),
    );
    expect(opaque).toEqual([]);
  });

  it("shows every part a deck is written with in an example", () => {
    const bare = entries
      .filter((entry) => !entry.example && !WITHOUT_EXAMPLE.includes(entry.name))
      .map((entry) => entry.name);
    expect(bare).toEqual([]);
  });
});
