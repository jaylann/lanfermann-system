import { describe, expect, it } from "vitest";

import { droppedFiles } from "./drag-depth";

/** One thing a drop carries, as the browser hands it over. */
const item = (file: File | null, folder = false, kind = "file") => ({
  kind,
  getAsFile: () => file,
  webkitGetAsEntry: () => (file ? { isDirectory: folder } : null),
});

/** What a drop carries, as far as `droppedFiles` reads it. */
const drop = (...items: ReturnType<typeof item>[]) => ({ items }) as unknown as DataTransfer;

describe("droppedFiles", () => {
  const pdf = new File(["%PDF"], "Angebot.pdf", { type: "application/pdf" });
  const folder = new File([], "Fotos");

  it("takes the files a drop carried", () => {
    expect(droppedFiles(drop(item(pdf)))).toEqual({ files: [pdf], folders: [] });
  });

  it("tells a folder from a file by its entry", () => {
    expect(droppedFiles(drop(item(folder, true), item(pdf)))).toEqual({
      files: [pdf],
      folders: [folder],
    });
  });

  it("takes a file that has no entry (one made by a script) as a file", () => {
    const made = { ...item(pdf), webkitGetAsEntry: () => null };
    expect(droppedFiles(drop(made)).files).toEqual([pdf]);
  });

  it("leaves out what is not a file: the text or the address dragged with it", () => {
    expect(droppedFiles(drop(item(null, false, "string"), item(pdf))).files).toEqual([pdf]);
  });
});
