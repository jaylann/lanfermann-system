import { describe, expect, it } from "vitest";

import { acceptsFile, formatFileProgress, formatFileSize, sortFiles } from "./files";

const file = (name: string, type: string, size = 1000) => ({ name, type, size }) as unknown as File;

describe("acceptsFile", () => {
  it("takes every file when nothing is asked for", () => {
    expect(acceptsFile(file("a.xyz", ""))).toBe(true);
    expect(acceptsFile(file("a.xyz", ""), " ")).toBe(true);
  });

  it("matches an extension, without regard to case", () => {
    expect(acceptsFile(file("Angebot.PDF", ""), ".pdf")).toBe(true);
    expect(acceptsFile(file("angebot.pdf.exe", ""), ".pdf")).toBe(false);
  });

  it("matches a kind and a family of kinds", () => {
    expect(acceptsFile(file("logo.png", "image/png"), "image/*")).toBe(true);
    expect(acceptsFile(file("logo.png", "image/png"), "application/pdf, image/png")).toBe(true);
    expect(acceptsFile(file("notiz.txt", "text/plain"), "image/*,.pdf")).toBe(false);
    // "imagex/…" is not in the family "image/".
    expect(acceptsFile(file("x", "imagex/png"), "image/*")).toBe(false);
  });
});

describe("sortFiles", () => {
  const pdf = file("angebot.pdf", "application/pdf", 2_400_000);
  const big = file("plan.pdf", "application/pdf", 12_000_000);
  const text = file("notiz.txt", "text/plain", 300);

  it("gives each file that is not taken its reason", () => {
    const { accepted, rejected } = sortFiles([pdf, big, text], {
      accept: ".pdf",
      maxSize: 10_000_000,
      multiple: true,
    });
    expect(accepted).toEqual([pdf]);
    expect(rejected).toEqual([
      { file: big, reason: "size" },
      { file: text, reason: "type" },
    ]);
  });

  it("takes one file only unless told otherwise", () => {
    const second = file("zweites.pdf", "application/pdf");
    const { accepted, rejected } = sortFiles([text, pdf, second], { accept: ".pdf" });
    expect(accepted).toEqual([pdf]);
    expect(rejected).toEqual([
      { file: text, reason: "type" },
      { file: second, reason: "count" },
    ]);
  });

  it("takes a file that is exactly as large as the limit", () => {
    expect(sortFiles([pdf], { maxSize: 2_400_000 }).accepted).toEqual([pdf]);
  });
});

describe("formatFileSize", () => {
  it("writes sizes the German way, in powers of 1000", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(842_000)).toBe("842 KB");
    expect(formatFileSize(2_400_000)).toBe("2,4 MB");
    expect(formatFileSize(1_000_000)).toBe("1,0 MB");
    expect(formatFileSize(3_250_000_000)).toBe("3,3 GB");
  });

  it("follows another locale's decimal sign", () => {
    expect(formatFileSize(2_400_000, "en-US")).toBe("2.4 MB");
  });

  it("counts what rounds to a full thousand in the next unit", () => {
    expect(formatFileSize(999)).toBe("999 B");
    expect(formatFileSize(999_499)).toBe("999 KB");
    expect(formatFileSize(999_500)).toBe("1,0 MB");
    expect(formatFileSize(999_999)).toBe("1,0 MB");
    expect(formatFileSize(999_949_999)).toBe("999,9 MB");
    expect(formatFileSize(999_950_000)).toBe("1,0 GB");
  });
});

describe("formatFileProgress", () => {
  it("writes both numbers in the unit of the whole", () => {
    expect(formatFileProgress(1_200_000, 2_400_000)).toBe("1,2 von 2,4 MB");
    expect(formatFileProgress(40_000, 2_400_000)).toBe("0,0 von 2,4 MB");
    expect(formatFileProgress(300_000, 842_000)).toBe("300 von 842 KB");
  });

  it("keeps both numbers in the unit the whole is written in", () => {
    expect(formatFileProgress(500_000, 999_999)).toBe("0,5 von 1,0 MB");
  });

  it("never says more than the whole", () => {
    expect(formatFileProgress(3_000_000, 2_400_000)).toBe("2,4 von 2,4 MB");
  });

  it("takes the word between the numbers from the caller", () => {
    expect(formatFileProgress(1_200_000, 2_400_000, "en-US", "of")).toBe("1.2 of 2.4 MB");
  });
});
