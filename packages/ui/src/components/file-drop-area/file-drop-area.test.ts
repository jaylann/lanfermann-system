import { describe, expect, it } from "vitest";

import { itemsWord, readItems } from "./file-drop-area";

describe("readItems", () => {
  it("reads the ids a drag of items carried", () => {
    expect(readItems('["hero","badge"]')).toEqual(["hero", "badge"]);
  });

  it("is empty where nothing was carried", () => {
    expect(readItems("")).toEqual([]);
  });

  it("refuses what is not a list of strings", () => {
    expect(readItems("{")).toEqual([]);
    expect(readItems('{"ids":["hero"]}')).toEqual([]);
    expect(readItems('["hero",3]')).toEqual([]);
  });
});

describe("itemsWord", () => {
  it("counts one file and several", () => {
    expect(itemsWord(1)).toBe("1 Datei");
    expect(itemsWord(3)).toBe("3 Dateien");
  });
});
