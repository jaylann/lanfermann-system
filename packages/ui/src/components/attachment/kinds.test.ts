import { describe, expect, it } from "vitest";

import { extensionOf, fitName, kindOf, splitName, typeWord } from "./kinds";

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

describe("fitName", () => {
  // One unit per letter: the width a text is drawn at is its length.
  const measure = (text: string) => text.length;

  it("leaves a name that fits as it is", () => {
    expect(fitName("Angebot.pdf", 11, measure)).toBe("Angebot.pdf");
  });

  it("cuts in the middle, keeping the extension and the last letters before it", () => {
    expect(fitName("Angebot-Kornprobst.pdf", 18, measure)).toBe("Angebot-Ko…bst.pdf");
    expect(fitName("Angebot-Kornprobst.pdf", 18, measure).length).toBeLessThanOrEqual(18);
  });

  it("cuts at the end of the name, before the extension, when nothing is kept", () => {
    expect(fitName("Angebot-Kornprobst.pdf", 18, measure, 0)).toBe("Angebot-Kornp….pdf");
  });

  it("gives up the kept letters before the last letter of the head", () => {
    expect(fitName("Angebot-Kornprobst.pdf", 7, measure)).toBe("A…t.pdf");
    expect(fitName("Angebot-Kornprobst.pdf", 3, measure)).toBe("….pdf");
  });

  it("leaves no space before the ellipsis", () => {
    expect(fitName("Fotos Backstube.zip", 14, measure)).toBe("Fotos…ube.zip");
  });
});

describe("typeWord", () => {
  it("names the extension, or the kind", () => {
    expect(typeWord({ name: "Angebot.pdf" })).toBe("PDF");
    expect(typeWord({ name: "Backstube", type: "image/png" })).toBe("Bild");
  });
});
