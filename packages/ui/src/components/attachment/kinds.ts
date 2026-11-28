/**
 * What kind of file an attachment is, from its MIME type or else its name: the symbol it
 * carries and the word that names it. Plain functions, so they can be tested and used anywhere.
 */
import {
  Csv01Icon,
  Doc01Icon,
  File01Icon,
  FileArchiveIcon,
  FileAudioIcon,
  FileEmpty02Icon,
  FileImageIcon,
  FilePenLineIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  Image01Icon,
  Pdf01Icon,
  Xls01Icon,
  Zip01Icon,
} from "@hugeicons/core-free-icons";

import type { IconSvgElement } from "@/components/icon/icon";

export type FileKind =
  "pdf" | "image" | "sheet" | "csv" | "document" | "archive" | "audio" | "video" | "file";

/** The symbol of a kind at a tile's size (18px), where the letters of a type stay readable. */
export const kindSymbols: Record<FileKind, IconSvgElement> = {
  pdf: Pdf01Icon,
  image: Image01Icon,
  sheet: Xls01Icon,
  csv: Csv01Icon,
  document: Doc01Icon,
  archive: Zip01Icon,
  audio: FileAudioIcon,
  video: FileVideoIcon,
  file: File01Icon,
};

/**
 * The symbol of a kind in a chip (14px): a sheet with what it holds, without letters. At 14px
 * the stroke is pinned to 1.5px, and the letters of „PDF“ or „XLS“ ran together into blots
 * (Justin, 2026-11-20: "the icons look too thick, they kinda explode"). The extension stands in
 * the name beside it anyway.
 */
export const kindSymbolsSmall: Record<FileKind, IconSvgElement> = {
  pdf: FileTextIcon,
  image: FileImageIcon,
  sheet: FileSpreadsheetIcon,
  csv: FileSpreadsheetIcon,
  document: FilePenLineIcon,
  archive: FileArchiveIcon,
  audio: FileAudioIcon,
  video: FileVideoIcon,
  // The same sheet as the others, its corner folded at the top: `File01Icon` folds at its foot.
  file: FileEmpty02Icon,
};

/** The word for a kind where the name has no extension to show. */
export const kindWords: Record<FileKind, string> = {
  pdf: "PDF",
  image: "Bild",
  sheet: "Tabelle",
  csv: "CSV",
  document: "Dokument",
  archive: "Archiv",
  audio: "Audio",
  video: "Video",
  file: "Datei",
};

const byExtension: Record<string, FileKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  heic: "image",
  svg: "image",
  xls: "sheet",
  xlsx: "sheet",
  numbers: "sheet",
  ods: "sheet",
  csv: "csv",
  doc: "document",
  docx: "document",
  pages: "document",
  odt: "document",
  rtf: "document",
  txt: "document",
  md: "document",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  gz: "archive",
  tar: "archive",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  mp4: "video",
  mov: "video",
  webm: "video",
};

/** The extension of a file name, lower case, without its dot: `pdf`. Empty if it has none. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

/** A name in the two parts that are drawn apart: what may be cut, and the end that stays. */
export function splitName(name: string): { stem: string; end: string } {
  const extension = extensionOf(name);
  // A long "extension" is part of the name (a dotted version number): nothing stays apart.
  if (!extension || extension.length > 5) return { stem: name, end: "" };
  return { stem: name.slice(0, -(extension.length + 1)), end: `.${name.slice(-extension.length)}` };
}

let segmenter: Intl.Segmenter | undefined;

/**
 * The letters of a text as they are read: an „ü“ written as a „u“ and its dots (as a Mac names
 * its files) and an emoji of several parts are one each, so a cut never goes through them.
 */
function lettersOf(text: string): string[] {
  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

/**
 * A file name shortened to fit `width`, cut with an ellipsis the way a file manager cuts it:
 * the extension always stays, and so do the last `keep` letters before it, so „Angebot-
 * Kornprobst.pdf“ becomes „Angebot-Ko…bst.pdf“. `measure` gives the drawn width of a text in
 * the name's own font. The cut is exact, so no gap is left before what stays (a CSS ellipsis
 * leaves up to a letter's room). A name that fits is returned as it is.
 */
export function fitName(
  name: string,
  width: number,
  measure: (text: string) => number,
  keep = 3,
): string {
  if (measure(name) <= width) return name;
  const { stem: whole, end } = splitName(name);
  const stem = lettersOf(whole);
  // What stays after the ellipsis: as much of the asked tail as still leaves a letter in front.
  for (let tail = Math.min(keep, Math.max(0, stem.length - 1)); tail >= 0; tail--) {
    const after = `…${stem.slice(stem.length - tail).join("")}${end}`;
    const room = stem.length - tail;
    // The longest head that fits in front of it.
    let low = 0;
    let high = room;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (measure(stem.slice(0, mid).join("") + after) <= width) low = mid;
      else high = mid - 1;
    }
    if (low > 0) return stem.slice(0, low).join("").trimEnd() + after;
  }
  return `…${end}`;
}

/** The kind of a file: its MIME type decides, and its extension where the type says too little. */
export function kindOf({ name, type = "" }: { name: string; type?: string }): FileKind {
  const mime = type.toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "text/csv") return "csv";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "sheet";
  if (mime.includes("wordprocessing") || mime === "application/msword") return "document";
  if (mime.includes("zip") || mime.includes("compressed")) return "archive";
  return byExtension[extensionOf(name)] ?? (mime.startsWith("text/") ? "document" : "file");
}

/** The picture formats that can hold see-through pixels, by MIME type and by extension. */
const seeThroughTypes = new Set([
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const seeThroughExtensions = new Set(["png", "webp", "svg", "gif", "avif", "ico"]);

/**
 * Whether a file's picture may have see-through parts, so it is shown on the `checker`: a PNG,
 * WebP, SVG, GIF, AVIF or icon may, a JPEG cannot. Whether it really has any is only known once
 * it is decoded, so this is the format's word, not the picture's. As in `kindOf`, an image type
 * decides and the extension speaks where the type says nothing about the picture.
 */
export function mayBeTransparent({ name, type = "" }: { name: string; type?: string }): boolean {
  // A type from a server may carry parameters: „image/svg+xml; charset=utf-8“.
  const mime = (type.split(";")[0] ?? "").trim().toLowerCase();
  if (mime.startsWith("image/")) return seeThroughTypes.has(mime);
  return seeThroughExtensions.has(extensionOf(name));
}

/** The word under a file's name: its extension as it is written (`PDF`), or its kind's word. */
export function typeWord(
  file: { name: string; type?: string },
  words: Record<FileKind, string> = kindWords,
): string {
  const extension = extensionOf(file.name);
  if (extension && extension.length <= 5) return extension.toUpperCase();
  return words[kindOf(file)];
}
