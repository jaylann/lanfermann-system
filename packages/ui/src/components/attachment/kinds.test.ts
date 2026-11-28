import { describe, expect, it } from "vitest";

import { extensionOf, fitName, kindOf, mayBeTransparent, splitName, typeWord } from "./kinds";

describe("mayBeTransparent", () => {
  it("says yes for the formats that can hold see-through pixels", () => {
    expect(mayBeTransparent({ name: "logo.svg", type: "image/svg+xml" })).toBe(true);
    expect(mayBeTransparent({ name: "badge.png", type: "image/png" })).toBe(true);
    expect(mayBeTransparent({ name: "hero.webp", type: "image/webp" })).toBe(true);
    expect(mayBeTransparent({ name: "lade.gif", type: "image/gif" })).toBe(true);
    expect(mayBeTransparent({ name: "titelbild.avif", type: "image/avif" })).toBe(true);
    expect(mayBeTransparent({ name: "favicon.ico", type: "image/x-icon" })).toBe(true);
    expect(mayBeTransparent({ name: "favicon.ico", type: "image/vnd.microsoft.icon" })).toBe(true);
  });

  it("says no for photos that cannot", () => {
    expect(mayBeTransparent({ name: "ofen.jpg", type: "image/jpeg" })).toBe(false);
    expect(mayBeTransparent({ name: "IMG_2041.HEIC", type: "image/heic" })).toBe(false);
    expect(mayBeTransparent({ name: "ofen.jpeg" })).toBe(false);
  });

  it("lets an image type decide over the extension", () => {
    expect(mayBeTransparent({ name: "logo.png", type: "image/jpeg" })).toBe(false);
    expect(mayBeTransparent({ name: "logo", type: "Image/SVG+XML; charset=utf-8" })).toBe(true);
  });

  it("reads the extension where the type says nothing about the picture", () => {
    expect(mayBeTransparent({ name: "Logo_Dark.SVG" })).toBe(true);
    expect(mayBeTransparent({ name: "favicon.ico", type: "application/octet-stream" })).toBe(true);
    expect(mayBeTransparent({ name: "Angebot.pdf", type: "application/pdf" })).toBe(false);
    expect(mayBeTransparent({ name: "LIESMICH" })).toBe(false);
  });
});

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

  it("never cuts through a letter written in two parts", () => {
    // A Mac names its files with the dots apart from the letter: „ü“ is „u“ and U+0308.
    expect(fitName("Entwu\u0308rfe-Fru\u0308hjahr.pdf", 13, measure)).toBe("Entw…ahr.pdf");
    expect(fitName("Angebot-Gru\u0308n.pdf", 12, measure, 2)).toBe("Ange…u\u0308n.pdf");
  });

  it("never cuts through an emoji", () => {
    expect(fitName("Urlaub-📷📷📷📷.zip", 14, measure)).toBe("Url…📷📷📷.zip");
  });
});

describe("typeWord", () => {
  it("names the extension, or the kind", () => {
    expect(typeWord({ name: "Angebot.pdf" })).toBe("PDF");
    expect(typeWord({ name: "Backstube", type: "image/png" })).toBe("Bild");
  });
});
