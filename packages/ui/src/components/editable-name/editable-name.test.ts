import { describe, expect, it } from "vitest";

import { baseNameEnd } from "./editable-name";

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
