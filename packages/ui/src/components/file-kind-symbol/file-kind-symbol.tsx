import { Folder01Icon } from "@hugeicons/core-free-icons";

import { type FileKind, kindSymbols, kindSymbolsSmall } from "@/components/attachment/kinds";
import { Icon, type IconProps, type IconSvgElement } from "@/components/icon/icon";

/** What a file is, or that it is a folder. */
export type FileSymbolKind = FileKind | "folder";

/**
 * Below this size a symbol is drawn without the letters of its type: at 14px „PDF“ and „XLS“
 * ran together into blots (Justin, 2026-11-20).
 */
const LETTERS_FROM = 16;

/** The symbol a kind is drawn with at a size: with its type's letters from 16px on. */
export function kindSymbolOf(kind: FileSymbolKind, size: number): IconSvgElement {
  if (kind === "folder") return Folder01Icon;
  return size < LETTERS_FROM ? kindSymbolsSmall[kind] : kindSymbols[kind];
}

export type FileKindSymbolProps = Omit<IconProps, "icon" | "size"> & {
  /** What the file is (`kindOf` tells it from a name and a type), or `folder`. */
  kind: FileSymbolKind;
  /**
   * Edge length in px. 14 in a chip or a row (a sheet with what it holds, no letters), 18 in a
   * tile, larger where a file has no picture to show.
   */
  size?: number;
};

/**
 * The symbol of a kind of file: a sheet that says what it holds (a PDF, a picture, a table), or
 * a folder. It stands where a file has no picture of its own: in a chip, a row, a tile, a
 * preview. Below 16px it is drawn without the letters of its type, which run together there.
 * Decorative unless given a `label`; the name beside it says what the file is.
 */
export function FileKindSymbol({ kind, size = 18, ...props }: FileKindSymbolProps) {
  return (
    <Icon data-slot="file-kind-symbol" icon={kindSymbolOf(kind, size)} size={size} {...props} />
  );
}
