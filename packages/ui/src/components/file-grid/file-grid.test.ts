import { describe, expect, it } from "vitest";

import { columnsOf } from "./file-grid";

describe("columnsOf", () => {
  it("counts the tracks of a computed template", () => {
    expect(columnsOf("176px 176px 176px 176px")).toBe(4);
  });

  it("reads tracks with fractions and extra spaces", () => {
    expect(columnsOf("  171.5px   171.5px ")).toBe(2);
  });

  it("is one column where the grid has no tracks yet", () => {
    expect(columnsOf("none")).toBe(1);
    expect(columnsOf("")).toBe(1);
  });
});
