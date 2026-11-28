import { describe, expect, it } from "vitest";

import { baseNameEnd, flattenLines, nameToTake } from "./editable-name";

describe("baseNameEnd", () => {
  it("ends the base name before the extension", () => {
    expect(baseNameEnd("hero.webp")).toBe(4);
    expect(baseNameEnd("Angebot_Kowalski_Herbst.pdf")).toBe(23);
  });

  it("takes the whole name where there is no extension", () => {
    expect(baseNameEnd("entwürfe")).toBe(8);
    expect(baseNameEnd("README")).toBe(6);
  });

  it("keeps a dotted version in the base name", () => {
    expect(baseNameEnd("release-1.2.3456789")).toBe(19);
  });

  it("keeps the last extension of a double one apart", () => {
    expect(baseNameEnd("backup.tar.gz")).toBe(10);
  });

  it("treats a leading dot as part of the name", () => {
    expect(baseNameEnd(".env")).toBe(4);
  });
});

describe("flattenLines", () => {
  it("leaves one line as it is, with the spaces it was typed with", () => {
    expect(flattenLines("Herbstfest  der Schreinerei ")).toBe("Herbstfest  der Schreinerei ");
    expect(flattenLines("")).toBe("");
  });

  it("makes one space of a line break and the spaces around it", () => {
    expect(flattenLines("Herbstfest\nder Schreinerei")).toBe("Herbstfest der Schreinerei");
    expect(flattenLines("Herbstfest \r\n  der Schreinerei")).toBe("Herbstfest der Schreinerei");
    expect(flattenLines("eins\n\n\nzwei\u2028drei\u2029vier")).toBe("eins zwei drei vier");
  });

  it("turns a break at either end into a space, which taking the name trims", () => {
    expect(flattenLines("\nHerbstfest\n")).toBe(" Herbstfest ");
  });
});

describe("nameToTake", () => {
  it("is the typed name without the spaces around it", () => {
    expect(nameToTake("  titel.webp ", "hero.webp", false)).toBe("titel.webp");
  });

  it("is nothing where the name is as it was", () => {
    expect(nameToTake("hero.webp", "hero.webp", false)).toBeUndefined();
    expect(nameToTake(" hero.webp ", "hero.webp", true)).toBeUndefined();
  });

  it("keeps the old name over an empty field unless the value may be empty", () => {
    expect(nameToTake("", "hero.webp", false)).toBeUndefined();
    expect(nameToTake("   ", "hero.webp", false)).toBeUndefined();
    expect(nameToTake("", "Herbstfest", true)).toBe("");
    expect(nameToTake("  \n ", "Herbstfest", true)).toBe("");
  });

  it("is nothing for a value that was empty and stays empty", () => {
    expect(nameToTake(" ", "", true)).toBeUndefined();
  });

  it("takes a pasted break as a space", () => {
    expect(nameToTake("Herbstfest\nder Schreinerei\n", "Herbstfest", false)).toBe(
      "Herbstfest der Schreinerei",
    );
  });
});
