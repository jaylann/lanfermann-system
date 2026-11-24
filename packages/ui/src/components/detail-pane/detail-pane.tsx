"use client";

import { type ComponentProps, createContext, type ReactNode, use, useState } from "react";

import { cn } from "@/lib/cn";

/** Whether the pane is open, and whether its column has come to rest. */
const PaneContext = createContext<{ open: boolean; resting: boolean }>({
  open: false,
  resting: true,
});

export type DetailPaneLayoutProps = ComponentProps<"div"> & {
  /** Something is chosen: the pane opens beside the content. */
  open: boolean;
};

/**
 * Content with a pane beside it that opens when something in it is chosen: the details of a
 * file, a row, a record. Closed, the content has the whole width; opening, the pane's column
 * widens on `settle` and pushes the content narrower while the pane slides in with its opening
 * edge and fades in; closing, it narrows on `leave` while the pane fades. Nothing is ever
 * covered. Under reduced motion the column changes at once and only the fade remains.
 *
 * Put the content first and a `DetailPane` second. The pane is 20rem wide with a 1.5rem gutter
 * in front; `--detail-pane-width` and `--detail-pane-gap` change them. Only for a wide window: on
 * a narrow one the details belong in a `Drawer`.
 */
export function DetailPaneLayout({ open, className, children, ...props }: DetailPaneLayoutProps) {
  // The column clips what is in it only while it moves: at rest the pane's card keeps its
  // shadow on every side.
  const [resting, setResting] = useState(true);
  const [was, setWas] = useState(open);
  if (open !== was) {
    setWas(open);
    // Under reduced motion the column does not move, so it is at rest at once.
    setResting(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  return (
    <PaneContext value={{ open, resting }}>
      <div
        data-slot="detail-pane-layout"
        data-open={open ? "" : undefined}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget) setResting(true);
        }}
        className={cn(
          "grid items-start [--detail-pane-gap:1.5rem] [--detail-pane-width:20rem]",
          // The second column goes from nothing to the pane and its gutter. A layout property,
          // the one place it is animated: the content beside it has to be pushed.
          "grid-cols-[minmax(0,1fr)_0rem] transition-[grid-template-columns] spring-leave",
          "data-open:grid-cols-[minmax(0,1fr)_calc(var(--detail-pane-width)+var(--detail-pane-gap))] data-open:spring-settle",
          "motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </PaneContext>
  );
}

export type DetailPaneProps = ComponentProps<"aside">;

/**
 * The pane of a `DetailPaneLayout`. While it closes it keeps showing what it showed last, so it
 * fades with its content rather than empty. Out of reach of the keyboard while it is closed.
 * `className` places it in the column (a sticky offset under an app's bar); what it holds is
 * laid out at the pane's full width, so it never reflows while the column moves.
 */
export function DetailPane({ className, children, ...props }: DetailPaneProps) {
  const { open, resting } = use(PaneContext);
  // What it showed last, kept while it leaves. State that follows a prop, compared while
  // rendering.
  const [kept, setKept] = useState<ReactNode>(children);
  if (open && children !== kept) setKept(children);
  return (
    <aside
      data-slot="detail-pane"
      data-open={open ? "" : undefined}
      inert={!open}
      className={cn("min-w-0", !(open && resting) && "overflow-x-clip", className)}
      {...props}
    >
      <div
        data-slot="detail-pane-content"
        className={cn(
          "flex max-h-full min-h-0 w-[calc(var(--detail-pane-width)+var(--detail-pane-gap))] flex-col pl-(--detail-pane-gap)",
          "transition-opacity",
          open ? "opacity-100 spring-settle" : "opacity-0 spring-leave",
        )}
      >
        {open ? children : kept}
      </div>
    </aside>
  );
}
