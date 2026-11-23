"use client";

import { Alert02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Progress, ProgressTrack } from "@/components/progress/progress";
import { Spinner } from "@/components/spinner/spinner";
import { carriesFiles, useDragDepth } from "@/internal/drag-depth";
import { CloseGlyph } from "@/internal/glyphs";
import { placeProps, useLive, usePresence } from "@/internal/presence";
import { cn } from "@/lib/cn";

import {
  type FileRejection,
  type FileRules,
  formatFileProgress,
  formatFileSize,
  sortFiles,
} from "./files";

type FileUploadContextValue = {
  /** Opens the system's file dialog. */
  open: () => void;
  /** Takes files from a drop or a paste, sorts them by the rules and reports them. */
  add: (files: readonly File[]) => void;
  disabled: boolean;
  /**
   * Whether the upload has stood for a frame. A list that is put in later (with its first
   * file) then opens its rows as one that was there all along does.
   */
  live: boolean;
};

const FileUploadContext = createContext<FileUploadContextValue>({
  open: () => {},
  add: () => {},
  disabled: false,
  live: false,
});

export type FileUploadProps = Omit<ComponentProps<"div">, "onChange"> &
  FileRules & {
    /**
     * Called with the files that were dropped, pasted or chosen and that fit the rules. Start
     * their upload here and show each as a `FileUploadItem`.
     */
    onFilesAdded: (files: File[]) => void;
    /** Called with the files that were not taken, each with its reason. Say so in words. */
    onReject?: (rejected: FileRejection[]) => void;
    /** Nothing can be added right now. */
    disabled?: boolean;
    /** The name the chosen files are submitted under, if the field is part of a plain form. */
    name?: string;
  };

/**
 * Takes files: a zone to drop them on, a button that opens the system's dialog, and a list of
 * what was added with the state of each. It does not upload anything. It reports the files
 * (`onFilesAdded`) and shows the progress the caller gives it; sending, resuming and checking
 * them is the caller's work.
 *
 * Put a `FileUploadZone` inside and, under it, a `FileUploadList` of `FileUploadItem`s. A real
 * file input stands behind the button, so it works from the keyboard and with assistive tech,
 * and a file pasted while the focus is in the zone is taken as well. `accept` and `maxSize`
 * are checked here for every way in; what does not fit comes back through `onReject`.
 */
export function FileUpload({
  accept,
  maxSize,
  multiple = false,
  onFilesAdded,
  onReject,
  disabled = false,
  name,
  className,
  children,
  ...props
}: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const live = useLive();
  const context = useMemo<FileUploadContextValue>(
    () => ({
      disabled,
      live,
      open: () => input.current?.click(),
      add: (files) => {
        if (disabled || files.length === 0) return;
        const { accepted, rejected } = sortFiles(files, { accept, maxSize, multiple });
        if (accepted.length > 0) onFilesAdded(accepted);
        if (rejected.length > 0) onReject?.(rejected);
      },
    }),
    [accept, maxSize, multiple, disabled, live, onFilesAdded, onReject],
  );
  return (
    <FileUploadContext value={context}>
      <div
        data-slot="file-upload"
        data-live={live ? "" : undefined}
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {/* The real control. It is opened by the zone's button and never takes the focus. */}
        <input
          ref={input}
          type="file"
          hidden
          tabIndex={-1}
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          data-slot="file-upload-input"
          onChange={(event) => {
            context.add([...(event.currentTarget.files ?? [])]);
            // The same file can be chosen again after it was removed from the list.
            if (!name) event.currentTarget.value = "";
          }}
        />
        {children}
      </div>
    </FileUploadContext>
  );
}

export type FileUploadZoneProps = Omit<ComponentProps<"div">, "title"> & {
  /** What to do, as a short line: "Dateien hierher ziehen". */
  title?: ReactNode;
  /** The same line while a file hangs over the zone. */
  dropTitle?: ReactNode;
  /** What is taken: the kinds and the largest size ("PDF oder Bild, höchstens 10 MB"). */
  description?: ReactNode;
  /** The words on the button that opens the system's dialog. */
  buttonLabel?: ReactNode;
  /**
   * `tile` (the default): a symbol in a small tile above the words. `plain`: the words and the
   * button alone, for a lower zone: one of several in a form, or in a narrow card.
   */
  variant?: "tile" | "plain";
  /** The symbol in the tile. */
  icon?: IconSvgElement;
};

/**
 * Where files are dropped. It is a socket, cut like a field: white, with a hairline edge. While
 * a file hangs over it, it takes the field's halo, the sign that it will take what is let go.
 * There is no dashed border. Its button opens the system's file dialog.
 */
export function FileUploadZone({
  title = "Dateien hierher ziehen",
  dropTitle = "Loslassen, um sie hinzuzufügen",
  description,
  buttonLabel = "Dateien auswählen",
  variant = "tile",
  icon = Upload04Icon,
  className,
  ...props
}: FileUploadZoneProps) {
  const { open, add, disabled } = useContext(FileUploadContext);
  // Entering a child fires a leave on the zone and an enter on the child: counted, the zone
  // knows when the file has really left it.
  const { over, reset, handlers } = useDragDepth(carriesFiles, disabled);
  return (
    <div
      data-slot="file-upload-zone"
      data-variant={variant}
      data-dragging={over ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "group/zone flex flex-col items-center gap-1 rounded-xl bg-surface px-6 py-6 text-center depth-field",
        "transition-[box-shadow,background-color] spring-snap data-dragging:depth-field-focus",
        "data-disabled:bg-disabled data-disabled:depth-flat",
        className,
      )}
      {...handlers}
      onDrop={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        reset();
        add([...event.dataTransfer.files]);
      }}
      onPaste={(event) => {
        const files = [...event.clipboardData.files];
        if (files.length === 0) return;
        event.preventDefault();
        add(files);
      }}
      {...props}
    >
      {variant === "tile" && (
        <span
          aria-hidden
          data-slot="file-upload-tile"
          className="mb-2 flex size-10 items-center justify-center rounded-lg bg-surface-quiet text-fg-muted inset-ring inset-ring-hairline group-data-disabled/zone:bg-disabled group-data-disabled/zone:text-on-disabled forced-colors:inset-ring-[CanvasText]"
        >
          {/* It rises a little while a file hangs over the zone: it is about to be taken up. */}
          <Icon
            icon={icon}
            size={18}
            className="transition-[translate,color] spring-seat group-data-dragging/zone:-translate-y-0.5 group-data-dragging/zone:text-accent"
          />
        </span>
      )}
      <p
        data-slot="file-upload-title"
        className="text-control font-medium text-fg group-data-disabled/zone:text-on-disabled"
      >
        {over ? dropTitle : title}
      </p>
      {description !== undefined && (
        <p
          data-slot="file-upload-description"
          className="text-sm text-pretty text-fg-muted group-data-disabled/zone:text-on-disabled"
        >
          {description}
        </p>
      )}
      <Button size="sm" disabled={disabled} onClick={open} className="mt-3">
        {buttonLabel}
      </Button>
    </div>
  );
}

const keyOf = (element: ReactElement) => element.key ?? "";

export type FileUploadListProps = ComponentProps<"ul">;

/**
 * A row's place in the list. It opens from nothing when a file joins and folds shut when one is
 * removed, so the rows below glide. Every change of height in the list is one of these folds,
 * or the fold of a bar or an error inside a row: each eases by itself and the list adds them
 * up, so a file that arrives while another is removed does not make the list chase its own
 * height. The place clips only up and down: the focus ring of a key stays whole.
 */
const placeOfFile = [
  "group/place grid grid-rows-[1fr] overflow-y-clip transition-[grid-template-rows] spring-settle",
  "in-data-live:starting:grid-rows-[0fr]",
  // What leaves has faded (`leave`) before its place closes, so its text is never cut through.
  "data-leaving:grid-rows-[0fr] data-leaving:delay-[120ms]",
].join(" ");

/**
 * The files that were added, one row each, under the zone. A row that joins opens its place and
 * fades in, and what stands below is pushed; one that is removed fades and its place folds shut.
 * The rows that are there when the list first shows stand still.
 *
 * Keep it in the upload while there are no files: an empty list takes no room, the first file
 * opens it like any other, and a screen reader hears it join (a live region has to be there
 * before what it announces). Name it (`aria-label`: "Dateien") and give each `FileUploadItem` a
 * `key` that stays its own.
 */
export function FileUploadList({ className, children, ...props }: FileUploadListProps) {
  const { live: uploadLive } = useContext(FileUploadContext);
  const ownLive = useLive();
  const live = ownLive || uploadLive;
  const box = useRef<HTMLUListElement>(null);
  // One array for as long as the children are the same (`usePresence`).
  const files = useMemo(() => Children.toArray(children).filter(isValidElement), [children]);
  const { places, left } = usePresence(files, keyOf, box);
  const empty = places.every((place) => place.leaving);
  return (
    <ul
      ref={box}
      data-slot="file-upload-list"
      data-live={live ? "" : undefined}
      data-empty={empty ? "" : undefined}
      // A new file is said once, when it joins; its progress is not read out step by step.
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        "flex flex-col empty:hidden",
        // Without files it gives back the gap above it, easing as its last row folds and as
        // the first one opens, so the zone's foot never jumps.
        "transition-[margin-top] spring-settle data-empty:-mt-3 in-data-live:starting:-mt-3",
        className,
      )}
      {...props}
    >
      {places.map((place) => (
        <li
          key={place.key}
          data-slot="file-upload-place"
          {...placeProps(place, left)}
          className={placeOfFile}
        >
          {/* The hairline above a row folds with it. */}
          <div className="min-h-0 border-t border-hairline group-first/place:border-t-0">
            {place.item}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Where a file stands: not begun, on its way, arrived, or failed. */
export type FileUploadStatus = "waiting" | "uploading" | "done" | "error";

const statusWords: Record<FileUploadStatus, string> = {
  waiting: "Wartet",
  uploading: "Wird hochgeladen",
  done: "Hochgeladen",
  error: "Fehlgeschlagen",
};

export type FileUploadItemProps = Omit<ComponentProps<"div">, "children"> & {
  /** The file's name, with its ending. */
  name: string;
  /** Its size in bytes. */
  size: number;
  /** Where it stands. Arrived unless said otherwise. */
  status?: FileUploadStatus;
  /** How much has arrived, from 0 to 1, while it is `uploading`. Without it the bar runs through. */
  progress?: number;
  /** Why it failed, as a sentence: "Die Verbindung wurde unterbrochen." */
  error?: ReactNode;
  /** With it a failed file offers to try once more. */
  onRetry?: () => void;
  /** With it the row carries a key that takes the file out of the list (and stops its upload). */
  onRemove?: () => void;
  /** The words on the key that tries again. */
  retryLabel?: ReactNode;
  /** The verb of the key that removes the file. The file's name is said before it. */
  removeLabel?: string;
  /** What each state is called for assistive tech, where the mark alone would say it. */
  statusLabels?: Partial<Record<FileUploadStatus, string>>;
  /** The locale the sizes are written in. */
  locale?: string;
};

/** The key of the row beside this one, the next if there is one, that can take the focus. */
function keyBeside(key: HTMLElement) {
  const place = key.closest('[data-slot="file-upload-place"]');
  const find = (step: "nextElementSibling" | "previousElementSibling") => {
    for (let other = place?.[step]; other; other = other[step]) {
      const found = other.matches("[data-leaving]")
        ? null
        : other.querySelector<HTMLElement>('[data-slot="file-upload-remove"]');
      if (found) return found;
    }
    return null;
  };
  return find("nextElementSibling") ?? find("previousElementSibling");
}

/**
 * A line under a file's name (its bar, or why it failed) that opens and folds. Opening, its
 * place opens first and the line fades in behind; folding, the line fades out on `leave` first
 * and its place folds after, so it is never cut through while it can still be read.
 */
const lineOpen =
  "grid grid-rows-[1fr] [transition:grid-template-rows_var(--transition-duration-spring-settle)_var(--ease-spring-settle),opacity_var(--transition-duration-spring-settle)_var(--ease-spring-settle)_80ms]";
const lineShut =
  "grid grid-rows-[0fr] opacity-0 [transition:opacity_var(--transition-duration-spring-leave)_var(--ease-spring-leave),grid-template-rows_var(--transition-duration-spring-settle)_var(--ease-spring-settle)_100ms]";
/** The bar of a file that arrived: seen full for a moment (its fill glides there), then gone. */
const lineShutLater =
  "grid grid-rows-[0fr] opacity-0 [transition:opacity_var(--transition-duration-spring-leave)_var(--ease-spring-leave)_200ms,grid-template-rows_var(--transition-duration-spring-settle)_var(--ease-spring-settle)_300ms]";

/**
 * One file: the system's mark in front (the open ring waits, the arc works, the disc is done),
 * its name, its size in tabular digits, and under the name a thin bar while it is on its way.
 * The bar folds away once the file has arrived, and the mark closes where the arc was. A file
 * that failed says so in words, with the danger symbol and a key that tries again.
 */
export function FileUploadItem({
  name,
  size,
  status = "done",
  progress,
  error,
  onRetry,
  onRemove,
  retryLabel = "Noch einmal versuchen",
  removeLabel = "entfernen",
  statusLabels,
  locale = "de-DE",
  className,
  ...props
}: FileUploadItemProps) {
  const fraction = Math.min(1, Math.max(0, progress ?? 0));
  const failed = status === "error";
  // What a failure said, kept while its line folds away after the file is tried again.
  // Compared while rendering, as React asks for state that follows a prop.
  const [said, setSaid] = useState({ error, retry: onRetry !== undefined });
  if (failed && (said.error !== error || said.retry !== (onRetry !== undefined))) {
    setSaid({ error, retry: onRetry !== undefined });
  }
  return (
    <div
      data-slot="file-upload-item"
      data-status={status}
      className={cn(
        "group/file flex gap-2.5 py-2.5 text-control",
        // A row that joins later rises into place; under reduced motion it only fades.
        "transition-[opacity,translate] spring-settle in-data-live:starting:translate-y-(--motion-enter-offset) in-data-live:starting:opacity-0",
        "in-data-leaving:opacity-0 in-data-leaving:spring-leave",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="file-upload-mark"
        className="flex h-[1.3125rem] w-4 shrink-0 items-center justify-center"
      >
        {status === "uploading" ? (
          <Spinner size={14} className="text-fg" />
        ) : status === "error" ? (
          <Icon icon={Alert02Icon} size={14} className="text-danger" />
        ) : (
          // A file that has just arrived closes from the ring into the disc (marks.css).
          <span className={cn("mark", status === "done" && "mark-on in-data-live:mark-closes")} />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-3">
          <span data-slot="file-upload-name" className="min-w-0 truncate text-fg">
            <span className="sr-only">{statusLabels?.[status] ?? statusWords[status]}: </span>
            {name}
          </span>
          <span
            data-slot="file-upload-size"
            className="ml-auto shrink-0 text-sm whitespace-nowrap text-fg-muted tabular-nums"
          >
            {status === "uploading" && progress !== undefined
              ? formatFileProgress(fraction * size, size, locale)
              : formatFileSize(size, locale)}
          </span>
        </div>
        {/* The bar's row is open only while the file is on its way: it unfolds when the upload
            begins and folds shut once the file has arrived or failed, and the row with it. A
            row without a bar is as tall as an arrived one, whatever its state. */}
        <div
          data-slot="file-upload-progress"
          aria-hidden={status === "uploading" ? undefined : true}
          className={
            status === "uploading" ? lineOpen : status === "done" ? lineShutLater : lineShut
          }
        >
          <div className="min-h-0 overflow-hidden">
            <Progress
              aria-label={name}
              // Folded away, the bar rests: full once the file is there, so it fills as it
              // folds, and empty before it begins. Only an upload without a share runs through.
              value={
                status === "uploading"
                  ? progress === undefined
                    ? null
                    : fraction * 100
                  : status === "done"
                    ? 100
                    : fraction * 100
              }
              className="pt-1.5 pb-0.5"
            >
              <ProgressTrack className="h-1" />
            </Progress>
          </div>
        </div>
        {/* The reason folds like the bar: tried again, it closes while the bar opens, instead
            of leaving in one frame. It keeps its words until it has folded. The 4px inside
            and outside its box keep the retry key's focus ring whole. */}
        <div
          data-slot="file-upload-error-fold"
          aria-hidden={failed ? undefined : true}
          inert={!failed}
          className={cn("-my-1", failed ? lineOpen : lineShut)}
        >
          <div className="min-h-0 overflow-y-clip py-1">
            {(said.error !== undefined || said.retry) && (
              <div
                data-slot="file-upload-error"
                className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-danger"
              >
                {said.error !== undefined && <span>{said.error}</span>}
                {said.retry && (
                  <button
                    type="button"
                    data-slot="file-upload-retry"
                    onClick={onRetry}
                    className="touch-target relative rounded-xs font-medium text-fg underline decoration-1 underline-offset-[0.25em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {retryLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {onRemove && (
        <Button
          iconOnly
          size="sm"
          variant="quiet"
          aria-label={`${name} ${removeLabel}`}
          data-slot="file-upload-remove"
          onClick={(event) => {
            // The key is about to go: hand the focus to the row beside this one.
            if (event.currentTarget === document.activeElement) {
              keyBeside(event.currentTarget)?.focus();
            }
            onRemove();
          }}
          // Centred on the name's line: the 26px key reaches 2.5px over it at either side.
          className="-my-[2.5px] shrink-0 text-fg-muted hover:text-fg"
        >
          <CloseGlyph width={10} height={10} />
        </Button>
      )}
    </div>
  );
}
