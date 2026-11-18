"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import { type ComponentProps, type ReactNode, useRef, useState } from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { CloseGlyph } from "@/internal/glyphs";
import { RollingNumber } from "@/internal/rolling-number";
import { cn } from "@/lib/cn";

export type ActionBarProps = Omit<ComponentProps<"div">, "children"> & {
  /** There is a selection: the bar shows. */
  open: boolean;
  /** How many are selected. */
  count: number;
  /** The word after the count: "ausgewählt". */
  countLabel?: (count: number) => ReactNode;
  /** Called by the cross and by Escape. Take the selection back here. */
  onClear: () => void;
  /** The name of the cross. */
  clearLabel?: string;
  /** The name of the bar for assistive tech. */
  "aria-label"?: string;
  /**
   * Where it stands. `fixed` (the default): at the foot of the window, in its middle.
   * `sticky`: at the foot of the box it is the last child of, and of the window while that box
   * is taller. For the page beside a sidebar, where the middle of the window is not the middle
   * of the list; give that box `flex flex-col`, so the bar stands at its foot when the list is
   * short. It keeps a place of its own at the end of that box: scrolled to the end, it stands
   * under the list and not on its last row. `absolute`: at the foot of its nearest positioned
   * box.
   */
  position?: "fixed" | "sticky" | "absolute";
  /** The actions: `ActionBarButton`s. */
  children: ReactNode;
};

const places = {
  fixed: "fixed inset-x-0 bottom-0",
  absolute: "absolute inset-x-0 bottom-0",
  // In the flow, as the last thing in its box: the end of the page is where it comes to rest.
  sticky: "sticky bottom-0 mt-auto",
} as const;

/**
 * What can be done with the rows that are selected in a list: it rises at the foot of the
 * window with the first row that is ticked, counts them, and leaves with the last. It is the
 * system speaking about the selection, so it speaks on Ink, as a toast does.
 *
 * Put the actions inside as `ActionBarButton`s, worded like buttons ("Als PDF herunterladen").
 * Two or three; what is rare belongs in a `Menu` behind the last one. The bar is one stop for
 * the Tab key, and the arrow keys move between its actions. Escape, pressed inside it, takes
 * the selection back, and so does the cross.
 *
 * It does not take the focus when it appears: whoever is ticking rows keeps doing that.
 */
export function ActionBar({
  open,
  count,
  countLabel = () => "ausgewählt",
  onClear,
  clearLabel = "Auswahl aufheben",
  "aria-label": label = "Auswahl",
  position = "fixed",
  className,
  children,
  ...props
}: ActionBarProps) {
  // While it leaves it still says how many there were, not "0". And each time it arrives it
  // brings a count of its own (`key`): a number that is not seen yet has nothing to roll from.
  const [last, setLast] = useState(count);
  const [was, setWas] = useState(open);
  const [arrivals, setArrivals] = useState(0);
  if (open && count !== last) setLast(count);
  if (open !== was) {
    setWas(open);
    if (open) setArrivals(arrivals + 1);
  }

  // Where the keyboard was before it came into the bar: it goes back there when the selection
  // is taken back from inside the bar, which would otherwise leave the focus on nothing.
  const cameFrom = useRef<HTMLElement | null>(null);
  const clear = (bar: HTMLElement | null) => {
    if (bar?.contains(document.activeElement) && cameFrom.current?.isConnected) {
      cameFrom.current.focus();
    }
    onClear();
  };
  return (
    <div
      data-slot="action-bar-place"
      // Across the foot, but only the bar itself takes the pointer: the page beside it stays
      // in reach. Above the home indicator on a phone, and 8px off the edges like the site bar.
      className={cn(
        "pointer-events-none z-40 flex justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom))]",
        places[position],
      )}
    >
      <ToolbarPrimitive.Root
        data-slot="action-bar"
        data-theme="ink"
        data-open={open ? "" : undefined}
        aria-label={label}
        // Unseen, it is out of reach of the keyboard and of assistive tech as well.
        inert={!open}
        onFocus={(event) => {
          const from = event.relatedTarget;
          if (from instanceof HTMLElement && !event.currentTarget.contains(from)) {
            cameFrom.current = from;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") clear(event.currentTarget);
        }}
        className={cn(
          "pointer-events-auto action-bar-motion flex max-w-full items-center gap-1 rounded-xl bg-sheet py-1.5 pr-1.5 pl-3.5 text-control text-fg depth-floating",
          className,
        )}
        {...props}
      >
        <p
          data-slot="action-bar-count"
          // Said when it changes, politely: the count is the news here.
          aria-live="polite"
          aria-atomic="true"
          className="flex shrink-0 items-center gap-1.5 pr-2 font-medium whitespace-nowrap"
        >
          <RollingNumber key={arrivals} value={open ? count : last} />
          <span className="text-fg-body">{countLabel(open ? count : last)}</span>
        </p>
        <ToolbarPrimitive.Separator
          data-slot="action-bar-separator"
          className="mx-1 h-5 w-px shrink-0 bg-hairline"
        />
        <div
          data-slot="action-bar-actions"
          className="flex min-w-0 [scrollbar-width:none] items-center gap-0.5 overflow-x-auto"
        >
          {children}
        </div>
        <ToolbarPrimitive.Button
          data-slot="action-bar-clear"
          render={
            <Button
              iconOnly
              size="sm"
              variant="quiet"
              aria-label={clearLabel}
              className="ml-1 shrink-0 text-fg-muted"
            />
          }
          onClick={(event) => clear(event.currentTarget.closest('[data-slot="action-bar"]'))}
        >
          <CloseGlyph />
        </ToolbarPrimitive.Button>
      </ToolbarPrimitive.Root>
    </div>
  );
}

/** `Omit` that keeps a union a union: a button is named either by its words or by `aria-label`. */
type Without<Props, Key extends PropertyKey> = Props extends unknown ? Omit<Props, Key> : never;

export type ActionBarButtonProps = Without<ButtonProps, "variant" | "size">;

/**
 * One action on the selection: a quiet button on the bar, with a 14px symbol before its words
 * if it helps. Where the bar is narrow (a phone), `iconOnly` leaves the symbol alone and
 * `aria-label` names it. The one that cannot be undone goes last, and is confirmed in an
 * `AlertDialog`.
 */
export function ActionBarButton({ className, disabled, ...props }: ActionBarButtonProps) {
  return (
    <ToolbarPrimitive.Button
      data-slot="action-bar-button"
      // The toolbar keeps a disabled action in reach of the arrow keys and says that it is one.
      disabled={disabled}
      render={<Button size="sm" variant="quiet" {...props} className={cn("shrink-0", className)} />}
    />
  );
}
