import type { ComponentProps } from "react";

import {
  FileKindSymbol,
  type FileSymbolKind,
} from "@/components/file-kind-symbol/file-kind-symbol";
import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/**
 * When the mark takes the picture's place: under the pointer, with the keyboard on the row, while
 * the row's menu is open or the row is chosen, and while anything in the list is chosen, so more
 * are chosen with a press each.
 */
const markShown =
  "group-hover/thumb:opacity-100 group-focus-visible/row:opacity-100 group-data-popup-open/row:opacity-100 in-data-selected:opacity-100 [tbody:has([data-selected])_&]:opacity-100";
const pictureHides =
  "group-hover/thumb:opacity-0 group-focus-visible/row:opacity-0 group-data-popup-open/row:opacity-0 in-data-selected:opacity-0 [tbody:has([data-selected])_&]:opacity-0";

export type FileThumbProps = Omit<ComponentProps<"span">, "children"> & {
  /** What the file is (`kindOf` tells it from a name and a type), or `folder`. */
  kind: FileSymbolKind;
  /** The picture, small: an image's own address. Without it the kind's symbol stands. */
  src?: string;
};

/**
 * A row's small picture in a list of files (a `Table` with `useSelection`): the image itself,
 * or its kind's symbol on the well. It gives its place to the selection's mark, as the mark of a
 * `FileTile` shows: under the pointer, with the keyboard on its row, while the row is chosen, and
 * while anything in the list is chosen. A press on the mark adds the row to what is chosen or
 * takes it away (`data-selection-toggle`), as Cmd and a click do. The mark is a socket that takes
 * the accent plug and its drawn tick when the row is chosen; it fades in on `snap` and seats on
 * `seat`.
 *
 * Server-safe.
 */
export function FileThumb({ kind, src, className, ...props }: FileThumbProps) {
  return (
    <span
      data-slot="file-thumb"
      className={cn(
        "group/thumb relative flex size-8 shrink-0 items-center justify-center",
        className,
      )}
      {...props}
    >
      <span
        data-slot="file-thumb-picture"
        className={cn(
          "flex size-full items-center justify-center overflow-hidden rounded-sm bg-well transition-opacity spring-snap",
          pictureHides,
        )}
      >
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <FileKindSymbol kind={kind} size={16} className="text-fg-muted" />
        )}
      </span>
      <span
        aria-hidden
        data-slot="file-thumb-mark"
        // A press on the mark adds the row to what is chosen, or takes it away (`useSelection`).
        data-selection-toggle=""
        className={cn(
          // On a touch screen a press beside the mark still hits it (`touch-target`).
          "touch-target absolute flex size-(--check-size) items-center justify-center rounded-xs bg-surface text-on-accent opacity-0 depth-socket",
          "[transition:opacity_var(--transition-duration-spring-snap)_var(--ease-spring-snap),box-shadow_var(--transition-duration-spring-seat)_var(--ease-spring-seat),background-color_var(--transition-duration-spring-seat)_var(--ease-spring-seat)]",
          markShown,
          "in-data-selected:bg-accent in-data-selected:depth-plug in-data-selected:depth-tone-accent",
        )}
      >
        {/* The tick draws in (short leg first), as a checkbox's does. */}
        <TickGlyph className="opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] in-data-selected:opacity-100 in-data-selected:[stroke-dashoffset:0]" />
      </span>
    </span>
  );
}
