"use client";

import {
  Component,
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Grow } from "@/components/grow/grow";
import { Glide, type Positions } from "@/internal/glide";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { springs } from "@/motion/springs";

/**
 * Tells the grid's `Glide` about every render of the grid: where the tiles are drawn before
 * React writes the change into the page, and that they may glide after it. A class, because only
 * a class can look at the page before an update. `seen` is what the grid holds: a new value is
 * what makes React update this, and with it read the page.
 */
class ReflowFrame extends Component<{ glide: Glide; seen: ReactNode }> {
  override getSnapshotBeforeUpdate(): Positions | null {
    return this.props.glide.read();
  }

  override componentDidUpdate(_props: unknown, _state: unknown, before: Positions | null): void {
    if (before) this.props.glide.play(before);
  }

  override render(): null {
    return null;
  }
}

export type ReflowGridProps = ComponentProps<"div">;

/**
 * A grid of tiles that reflows without a jump, for tiles a person adds and takes away: pinned
 * figures on a dashboard, the cards of a board. When a tile joins or leaves, the tiles that
 * change place glide from where they stood, and the grid's height eases to its new one, so the
 * page below follows instead of leaping. A render in the middle of a move carries on from where
 * everything is drawn at that moment, and a change of width (a sidebar, the window) simply
 * reflows. Under reduced motion everything takes its place at once.
 *
 * One column, two from `sm`, three from `lg`; `className` changes the columns and the gap. Every
 * child that should glide is a `ReflowTile`; anything else (a hint while the grid is empty)
 * stands still. Keep the grid in the page while it is empty, so the first tile still comes in.
 */
export function ReflowGrid({ className, children, ref, ...props }: ReflowGridProps) {
  const box = useRef<HTMLDivElement>(null);
  // The box is kept when React takes a ref away: a merged ref is a new function on every
  // render, so React empties it before it fills the new one, and the frame inside plays its
  // glide in between (a child's update comes before its parent's ref).
  const keep = useCallback((node: HTMLDivElement | null) => {
    if (node) box.current = node;
  }, []);
  const live = useLive();
  const [glide] = useState(() => new Glide(box));
  return (
    <Grow
      ref={mergeRefs(keep, ref)}
      data-slot="reflow-grid"
      data-live={live ? "" : undefined}
      // The room a tile's shadow takes below the last row and above the first: inside the box
      // that clips while the height moves, and taken back outside, so no shadow is cut for the
      // length of a move.
      className="-my-6"
      contentClassName={cn("grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {children}
      <ReflowFrame glide={glide} seen={children} />
    </Grow>
  );
}

/** When a fade on `leave` looks finished: its curve settles for about as long again, unseen. */
const FADED_MS = springs.leave.visualDuration * 1000;
/** Past the entrance's run on `settle`: from then on the tile is no longer new. */
const JOINED_MS = 600;

const tile = [
  "flex min-w-0 flex-col",
  // Opacity first: while a tile is put back to where it stood, only it keeps its transition.
  // `translate` is the glide to a new place; the entrance and the exit use `scale` and
  // `transform`, so neither is in the other's way.
  "[transition:opacity_var(--transition-duration-spring-settle)_var(--ease-spring-settle),translate_var(--transition-duration-spring-settle)_var(--ease-spring-settle),scale_var(--transition-duration-spring-settle)_var(--ease-spring-settle),transform_var(--transition-duration-spring-settle)_var(--ease-spring-settle)]",
  // A tile that joins rises into its place and fades in: only once the grid has stood for a
  // frame (what is there on load stands still), and only while it is new (a tile React merely
  // moves is put into the page again and would otherwise come in a second time).
  "in-data-live:data-joining:starting:[transform:translateY(calc(var(--motion-enter-offset)*3))] in-data-live:data-joining:starting:scale-(--motion-enter-scale) in-data-live:data-joining:starting:opacity-0",
  // It waits a moment for its room: a tile that opens a new row would otherwise show before the
  // grid has grown there, cut off at the grid's foot. Its glide (the second entry) does not wait.
  "data-joining:[transition-delay:90ms,0s,90ms,90ms]",
  // One that leaves sinks a little and fades, faster than it came.
  "data-leaving:pointer-events-none data-leaving:[transform:translateY(var(--motion-enter-offset))] data-leaving:scale-(--motion-enter-scale) data-leaving:opacity-0",
  "data-leaving:[transition:opacity_var(--transition-duration-spring-leave)_var(--ease-spring-leave),translate_var(--transition-duration-spring-settle)_var(--ease-spring-settle),scale_var(--transition-duration-spring-leave)_var(--ease-spring-leave),transform_var(--transition-duration-spring-leave)_var(--ease-spring-leave)]",
].join(" ");

export type ReflowTileProps = ComponentProps<"div"> & {
  /** What the tile is among the grid's tiles: its place is followed by this name. */
  id: string;
  /**
   * On its way out. Set it the moment the tile is taken away and keep the tile in the grid: it
   * sinks and fades at once and takes no pointer or focus, while the others still stand where
   * they were. Take it out of the grid on `onLeft`; the others then glide into its place.
   */
  leaving?: boolean;
  /** The tile has faded: the moment to stop rendering it. Called once per leaving. */
  onLeft?: () => void;
};

/**
 * One tile of a `ReflowGrid`. A tile that joins after the page has shown rises into place and
 * fades in; with `leaving` it sinks and fades, and `onLeft` says when it is gone. What it holds
 * fills its height, so the tiles of a row end on one line.
 */
export function ReflowTile({
  id,
  leaving = false,
  onLeft,
  className,
  onTransitionEnd,
  ...props
}: ReflowTileProps) {
  const [joining, setJoining] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setJoining(false), JOINED_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const left = useRef(onLeft);
  useEffect(() => {
    left.current = onLeft;
  });
  /** Whether this leaving has been said: the fade's end and the timer both come. */
  const said = useRef(false);
  const say = useCallback(() => {
    if (said.current) return;
    said.current = true;
    left.current?.();
  }, []);
  useEffect(() => {
    if (!leaving) {
      said.current = false;
      return;
    }
    // The fade's own end may not come (a hidden tab, a tile that never showed): the timer does.
    const timer = window.setTimeout(say, FADED_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, say]);

  return (
    <div
      data-slot="reflow-tile"
      data-glide={id}
      data-joining={joining ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      inert={leaving}
      className={cn(tile, className)}
      onTransitionEnd={(event) => {
        onTransitionEnd?.(event);
        // Only the tile's own fade says it has left, not a transition of what it holds.
        if (leaving && event.target === event.currentTarget && event.propertyName === "opacity") {
          say();
        }
      }}
      {...props}
    />
  );
}
