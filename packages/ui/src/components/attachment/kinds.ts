/**
 * What kind of file an attachment is, from its MIME type or else its name: the symbol it
 * carries and the word that names it. Plain functions, so they can be tested and used anywhere.
 */
import {
  Csv01Icon,
  Doc01Icon,
  File01Icon,
  FileAudioIcon,
  FileVideoIcon,
  Image01Icon,
  Pdf01Icon,
  Xls01Icon,
  Zip01Icon,
} from "@hugeicons/core-free-icons";

import type { IconSvgElement } from "@/components/icon/icon";

export type FileKind =
  "pdf" | "image" | "sheet" | "csv" | "document" | "archive" | "audio" | "video" | "file";

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

/** The word under a file's name: its extension as it is written (`PDF`), or its kind's word. */
export function typeWord(file: { name: string; type?: string }): string {
  const extension = extensionOf(file.name);
  if (extension && extension.length <= 5) return extension.toUpperCase();
  return kindWords[kindOf(file)];
}
