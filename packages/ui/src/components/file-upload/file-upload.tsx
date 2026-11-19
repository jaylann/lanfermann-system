"use client";

import { Alert02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import {
  Children,
  type ComponentProps,
  createContext,
  type DragEvent,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { Grow } from "@/components/grow/grow";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Progress, ProgressTrack } from "@/components/progress/progress";
import { Spinner } from "@/components/spinner/spinner";
import { CloseGlyph } from "@/internal/glyphs";
import { placeInList, placeProps, useLive, usePresence } from "@/internal/presence";
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
};

const FileUploadContext = createContext<FileUploadContextValue>({
  open: () => {},
  add: () => {},
  disabled: false,
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
  const context = useMemo<FileUploadContextValue>(
    () => ({
      disabled,
      open: () => input.current?.click(),
      add: (files) => {
        if (disabled || files.length === 0) return;
        const { accepted, rejected } = sortFiles(files, { accept, maxSize, multiple });
        if (accepted.length > 0) onFilesAdded(accepted);
        if (rejected.length > 0) onReject?.(rejected);
      },
    }),
    [accept, maxSize, multiple, disabled, onFilesAdded, onReject],
  );
  return (
    <FileUploadContext value={context}>
      <div data-slot="file-upload" className={cn("flex flex-col gap-3", className)} {...props}>
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
   * button alone.
   */
  variant?: "tile" | "plain";
  /** The symbol in the tile. */
  icon?: IconSvgElement;
};

/** Whether what is being dragged is files, and not a piece of text or a link. */
const carriesFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

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
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const rest = () => {
    depth.current = 0;
    setOver(false);
  };
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
      onDragEnter={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => {
        // Without this the browser does not let the file be dropped here.
        if (!disabled && carriesFiles(event)) event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (disabled || !carriesFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        rest();
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
          className="mb-2 flex size-10 items-center justify-center rounded-lg bg-surface-quiet text-fg-muted inset-ring inset-ring-hairline group-data-disabled/zone:text-on-disabled forced-colors:inset-ring-[CanvasText]"
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
 * The files that were added, one row each, under the zone. A row that joins fades in while the
 * list grows and pushes what stands below; one that is removed fades and its place folds shut.
 * The rows that are there when the list first shows stand still. Name it (`aria-label`:
 * "Dateien") and give each `FileUploadItem` a `key` that stays its own.
 */
export function FileUploadList({ className, children, ...props }: FileUploadListProps) {
  const live = useLive();
  const box = useRef<HTMLUListElement>(null);
  const { places, left } = usePresence(
    Children.toArray(children).filter(isValidElement),
    keyOf,
    box,
  );
  return (
    <Grow data-slot="file-upload-grow">
      <ul
        ref={box}
        data-slot="file-upload-list"
        data-live={live ? "" : undefined}
        // A new file is said once, when it joins; its progress is not read out step by step.
        aria-live="polite"
        aria-relevant="additions"
        className={cn("flex flex-col", className)}
        {...props}
      >
        {places.map((place) => (
          <li
            key={place.key}
            data-slot="file-upload-place"
            {...placeProps(place, left)}
            className={cn(placeInList, "border-b border-hairline last:border-b-0")}
          >
            <div className="min-h-0">{place.item}</div>
          </li>
        ))}
      </ul>
    </Grow>
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
  const running = status === "uploading" || status === "waiting";
  const fraction = Math.min(1, Math.max(0, progress ?? 0));
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
        {/* The bar's row folds shut once the file has arrived or failed, and the row with it. */}
        <div
          data-slot="file-upload-progress"
          className={cn(
            "grid transition-[grid-template-rows,opacity] spring-settle",
            running ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <Progress
              aria-label={name}
              value={status === "uploading" && progress !== undefined ? fraction * 100 : null}
              // Waiting, the bar stands empty; it only runs once the upload has begun.
              className={cn("pt-1.5 pb-0.5", status === "waiting" && "invisible")}
            >
              <ProgressTrack className="h-1" />
            </Progress>
          </div>
        </div>
        {status === "error" && (
          <div
            data-slot="file-upload-error"
            className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-danger"
          >
            {error !== undefined && <span>{error}</span>}
            {onRetry && (
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
          className="-my-0.5 shrink-0 text-fg-muted hover:text-fg"
        >
          <CloseGlyph width={10} height={10} />
        </Button>
      )}
    </div>
  );
}
