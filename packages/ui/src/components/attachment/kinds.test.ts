import { describe, expect, it } from "vitest";

import { extensionOf, kindOf, splitName, typeWord } from "./kinds";

describe("kindOf", () => {
  it("reads the MIME type first", () => {
    expect(kindOf({ name: "scan", type: "application/pdf" })).toBe("pdf");
    expect(kindOf({ name: "IMG_2041.HEIC", type: "image/heic" })).toBe("image");
    expect(
      kindOf({
        name: "Preise",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toBe("sheet");
  });

  it("falls back to the extension", () => {
    expect(kindOf({ name: "Leistungsverzeichnis.xlsx" })).toBe("sheet");
    expect(kindOf({ name: "Fotos-Baustelle.ZIP" })).toBe("archive");
    expect(kindOf({ name: "notiz.txt", type: "text/plain" })).toBe("document");
  });

  it("calls the rest a file", () => {
    expect(kindOf({ name: "export.bin", type: "application/octet-stream" })).toBe("file");
    expect(kindOf({ name: "LIESMICH" })).toBe("file");
  });
});

describe("extensionOf and splitName", () => {
  it("keeps the extension apart, as it was written", () => {
    expect(extensionOf("Angebot.PDF")).toBe("pdf");
    expect(splitName("Q3 Deck — FINAL v12.pdf")).toEqual({
      stem: "Q3 Deck — FINAL v12",
      end: ".pdf",
    });
  });

  it("leaves names without an extension whole", () => {
    expect(splitName(".env")).toEqual({ stem: ".env", end: "" });
    expect(splitName("Version 2.0.1-final")).toEqual({ stem: "Version 2.0.1-final", end: "" });
  });
});

describe("typeWord", () => {
  it("names the extension, or the kind", () => {
    expect(typeWord({ name: "Angebot.pdf" })).toBe("PDF");
    expect(typeWord({ name: "Backstube", type: "image/png" })).toBe("Bild");
  });
});
