"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Card } from "@/components/card/card";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
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

export type StickyDetailPaneProps = Omit<DetailPaneProps, "aria-label"> & {
  /** The pane's name as a landmark: "Details", or what it is about ("Rechnung RE-2026-118"). */
  label: string;
  /**
   * What the pane is about, where its content can be longer than the window: when it changes,
   * the pane starts at its top again instead of where the last one was left.
   */
  scrollKey?: string | number;
};

/**
 * The pane of a `DetailPaneLayout` beside a list that is longer than the window: its content
 * stands on one `Card`, which stays in view under the app's bar while the page scrolls. It is
 * never taller than the window; content that is scrolls inside the card and fades at the edge
 * where more waits, and its scrolling does not carry on into the page.
 *
 * Under an `AppShellBar` it finds the bar's height by itself (`--app-shell-top`). The room
 * between the bar and the card is `--detail-pane-top` (1.5rem, the page's own gutter, so a pane
 * that starts at the top of the page does not move before it sticks). A pane that always shows
 * something keeps its layout `open` and swaps its content instead of closing.
 */
export function StickyDetailPane({
  label,
  scrollKey,
  className,
  children,
  ...props
}: StickyDetailPaneProps) {
  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [scrollKey]);
  return (
    <DetailPane
      aria-label={label}
      data-sticky=""
      className={cn(
        "[--detail-pane-stuck:calc(var(--app-shell-top,0px)+var(--detail-pane-top,1.5rem))]",
        "sticky top-(--detail-pane-stuck) flex max-h-[calc(100svh-var(--detail-pane-stuck)-1.5rem)] flex-col",
        className,
      )}
      {...props}
    >
      <Card
        // The scrolling box's focus ring stands on the card: the box's own would fade with it.
        className={cn(
          "min-h-0",
          "has-[>[data-slot=detail-pane-scroll]:focus-visible]:outline-2",
          "has-[>[data-slot=detail-pane-scroll]:focus-visible]:outline-offset-2",
          "has-[>[data-slot=detail-pane-scroll]:focus-visible]:outline-accent",
        )}
      >
        {/* Reachable by the keyboard, as every box that scrolls: what it holds may have nothing
            that takes the focus, and the arrow keys have to scroll it all the same. */}
        <ScrollFade
          ref={scroller}
          data-slot="detail-pane-scroll"
          role="group"
          aria-label={label}
          tabIndex={0}
          className="min-h-0 scroll-py-10 [scrollbar-width:thin] overscroll-contain rounded-[inherit] focus-visible:outline-hidden"
        >
          {children}
        </ScrollFade>
      </Card>
    </DetailPane>
  );
}
