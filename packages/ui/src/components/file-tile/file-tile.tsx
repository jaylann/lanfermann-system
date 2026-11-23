"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { cva } from "class-variance-authority";
import {
  type ComponentProps,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { kindOf } from "@/components/attachment/kinds";
import { FileGridContext } from "@/components/file-grid/file-grid-context";
import {
  FileKindSymbol,
  type FileSymbolKind,
} from "@/components/file-kind-symbol/file-kind-symbol";
import { Icon } from "@/components/icon/icon";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import { Progress, ProgressTrack } from "@/components/progress/progress";
import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/** Where a file stands: on its way, arrived, or failed. */
export type FileTileStatus = "uploading" | "done" | "error";

const statusWords: Record<FileTileStatus, string> = {
  uploading: "Wird hochgeladen",
  done: "Hochgeladen",
  error: "Fehlgeschlagen",
};

export type FileTileProps = Omit<ComponentProps<"div">, "children"> & {
  /** The file's or folder's name, as it is shown and read out: „Angebot_Kowalski_Herbst.pdf“. */
  name: string;
  /** Its MIME type, which says what kind of file it is. Without it the extension does. */
  type?: string;
  /** What it is, where name and type cannot tell: `folder` for a folder. */
  kind?: FileSymbolKind;
  /**
   * The address of its picture (an image file, or a picture of what the file holds). It loads
   * when the tile comes near the window and fades in; where it cannot be loaded, the symbol of
   * the file's kind stands instead.
   */
  src?: string;
  /** What stands in the picture's place instead of the picture or the symbol. */
  preview?: ReactNode;
  /** The facts under the name, in one short line: „84 KB · gestern“. */
  meta?: ReactNode;
  /** Part of the current selection: the tile wears the chosen edge and its mark closes. */
  selected?: boolean;
  /** Done unless said otherwise. On its way it shows a bar; failed, it says why. */
  status?: FileTileStatus;
  /** How much has arrived, from 0 to 1, while it is `uploading`. Without it the bar runs through. */
  progress?: number;
  /** Why it failed, as a sentence: „Die Verbindung wurde unterbrochen.“ */
  error?: ReactNode;
  /** With it a failed file offers to try once more. */
  onRetry?: () => void;
  /** The words on the key that tries again. */
  retryLabel?: ReactNode;
  /** What each state is called for assistive tech, said before the name. */
  statusLabels?: Partial<Record<FileTileStatus, string>>;
  /**
   * `file` (the default): its picture or symbol above its name. `folder`: a folder, opened
   * rather than looked at, so it is a compact tile with its symbol before its name.
   */
  variant?: "file" | "folder";
  /** The word said before a folder's name to assistive tech, which cannot see its symbol. */
  folderLabel?: string;
  /**
   * Files or items hang over it and it would take them (a folder): it wears the field's halo,
   * as a field does when it has the focus. Set by a drop target.
   */
  dropOver?: boolean;
};

const fileTile = cva(
  [
    "group/tile relative isolate flex min-w-0 rounded-xl text-left select-none",
    // A part that is handled stands on a bevelled card (Fase; Justin, 2026-11-23, over the
    // picture flat on the well). The chosen edge eases in on `settle` and what is given up
    // leaves on `leave`, as on a choice card.
    "bg-surface depth-bevel transition-[box-shadow] spring-leave data-selected:depth-bevel-chosen data-selected:spring-settle",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    // A drop target takes the field's halo on `snap`, laid over the card, so the card's own
    // shadow does not have to change its layers.
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:shadow-field-focus",
    "after:transition-opacity after:spring-snap data-drop-over:after:opacity-100",
  ],
  {
    variants: {
      shape: {
        /** A file: its picture or symbol above its name. */
        tile: "p-1",
        /**
         * A folder: one line in the files' columns (Justin, 2026-11-23, over a folder as large
         * as a file).
         */
        row: "min-h-11 items-center px-3 py-2",
      },
    },
  },
);

/** The mark shows under the pointer, with the keyboard on the tile, and while anything is chosen. */
const markShown =
  "group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100 group-data-selected/tile:opacity-100 group-has-[[data-selected]]/files:opacity-100";
/** What the mark takes the place of gives way while the mark shows. */
const markHides =
  "group-hover/tile:opacity-0 group-focus-visible/tile:opacity-0 group-data-selected/tile:opacity-0 group-has-[[data-selected]]/files:opacity-0";

/**
 * The mark: the checkbox's own socket, which takes the accent plug and its tick when the tile is
 * chosen. It seats on `seat`, as a checkbox does, and appears on `snap`.
 */
const markLook = [
  "flex size-(--check-size) shrink-0 items-center justify-center rounded-xs bg-surface text-on-accent depth-socket opacity-0",
  "[transition:opacity_var(--transition-duration-spring-snap)_var(--ease-spring-snap),box-shadow_var(--transition-duration-spring-seat)_var(--ease-spring-seat),background-color_var(--transition-duration-spring-seat)_var(--ease-spring-seat)]",
  markShown,
  "group-data-selected/tile:bg-accent group-data-selected/tile:depth-plug group-data-selected/tile:depth-tone-accent",
].join(" ");

function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden data-slot="file-tile-mark" className={cn(markLook, className)}>
      {/* The tick draws in (short leg first), as a checkbox's does. */}
      <TickGlyph className="opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-selected/tile:opacity-100 group-data-selected/tile:[stroke-dashoffset:0]" />
    </span>
  );
}

/**
 * The kind's symbol before a folder's name, which gives its place to the mark while the mark
 * shows: a folder row has no picture to carry it.
 */
function SymbolOrMark({ kind }: { kind: FileSymbolKind }) {
  return (
    <span className="relative flex size-(--check-size) shrink-0 items-center justify-center">
      <FileKindSymbol
        kind={kind}
        size={16}
        className={cn("text-fg-muted transition-opacity spring-snap", markHides)}
      />
      <Mark className="absolute" />
    </span>
  );
}

/**
 * A file's picture, which fades in on `settle` once it has loaded. One that was already loaded
 * (from the cache, before the page woke up) is simply there; one that cannot be loaded gives
 * its place to the kind's symbol.
 */
function Picture({ src, kind }: { src: string; kind: FileSymbolKind }) {
  const picture = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  // A new address starts over. Compared while rendering, as React asks for state that follows
  // a prop.
  const [address, setAddress] = useState(src);
  if (address !== src) {
    setAddress(src);
    setState("loading");
  }
  // The load may have happened before React was listening: the server's page loads pictures
  // before it wakes up.
  useLayoutEffect(() => {
    const element = picture.current;
    if (element?.complete && element.currentSrc) {
      setState(element.naturalWidth > 0 ? "loaded" : "failed");
    }
  }, [src]);
  if (state === "failed") return <PreviewSymbol kind={kind} />;
  return (
    <img
      ref={picture}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      // Dragging the tile moves the file, not its picture.
      draggable={false}
      data-slot="file-tile-picture"
      data-loaded={state === "loaded" ? "" : undefined}
      onLoad={() => setState("loaded")}
      onError={() => setState("failed")}
      className="size-full object-contain opacity-0 transition-opacity spring-settle data-loaded:opacity-100"
    />
  );
}

/** The kind's symbol, large, where there is no picture. */
function PreviewSymbol({ kind }: { kind: FileSymbolKind }) {
  return (
    <FileKindSymbol data-slot="file-tile-symbol" kind={kind} size={32} className="text-fg-muted" />
  );
}

/**
 * One file or folder in a `FileGrid`: what it shows (its picture, or the symbol of its kind),
 * its name cut in the middle so its end stays readable („Angebot_Ko…bst.pdf“), and a short line
 * of facts („84 KB · gestern“). It is a part that is handled (chosen, opened, dragged), so it
 * stands on a bevelled card; chosen, it wears the accent edge and its mark closes. The mark
 * shows under the pointer and while anything in the grid is chosen.
 *
 * A file on its way shows its own picture with a bar across its foot; once it has arrived the
 * bar is seen full for a moment and fades. A file that failed says why over its picture, with a
 * key that tries again. Nothing changes the tile's size, so the grid never moves under a change
 * of state. A folder (`variant="folder"`) is a compact tile, its symbol before its name.
 *
 * Choosing, opening and the keyboard are the caller's: spread `useSelection`'s item props on it.
 * Word the facts as a file manager would: the size, then when it changed, „84 KB · gestern“.
 */
export function FileTile({
  name,
  type,
  kind: kindProp,
  src,
  preview,
  meta,
  selected,
  status = "done",
  progress,
  error,
  onRetry,
  retryLabel = "Noch einmal versuchen",
  statusLabels,
  variant = "file",
  folderLabel = "Ordner",
  dropOver = false,
  className,
  ...props
}: FileTileProps) {
  const { inGrid } = useContext(FileGridContext);
  const kind = kindProp ?? (variant === "folder" ? "folder" : kindOf({ name, type }));
  const shape = variant === "folder" ? "row" : "tile";

  // The bar is there once the file has been on its way, so it can be seen full and fade when
  // the file arrives; a file that was there all along never had one. State that follows a
  // prop, compared while rendering.
  const [carried, setCarried] = useState(status === "uploading");
  if (status === "uploading" && !carried) setCarried(true);
  // What a failure said, kept while it fades after the file is tried again.
  const [said, setSaid] = useState({ error, retry: onRetry !== undefined });
  if (status === "error" && (said.error !== error || said.retry !== (onRetry !== undefined))) {
    setSaid({ error, retry: onRetry !== undefined });
  }
  const failed = status === "error";
  const fraction = Math.min(1, Math.max(0, progress ?? 0));
  const words = { ...statusWords, ...statusLabels };

  // Said before the name: a folder is named as one, a file that is not there yet by its state.
  const spoken = (
    <span className="sr-only">
      {variant === "folder" ? `${folderLabel}: ` : status === "done" ? "" : `${words[status]}: `}
    </span>
  );

  const title = (
    <span
      data-slot="file-tile-name"
      className="flex min-w-0 items-center gap-1.5 text-control font-medium text-fg"
    >
      {shape === "row" && <SymbolOrMark kind={kind} />}
      {spoken}
      <MiddleTruncate text={name} />
    </span>
  );

  const metaLine = (
    <span
      data-slot="file-tile-meta"
      // A line is kept even without facts, so every tile in a row of the grid is as tall.
      className="min-h-[1lh] truncate text-sm text-fg-muted tabular-nums"
    >
      {meta}
    </span>
  );

  const body =
    shape === "row" ? (
      <>
        <span className="min-w-0 flex-1">{title}</span>
        {meta !== undefined && (
          <span
            data-slot="file-tile-meta"
            // The name comes first: in a row narrower than 16rem the facts are only read out,
            // or „archiv 2025“ would be cut down to „ar…025“ beside them.
            className="sr-only shrink-0 text-sm whitespace-nowrap text-fg-muted tabular-nums @3xs:not-sr-only"
          >
            {meta}
          </span>
        )}
      </>
    ) : (
      <>
        <div
          data-slot="file-tile-preview"
          className={cn(
            "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-well",
            // Its edge: a hairline drawn inside it, over the picture.
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-hairline",
          )}
        >
          {preview ??
            (src !== undefined ? <Picture src={src} kind={kind} /> : <PreviewSymbol kind={kind} />)}
          {/* At the top left over the picture (Justin, 2026-11-23, over before the name). */}
          <Mark className="absolute top-2 left-2" />
          {carried && (
            <div
              data-slot="file-tile-progress"
              aria-hidden={status === "uploading" ? undefined : true}
              className={cn(
                "absolute inset-x-2 bottom-2",
                status === "uploading"
                  ? "transition-opacity spring-settle"
                  : // Arrived: seen full for a moment (its fill glides there), then gone.
                    "opacity-0 transition-opacity delay-200 spring-leave",
              )}
            >
              <Progress
                aria-label={name}
                value={
                  status === "uploading"
                    ? progress === undefined
                      ? null
                      : fraction * 100
                    : status === "done"
                      ? 100
                      : fraction * 100
                }
              >
                <ProgressTrack className="h-1" />
              </Progress>
            </div>
          )}
          {(said.error !== undefined || said.retry) && (
            <div
              data-slot="file-tile-error"
              aria-hidden={failed ? undefined : true}
              inert={!failed}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface px-3 text-center",
                "transition-opacity spring-settle",
                // A failure that is there on load stands still; one that happens later fades in.
                failed ? "in-data-live:starting:opacity-0" : "opacity-0 spring-leave",
              )}
            >
              <Icon icon={Alert02Icon} size={18} className="text-danger" />
              <span className="line-clamp-3 text-sm font-semibold text-pretty text-danger">
                {said.error ?? words.error}
              </span>
              {said.retry && (
                <button
                  type="button"
                  data-slot="file-tile-retry"
                  onClick={onRetry}
                  className="touch-target relative rounded-xs text-sm font-medium text-fg underline decoration-1 underline-offset-[0.25em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {retryLabel}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col px-1.5 pt-2 pb-1">
          {title}
          {metaLine}
        </div>
      </>
    );

  return (
    <div
      data-slot="file-tile"
      data-variant={variant}
      data-status={status}
      data-selected={selected ? "" : undefined}
      data-drop-over={dropOver ? "" : undefined}
      // In a grid a tile is one of its rows, which can be chosen; alone it is a plain block.
      role={inGrid ? "row" : undefined}
      aria-selected={inGrid ? selected : undefined}
      className={cn(fileTile({ shape }), className)}
      {...props}
    >
      <div
        role={inGrid ? "gridcell" : undefined}
        className={cn(
          "flex min-w-0 flex-1",
          shape === "row" ? "@container items-center gap-3" : "flex-col",
        )}
      >
        {body}
      </div>
    </div>
  );
}
