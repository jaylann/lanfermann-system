/**
 * What a `FileUpload` works out without a browser: which files it takes, and how a size reads.
 * Plain functions, so they can be tested and used on a server.
 */

/** Why a file was not taken. */
export type FileRejection = {
  file: File;
  /** `type`: not one of the kinds asked for. `size`: over the limit. `count`: one too many. */
  reason: "type" | "size" | "count";
};

export type FileRules = {
  /** As on an `<input type="file">`: `.pdf`, `image/*`, `application/pdf`, comma-separated. */
  accept?: string;
  /** The largest size a file may have, in bytes. */
  maxSize?: number;
  /** Whether more than one file may be taken at once. */
  multiple?: boolean;
};

/** Whether a file is one of the kinds an `accept` string asks for. No `accept` takes every file. */
export function acceptsFile(file: Pick<File, "name" | "type">, accept?: string): boolean {
  const kinds = (accept ?? "")
    .split(",")
    .map((kind) => kind.trim().toLowerCase())
    .filter(Boolean);
  if (kinds.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return kinds.some((kind) => {
    if (kind.startsWith(".")) return name.endsWith(kind);
    if (kind.endsWith("/*")) return type.startsWith(kind.slice(0, -1));
    return type === kind;
  });
}

/**
 * Sorts dropped, pasted or chosen files into those that are taken and those that are not, each
 * with its reason. Without `multiple` the first file that fits is taken and the others are one
 * too many.
 */
export function sortFiles(
  files: readonly File[],
  { accept, maxSize, multiple = false }: FileRules,
) {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!acceptsFile(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: "size" });
    else if (!multiple && accepted.length > 0) rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** The unit a number of bytes reads best in, as a power of 1000: 2 400 000 is counted in MB. */
function unitOf(bytes: number) {
  return Math.min(UNITS.length - 1, bytes < 1 ? 0 : Math.floor(Math.log10(bytes) / 3));
}

function inUnit(bytes: number, unit: number, locale: string) {
  // Bytes and kilobytes are whole numbers; from a megabyte on, one decimal says enough.
  const digits = unit < 2 ? 0 : 1;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(bytes / 1000 ** unit);
}

/**
 * A size the way a file manager writes it, in powers of 1000 and with the locale's decimal
 * comma: "842 KB", "2,4 MB".
 */
export function formatFileSize(bytes: number, locale = "de-DE"): string {
  const unit = unitOf(bytes);
  return `${inUnit(bytes, unit, locale)} ${UNITS[unit]}`;
}

/**
 * How much of a file has arrived, both numbers in the unit of the whole: "1,2 von 2,4 MB". The
 * word between them is the caller's, for another language.
 */
export function formatFileProgress(
  loaded: number,
  total: number,
  locale = "de-DE",
  of = "von",
): string {
  const unit = unitOf(total);
  const part = inUnit(Math.min(loaded, total), unit, locale);
  return `${part} ${of} ${inUnit(total, unit, locale)} ${UNITS[unit]}`;
}
