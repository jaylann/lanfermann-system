"use client";

import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Glide,
  GlideFrame,
  glidePlace,
  onFaded,
  placesChange,
  useLeaveWhenFaded,
} from "@/internal/glide";
import { placeProps, useLive, usePresence } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";

import { FileGridContext } from "./file-grid-context";
import { FileGridSkeleton } from "./file-grid-skeleton";
import { fileGrid } from "./file-grid-variants";

/** A grid scrolls nowhere, but it is a region of its own and needs a name. */
type Named =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-label"?: undefined; "aria-labelledby": string };

/**
 * How many columns a grid's tracks are, from its computed `grid-template-columns` (one length
 * per track, `176px 176px 176px`). Never less than one.
 */
export function columnsOf(template: string): number {
  const tracks = template
    .trim()
    .split(/\s+/)
    .filter((track) => track && track !== "none");
  return Math.max(1, tracks.length);
}

export type FileGridProps = Omit<ComponentProps<"div">, "aria-label" | "aria-labelledby"> &
  Named & {
    /** How wide a tile is at least. The grid fits as many columns as there is room for. */
    size?: "sm" | "md";
    /**
     * Called with the number of columns whenever it changes: on load, and when the grid is
     * resized. For a page that lays out something to match (placeholders while it loads).
     */
    onColumnsChange?: (columns: number) => void;
    /** `FileGridSection`s, each holding its `FileTile`s. */
    children?: ReactNode;
    /**
     * The folder is still loading: the grid shows the shapes of its tiles instead, in the same
     * columns (`FileGridSkeleton`). `true` says „Die Dateien werden geladen.“ to assistive tech;
     * a string says something more exact („Die Dateien in badges werden geladen.“).
     */
    loading?: boolean | string;
    /** How many rows of shapes a loading grid shows. */
    loadingRows?: number;
  };

/**
 * Files and folders as tiles in a grid, as many columns as fit: the view of a folder in a file
 * browser. Put its tiles in `FileGridSection`s (folders first, „Ordner“, then „Dateien“); every
 * section starts on a row of its own and shares the grid's columns. The grid measures how many
 * columns it has (`onColumnsChange`, and `data-columns`).
 *
 * What is there when the grid first shows stands still. A tile that joins later (a file that is
 * being uploaded) fades in at its place, and the tiles after it glide aside to make room; one
 * that is taken away fades, and the rest close up by gliding into its place. They move by a
 * transform on `glide`, without bounce or scale; under reduced motion they stand in their new
 * places at once and only the fades remain. The grid's own height changes at once: put it in a
 * `Grow` where what stands below should be pushed.
 *
 * For assistive tech it is a grid whose rows are the tiles. Choosing and moving through it with
 * the keyboard come from `useSelection`: spread its container props on the grid. Name it with
 * `aria-label` („Dateien in blogs/building-gbar“).
 */
export function FileGrid({ loading = false, loadingRows, ...props }: FileGridProps) {
  const { messages } = useLocale();
  if (loading !== false) {
    return (
      <FileGridSkeleton
        size={props.size}
        rows={loadingRows}
        label={typeof loading === "string" ? loading : messages.fileGrid.loading}
        className={props.className}
      />
    );
  }
  return <LoadedFileGrid {...props} />;
}

function LoadedFileGrid({
  size = "md",
  onColumnsChange,
  className,
  children,
  ref,
  ...props
}: Omit<FileGridProps, "loading" | "loadingRows">) {
  const box = useRef<HTMLDivElement>(null);
  // The caller's ref is filled beside the grid's own, which stays one object on the element. A
  // merged callback would be a new one on every render: React empties and fills such a ref
  // around each update, and the glide, which the parts inside start in between, would find no
  // grid.
  useImperativeHandle(ref, () => box.current!, []);
  const live = useLive();
  const [glide] = useState(() => new Glide(box));
  const [columns, setColumns] = useState<number>();
  const report = useRef(onColumnsChange);
  useEffect(() => {
    report.current = onColumnsChange;
  });

  useLayoutEffect(() => {
    const grid = box.current;
    if (!grid) return;
    let frame = 0;
    const measure = () => setColumns(columnsOf(getComputedStyle(grid).gridTemplateColumns));
    measure();
    // Measured in the next frame, not while the observer reports: the new count renders.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(grid);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (columns !== undefined) report.current?.(columns);
  }, [columns]);

  // A section that comes or goes moves the sections after it: they glide too.
  const sections = Children.toArray(children)
    .map((child) => (isValidElement(child) ? String(child.key) : ""))
    .join("\n");
  const context = useMemo(() => ({ glide, inGrid: true }), [glide]);
  return (
    <FileGridContext value={context}>
      <div
        ref={box}
        role="grid"
        data-slot="file-grid"
        data-live={live ? "" : undefined}
        data-columns={columns}
        className={cn(fileGrid({ size }), className)}
        {...props}
      >
        {children}
        <GlideFrame glide={glide} change={sections} />
      </div>
    </FileGridContext>
  );
}

const keyOf = (element: ReactElement) => String(element.key ?? "");

export type FileGridSectionProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the section holds, in a word: „Ordner“, „Dateien“. It names the section. */
  label?: ReactNode;
  /** `FileTile`s, each with a `key` that stays its own (its path). */
  children?: ReactNode;
};

/**
 * One group of tiles in a `FileGrid`, under its label: the folders („Ordner“), then the files
 * („Dateien“). It starts on a row of its own and lays its tiles into the grid's columns. Give
 * every tile a `key` that stays its own, so a tile that joins or leaves is told apart from one
 * that stays.
 */
export function FileGridSection({
  label,
  className,
  children,
  ref,
  ...props
}: FileGridSectionProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const box = useRef<HTMLDivElement>(null);
  // One array for as long as the children are the same (`usePresence`).
  const tiles = useMemo(() => Children.toArray(children).filter(isValidElement), [children]);
  const { places, left } = usePresence(tiles, keyOf, box);
  useLeaveWhenFaded(places, left);
  const { glide } = useContext(FileGridContext);
  return (
    <div
      ref={mergeRefs(box, ref)}
      role="rowgroup"
      aria-labelledby={label === undefined ? undefined : labelId}
      data-slot="file-grid-section"
      className={cn("col-span-full grid grid-cols-subgrid gap-y-3", className)}
      {...props}
    >
      {label !== undefined && (
        <div
          id={labelId}
          data-slot="file-grid-label"
          data-glide={`${id}:label`}
          // A section that joins later fades its label in with its first tiles.
          data-joining=""
          className={cn("col-span-full text-sm font-medium text-fg-muted", glidePlace)}
        >
          {label}
        </div>
      )}
      {places.map((place) => {
        const own = placeProps(place, left);
        return (
          <div
            key={place.key}
            data-slot="file-grid-place"
            data-glide={`${id}:${place.key}`}
            data-joining={place.joining ? "" : undefined}
            {...own}
            onTransitionEnd={onFaded(own.onTransitionEnd)}
            onTransitionCancel={onFaded(own.onTransitionCancel)}
            className={cn("grid min-w-0", glidePlace)}
          >
            {place.item}
          </div>
        );
      })}
      {glide && <GlideFrame glide={glide} change={placesChange(places)} />}
    </div>
  );
}
