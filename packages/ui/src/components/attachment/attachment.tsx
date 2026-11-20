"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Chip } from "@/components/chip/chip";
import { chipRemoveKey } from "@/components/chip/chip-variants";
import { formatFileSize } from "@/components/file-upload/files";
import { Icon } from "@/components/icon/icon";
import { Spinner } from "@/components/spinner/spinner";
import { CloseGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

import { fitName, kindOf, kindSymbols, kindSymbolsSmall, typeWord } from "./kinds";

/** Where a file stands: on its way, arrived, or failed. */
export type AttachmentStatus = "uploading" | "done" | "error";

/** `chip`: a plug in a prompt. `tile`: a file shown in a message, a picture as itself. */
export type AttachmentVariant = "chip" | "tile";

/** Inside a prompt's row of attachments, they are chips unless they say otherwise. */
export const AttachmentVariantContext = createContext<AttachmentVariant>("tile");

const defaultStatusLabels: Record<AttachmentStatus, string> = {
  uploading: "Wird hochgeladen",
  done: "Hochgeladen",
  error: "Fehlgeschlagen",
};

export type AttachmentProps = Omit<ComponentProps<"div">, "children"> & {
  /** The file's name, as it is shown and read out: „Angebot-Kornprobst.pdf“. */
  name: string;
  /** Its size in bytes. */
  size?: number;
  /** Its MIME type, which says what kind of file it is. Without it the extension does. */
  type?: string;
  /** The address of a picture, which then shows itself. */
  src?: string;
  /** Done unless said otherwise. */
  status?: AttachmentStatus;
  /** Why it failed, as a sentence, where there is room for one (a tile). */
  error?: string;
  /** With it there is a key that takes the file away again. */
  onRemove?: () => void;
  /** What the key that takes it away is called, as one verb after the file's name. */
  removeLabel?: string;
  /** Where the file can be opened: the tile becomes a link to it. */
  href?: string;
  /** In a prompt's row a chip, elsewhere a tile. */
  variant?: AttachmentVariant;
  /**
   * The face of a chip: `plug` (the default), a small raised part, or `flat`, quiet like a
   * `Badge`, for a row of many or a place that is already busy.
   */
  chipVariant?: "plug" | "flat";
  /** What each state is called. */
  statusLabels?: Partial<Record<AttachmentStatus, string>>;
  locale?: string;
};

/** How many letters before the extension stay where a name is cut: „Angebot-Ko…bst.pdf“. */
const KEPT_LETTERS = 3;

/**
 * A name too long for its place, cut in its middle with an ellipsis as a file manager cuts it:
 * the extension and the last three letters before it stay (`fitName`), „Angebot-Ko…bst.pdf“.
 * Chosen by Justin (2026-11-20) over a cut at the end of the name and over the fade before the
 * extension, which "looks odd". The room is the width the whole name would take, or less where
 * the chip runs out: an unseen copy of the whole name sets it, and the cut is worked out again
 * when the room changes.
 */
function FileName({ name, className }: { name: string; className?: string }) {
  const room = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(name);
  useLayoutEffect(() => {
    const box = room.current;
    const measuring = probe.current;
    if (!box || !measuring) return;
    let live = true;
    let frame = 0;
    const fit = () => {
      // Measured on the page by an unseen copy in the name's own font: measured on a canvas,
      // the cuts left gaps of up to two letters. Layout pixels, so a chip that is still
      // growing in measures at its real size.
      const measure = (each: string) => {
        measuring.textContent = each;
        return measuring.offsetWidth;
      };
      // The room is the whole name's width where it fits, so the whole name is checked against
      // it as it is; a cut keeps a pixel to spare, since a width is read rounded.
      const room = box.clientWidth;
      setShown(measure(name) <= room ? name : fitName(name, room - 1, measure, KEPT_LETTERS));
    };
    fit();
    // A new room is fitted in the next frame, not while the observer reports it: the cut it
    // renders would be a change of layout inside the report.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(box);
    // The web font changes every width.
    void document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [name]);
  return (
    <span
      ref={room}
      data-slot="attachment-name"
      className={cn("grid min-w-0 grid-cols-[minmax(0,max-content)]", className)}
    >
      <span aria-hidden className="col-start-1 row-start-1 overflow-hidden whitespace-nowrap">
        {shown}
      </span>
      {/* Unseen and out of the layout: where a cut is measured. */}
      <span ref={probe} aria-hidden className="invisible absolute whitespace-nowrap" />

      {/* Unseen, the whole name: it gives the room its width. */}
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 h-0 overflow-hidden whitespace-nowrap"
      >
        {name}
      </span>
      {/* Read out whole: the cut name would be heard with its ellipsis. */}
      <span className="sr-only">{name}</span>
    </span>
  );
}

/**
 * A file attached to a prompt or shown in a message: a symbol for its kind, its name, its size,
 * and a key that takes it away while it still can be. In a prompt it is a chip, a plug in the
 * field; in a message a small flat tile, and a picture shows itself.
 *
 * While it uploads it carries the system's arc in place of its symbol; once it has arrived, the
 * symbol comes back where the arc was. A failure is said in words („Fehlgeschlagen“, and in a
 * tile why). The name is cut in its middle, so the end of it and the extension stay readable.
 */
export function Attachment({
  name,
  size,
  type,
  src,
  status = "done",
  error,
  onRemove,
  removeLabel = "entfernen",
  href,
  variant: variantProp,
  chipVariant = "plug",
  statusLabels,
  locale = "de-DE",
  className,
  ...props
}: AttachmentProps) {
  const placed = useContext(AttachmentVariantContext);
  const variant = variantProp ?? placed;
  const labels = { ...defaultStatusLabels, ...statusLabels };
  const kind = kindOf({ name, type });
  const picture = kind === "image" && src !== undefined;
  const sizeWord = size === undefined ? undefined : formatFileSize(size, locale);

  /** In front: the arc on the way, the danger symbol after a failure, else the kind. */
  const mark = (small: boolean) =>
    status === "uploading" ? (
      <Spinner size={small ? 12 : 16} className="text-fg" />
    ) : status === "error" ? (
      <Icon icon={Alert02Icon} size={small ? 12 : 16} className="text-danger" />
    ) : (
      // Arrived: the symbol comes in softly where the arc was.
      <Icon
        icon={small ? kindSymbolsSmall[kind] : kindSymbols[kind]}
        size={small ? 14 : 18}
        className="text-fg-muted transition-opacity spring-settle in-data-live:starting:opacity-0"
      />
    );

  if (variant === "chip") {
    return (
      <Chip
        data-slot="attachment"
        data-variant="chip"
        data-status={status}
        variant={chipVariant}
        title={name}
        onRemove={onRemove}
        removeLabel={removeLabel}
        className={cn("max-w-64", className)}
        lead={
          <span
            data-slot="attachment-mark"
            aria-hidden
            className="-ml-0.5 flex size-3.5 shrink-0 items-center justify-center"
          >
            {picture && status === "done" ? (
              <img src={src} alt="" className="size-4 max-w-none rounded-[3px] object-cover" />
            ) : (
              mark(true)
            )}
          </span>
        }
        {...(props as ComponentProps<"span">)}
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <FileName name={name} />
          {status === "error" ? (
            <span className="shrink-0 font-normal text-danger">{labels.error}</span>
          ) : status === "uploading" ? (
            <span className="sr-only">{labels.uploading}</span>
          ) : (
            sizeWord && (
              <span className="shrink-0 font-normal text-fg-muted tabular-nums">{sizeWord}</span>
            )
          )}
        </span>
      </Chip>
    );
  }

  return (
    <AttachmentTile
      name={name}
      picture={picture ? src : undefined}
      href={href}
      onRemove={onRemove}
      removeLabel={removeLabel}
      status={status}
      className={className}
      mark={mark(false)}
      meta={
        status === "uploading" ? (
          labels.uploading
        ) : status === "error" ? (
          <span className="text-danger">{error ?? labels.error}</span>
        ) : (
          [typeWord({ name, type }), sizeWord].filter(Boolean).join(" · ")
        )
      }
      {...props}
    />
  );
}

type TileProps = Omit<ComponentProps<"div">, "children"> & {
  name: string;
  picture?: string;
  href?: string;
  onRemove?: () => void;
  removeLabel: string;
  status: AttachmentStatus;
  mark: ReactNode;
  meta: ReactNode;
};

/** A file in a message: read, so flat; a picture as itself. */
function AttachmentTile({
  name,
  picture,
  href,
  onRemove,
  removeLabel,
  status,
  mark,
  meta,
  className,
  ...props
}: TileProps) {
  const nameId = useId();
  const removeId = useId();
  const Root = href ? "a" : "div";
  const remove = onRemove && (
    <button
      type="button"
      id={removeId}
      data-slot="attachment-remove"
      aria-label={removeLabel}
      aria-labelledby={`${nameId} ${removeId}`}
      onClick={onRemove}
      className={cn(
        chipRemoveKey,
        picture
          ? "absolute top-1.5 right-1.5 size-6 rounded-full bg-raised depth-plug text-fg"
          : "absolute right-2.5",
      )}
    >
      <CloseGlyph width={8} height={8} />
    </button>
  );

  if (picture) {
    return (
      <div
        data-slot="attachment"
        data-variant="tile"
        data-status={status}
        className={cn("relative inline-flex max-w-64", className)}
        {...props}
      >
        <Root
          {...(href ? { href } : {})}
          className={cn(
            "relative block overflow-hidden rounded-lg",
            // The picture's edge: a hairline drawn inside it, over the picture.
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-hairline",
            href &&
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
        >
          <img
            id={nameId}
            src={picture}
            alt={name}
            // Lengths, not shares: the box is as wide as the picture, so a share of it has
            // nothing to be a share of.
            className="block h-auto max-h-40 w-auto max-w-64 object-cover"
          />
          {status !== "done" && (
            <span className="absolute bottom-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-raised depth-plug">
              {mark}
            </span>
          )}
        </Root>
        {remove}
      </div>
    );
  }

  return (
    <div
      data-slot="attachment"
      data-variant="tile"
      data-status={status}
      className={cn("relative flex w-64 max-w-full items-center", className)}
      {...props}
    >
      <Root
        {...(href ? { href } : {})}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-surface p-2 inset-ring inset-ring-hairline forced-colors:inset-ring-[CanvasText]",
          // Room for the key, which stands beside the link rather than inside it.
          remove ? "pr-10" : "pr-3",
          href && [
            "transition-colors spring-snap hover:bg-surface-quiet",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          ],
        )}
      >
        <span
          data-slot="attachment-mark"
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-quiet"
        >
          {mark}
        </span>
        <span className="flex min-w-0 flex-col">
          <span id={nameId} className="min-w-0 text-sm font-medium text-fg">
            <FileName name={name} />
          </span>
          <span
            data-slot="attachment-meta"
            className={cn(
              "text-sm text-fg-muted tabular-nums",
              // A failure is a sentence and wraps; the facts of a file stay on one line.
              status === "error" ? "line-clamp-3" : "truncate",
            )}
          >
            {meta}
          </span>
        </span>
      </Root>
      {remove}
    </div>
  );
}

export type MessageAttachmentsProps = ComponentProps<"div">;

/**
 * The files of a message, side by side, wrapping: at the start of an answer, at the right above
 * the person's words. Put `Attachment`s inside.
 */
export function MessageAttachments({ className, ...props }: MessageAttachmentsProps) {
  return (
    <div
      data-slot="message-attachments"
      className={cn(
        "flex flex-wrap items-end gap-2 *:shrink-0 in-data-[from=user]:justify-end",
        className,
      )}
      {...props}
    />
  );
}
