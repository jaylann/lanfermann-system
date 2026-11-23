"use client";

import { Upload04Icon } from "@hugeicons/core-free-icons";
import { cva } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type DragEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icon } from "@/components/icon/icon";
import { carriesFiles, useDragDepth } from "@/internal/drag-depth";
import { cn } from "@/lib/cn";

import { DropPlaceContext } from "./drop-look";

/** The type under which items dragged inside an area carry their ids: a JSON list of strings. */
export const ITEMS_TYPE = "application/x-lanfermann-items";

const carriesItems = (event: DragEvent) => event.dataTransfer.types.includes(ITEMS_TYPE);

/** The ids a drop of items carried, or none where what was dropped is not a list of strings. */
export function readItems(data: string): string[] {
  if (!data) return [];
  try {
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
  } catch {
    return [];
  }
}

/** What the picture under the pointer says for this many items: „1 Datei“, „3 Dateien“. */
export const itemsWord = (count: number): string => (count === 1 ? "1 Datei" : `${count} Dateien`);

type Target = { id: string; label: ReactNode; moveLabel?: ReactNode };

type DropContextValue = {
  /** The target under the pointer, if any. */
  target: string | null;
  /** The ids being dragged, where the drag began inside the area. */
  dragged: readonly string[] | null;
  /** Counts the drags that ended, so a target forgets its own count of enters and leaves. */
  ended: number;
  disabled: boolean;
  enter: (target: Target) => void;
  leave: (id: string) => void;
  /** Where a drag of items begins: what it carries, and the picture under the pointer. */
  start: (event: DragEvent, ids: readonly string[], word: string) => void;
  end: () => void;
};

const DropContext = createContext<DropContextValue | null>(null);

const fileDropArea = [
  "relative rounded-xl",
  // Files over the area itself: the field's halo, on `snap`, laid over whatever it holds.
  "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:opacity-0 after:shadow-field-focus",
  "after:transition-opacity after:spring-snap data-dragging:after:opacity-100",
].join(" ");

/** The plate that says where a drop goes. It fades in on `settle` and leaves on `leave`. */
const plate = cva(
  [
    "pointer-events-none absolute z-20 flex opacity-0",
    "transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-settle",
  ],
  {
    variants: {
      /** In the middle of the area, or as a bar along its foot. */
      place: {
        centre: "inset-0 items-center justify-center p-4",
        bar: "inset-x-3 bottom-3 *:w-full *:justify-center",
      },
    },
  },
);

export type FileDropAreaProps = Omit<ComponentProps<"div">, "onDrop"> & {
  /**
   * Called with the files that were dropped or pasted, and the target they were dropped on: the
   * id of a `useDropTarget` (a folder), or `null` for the area itself.
   */
  onFiles: (files: File[], target: string | null) => void;
  /** Called with the ids of items dragged inside the area and dropped on a target. */
  onItems?: (ids: string[], target: string) => void;
  /** What the plate says while files hang over the area itself: „In building-gbar ablegen“. */
  label: ReactNode;
  /** Nothing can be dropped right now. */
  disabled?: boolean;
};

/**
 * A region that takes files: dropped from the system, pasted while the focus is inside it, or
 * items dragged inside it onto a folder. While files hang over it, it takes the field's halo on
 * `snap` and a plate fades in that says where they will go („In building-gbar ablegen“). There
 * is no dashed border and nothing shakes. It uploads nothing: it reports the files
 * (`onFiles(files, target)`) and the moved items (`onItems(ids, target)`).
 *
 * Targets inside it (a folder's tile, a link of the trail) take `useDropTarget`: over one, it
 * wins over the area, wears the halo itself, and the plate says its own label. Items take
 * `useItemDrag`, which carries the chosen ids and shows „3 Dateien“ under the pointer. A target
 * does not take a drag of itself, and the area itself takes no items: they would stay where
 * they are.
 *
 * Dragging has no keyboard path: offer the same through keys on the page (an upload button, a
 * „Verschieben nach…“ entry in an item's menu). Word the label as where the files go: „In
 * building-gbar ablegen“, a target's as „In badges ablegen“ and „Nach badges verschieben“.
 */
export function FileDropArea({
  onFiles,
  onItems,
  label,
  disabled = false,
  className,
  children,
  ...props
}: FileDropAreaProps) {
  const place = useContext(DropPlaceContext);
  const [target, setTarget] = useState<Target | null>(null);
  const targetNow = useRef<Target | null>(null);
  const [dragged, setDragged] = useState<readonly string[] | null>(null);
  const [kind, setKind] = useState<"files" | "items" | null>(null);
  const [ended, setEnded] = useState(0);
  const ghost = useRef<HTMLDivElement>(null);
  const { over, reset, handlers } = useDragDepth(
    (event) => carriesFiles(event) || carriesItems(event),
    disabled,
  );

  const pointAt = (next: Target | null) => {
    targetNow.current = next;
    setTarget(next);
  };
  const finish = () => {
    reset();
    pointAt(null);
    setKind(null);
    setDragged(null);
    setEnded((count) => count + 1);
  };
  // The drag left the area without a drop: whatever it pointed at is forgotten too. State that
  // follows the count of enters and leaves, compared while rendering.
  const [wasOver, setWasOver] = useState(over);
  if (wasOver !== over) {
    setWasOver(over);
    if (!over) {
      setTarget(null);
      setKind(null);
      setEnded((count) => count + 1);
    }
  }
  useEffect(() => {
    if (!over) targetNow.current = null;
  }, [over]);

  const context: DropContextValue = {
    target: target?.id ?? null,
    dragged,
    ended,
    disabled,
    enter: (next) => pointAt(next),
    leave: (id) => {
      if (targetNow.current?.id === id) pointAt(null);
    },
    start: (event, ids, word) => {
      event.dataTransfer.setData(ITEMS_TYPE, JSON.stringify(ids));
      event.dataTransfer.effectAllowed = "move";
      const picture = ghost.current;
      if (picture) {
        picture.textContent = word;
        event.dataTransfer.setDragImage(picture, 12, 12);
      }
      setDragged(ids);
    },
    end: finish,
  };

  const files = kind === "files";
  const plateText =
    over && files
      ? (target?.label ?? label)
      : over && kind === "items" && target
        ? (target.moveLabel ?? target.label)
        : null;
  // What the plate said last, kept while it fades.
  const [said, setSaid] = useState<ReactNode>(null);
  if (plateText !== null && plateText !== said) setSaid(plateText);

  return (
    <DropContext value={context}>
      <div
        data-slot="file-drop-area"
        data-dragging={over && files && target === null ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn(fileDropArea, className)}
        {...props}
        onDragEnter={(event) => {
          handlers.onDragEnter(event);
          if (disabled || kind !== null) return;
          if (carriesFiles(event)) setKind("files");
          else if (carriesItems(event)) setKind("items");
        }}
        onDragOver={(event) => {
          // Items let go over the area itself would go where they already are: not taken.
          if (carriesItems(event) && !targetNow.current) {
            event.dataTransfer.dropEffect = "none";
            return;
          }
          handlers.onDragOver(event);
        }}
        onDragLeave={handlers.onDragLeave}
        onDrop={(event) => {
          if (disabled) return;
          const where = targetNow.current?.id ?? null;
          if (carriesFiles(event)) {
            event.preventDefault();
            onFiles([...event.dataTransfer.files], where);
          } else if (carriesItems(event)) {
            event.preventDefault();
            const ids = readItems(event.dataTransfer.getData(ITEMS_TYPE));
            if (where !== null && ids.length > 0 && !ids.includes(where)) onItems?.(ids, where);
          }
          finish();
        }}
        onPaste={(event) => {
          if (disabled) return;
          // What is pasted into a field (a name being changed) is the field's.
          if (event.target instanceof Element && event.target.closest("input, textarea")) return;
          const pasted = [...event.clipboardData.files];
          if (pasted.length === 0) return;
          event.preventDefault();
          onFiles(pasted, null);
        }}
      >
        {children}
        <div
          aria-hidden
          data-slot="file-drop-area-plate"
          data-shown={plateText !== null ? "" : undefined}
          className={plate({ place })}
        >
          <span className="flex items-center gap-2 rounded-xl bg-raised px-4 py-2.5 text-control font-medium text-fg depth-floating">
            <Icon icon={Upload04Icon} size={16} className="text-fg-muted" />
            {said}
          </span>
        </div>
        {/* Said once where a drag points; a drag is never read out step by step. */}
        <span className="sr-only" aria-live="polite">
          {plateText}
        </span>
        {/* The picture under the pointer while items are dragged, drawn out of sight. */}
        <div
          ref={ghost}
          aria-hidden
          data-slot="file-drop-area-ghost"
          className="pointer-events-none fixed top-0 -left-[200vw] rounded-md bg-raised depth-plug px-2.5 py-1 text-control font-medium whitespace-nowrap text-fg"
        />
      </div>
    </DropContext>
  );
}

export type UseDropTargetOptions = {
  /** The target's id, as `onFiles` and `onItems` report it: a folder's path. */
  id: string;
  /** What the plate says while files hang over it: „In badges ablegen“. */
  label: ReactNode;
  /** What it says while items hang over it, if different: „Nach badges verschieben“. */
  moveLabel?: ReactNode;
  /** It takes nothing right now. */
  disabled?: boolean;
};

/** What a drop target spreads on its element: a `FileTile`, a `BreadcrumbLink`. */
export type DropTargetProps = {
  "data-drop-target": string;
  /** Set while a drag hangs over it: a `FileTile` wears the halo, a link of the trail the tint. */
  "data-drop-over": "" | undefined;
  onDragEnter: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
};

/**
 * A place inside a `FileDropArea` that takes files and items itself: a folder's tile, a link of
 * the trail. While a drag hangs over it, it wins over the area: `over` is true, its element
 * carries `data-drop-over` (a `FileTile` wears the halo by it), and the area's plate says this
 * target's label. It does not take a drag of itself (a folder dragged onto its own tile). The
 * drop is reported by the area, with this target's id. Outside an area it does nothing.
 */
export function useDropTarget({ id, label, moveLabel, disabled = false }: UseDropTargetOptions) {
  const area = useContext(DropContext);
  const depth = useRef(0);
  // A drag that ended (dropped, or gone from the area) fires no leave here.
  const ended = area?.ended ?? 0;
  useEffect(() => {
    depth.current = 0;
  }, [ended]);
  const refuses = !area || disabled || area.disabled || (area.dragged?.includes(id) ?? false);
  const accepts = (event: DragEvent) => !refuses && (carriesFiles(event) || carriesItems(event));
  const over = area?.target === id;
  const dropProps: DropTargetProps = {
    "data-drop-target": id,
    "data-drop-over": over ? "" : undefined,
    onDragEnter: (event) => {
      if (!accepts(event)) return;
      event.preventDefault();
      depth.current += 1;
      area?.enter({ id, label, moveLabel });
    },
    onDragOver: (event) => {
      if (accepts(event)) event.preventDefault();
    },
    onDragLeave: (event) => {
      if (!accepts(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) area?.leave(id);
    },
  };
  return { over, dropProps };
}

export type UseItemDragOptions = {
  /** The ids a drag that begins on this item carries: all chosen ones if it is chosen. */
  itemsFor: (id: string) => readonly string[];
  /** What the picture under the pointer says for that many: „3 Dateien“. */
  label?: (count: number) => string;
};

/** What a draggable item spreads on its element. */
export type ItemDragProps = {
  draggable: true;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
};

/**
 * Items that can be dragged inside a `FileDropArea` onto a target: a file's tile or row. A drag
 * carries the ids `itemsFor` gives (all chosen ones, when the item is chosen) and shows how
 * many under the pointer („3 Dateien“). Spread `itemProps(id)` on each item; it needs the area
 * around it.
 */
export function useItemDrag({ itemsFor, label = itemsWord }: UseItemDragOptions) {
  const area = useContext(DropContext);
  const itemProps = (id: string): ItemDragProps => ({
    draggable: true,
    onDragStart: (event) => {
      const ids = itemsFor(id);
      area?.start(event, ids, label(ids.length));
    },
    onDragEnd: () => area?.end(),
  });
  return { itemProps };
}
