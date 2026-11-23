import { Folder01Icon } from "@hugeicons/core-free-icons";
import { describe, expect, it } from "vitest";

import { kindSymbols, kindSymbolsSmall } from "@/components/attachment/kinds";

import { kindSymbolOf } from "./file-kind-symbol";

describe("kindSymbolOf", () => {
  it("draws a kind without its letters below 16px", () => {
    expect(kindSymbolOf("pdf", 14)).toBe(kindSymbolsSmall.pdf);
    expect(kindSymbolOf("sheet", 15)).toBe(kindSymbolsSmall.sheet);
  });

  it("draws the letters of its type from 16px on", () => {
    expect(kindSymbolOf("pdf", 16)).toBe(kindSymbols.pdf);
    expect(kindSymbolOf("image", 32)).toBe(kindSymbols.image);
  });

  it("draws a folder as a folder at every size", () => {
    expect(kindSymbolOf("folder", 14)).toBe(Folder01Icon);
    expect(kindSymbolOf("folder", 48)).toBe(Folder01Icon);
  });
});
