"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import {
  type ComponentProps,
  createContext,
  type Ref,
  type RefCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import { useReducedMotion } from "@/internal/reduced-motion";
import { useScrollEdges } from "@/internal/scroll-edges";
import { cn, mergeClassName } from "@/lib/cn";

export type TabsProps = TabsPrimitive.Root.Props;

/** Sections of one page. For views of the same data, use a `SegmentedControl` instead. */
export function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={mergeClassName("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

/** How far a tab keeps off the edge it is scrolled to: past the fade (tabs.css), in px. */
const REVEAL_MARGIN = 40;

function mergeRefs<T>(own: Ref<T>, theirs: Ref<T> | undefined): RefCallback<T> {
  return (node) => {
    for (const ref of [own, theirs]) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

/**
 * A row of labels, each with a mark. One soft highlight glides to the current tab (`glide`) and
 * its mark closes from ring to disc. Base UI measures the active tab; we only move the highlight.
 *
 * A row wider than its place stays one row: it scrolls sideways inside itself, its edges fade
 * where more tabs wait, and the current tab is brought into view when it changes (and when the
 * row first shows), sideways only, so the page never moves.
 */
export function TabsList({ className, children, ref, ...props }: TabsPrimitive.List.Props) {
  const list = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useScrollEdges(list);

  useEffect(() => {
    const row = list.current;
    if (!row) return;
    const reveal = (behavior: ScrollBehavior) => {
      const tab = row.querySelector<HTMLElement>('[data-slot="tab"][data-active]');
      if (!tab || row.scrollWidth <= row.clientWidth) return;
      const start = tab.offsetLeft - REVEAL_MARGIN;
      const end = tab.offsetLeft + tab.offsetWidth + REVEAL_MARGIN - row.clientWidth;
      if (row.scrollLeft > start) row.scrollTo({ left: Math.max(0, start), behavior });
      else if (row.scrollLeft < end) row.scrollTo({ left: end, behavior });
    };
    reveal("instant");
    const observer = new MutationObserver(() => reveal(reduced ? "instant" : "smooth"));
    observer.observe(row, { attributeFilter: ["data-active"], subtree: true });
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <TabsPrimitive.List
      ref={mergeRefs(list, ref)}
      data-slot="tabs-list"
      className={mergeClassName(
        [
          // `isolate` lets the highlight sit behind the tabs without leaving the list.
          "relative isolate flex gap-1",
          // More tabs than the window is wide: the list scrolls inside itself, never the page.
          // The 4px of padding (taken back by the margin) keep a tab's focus outline and its
          // touch target inside the scrolling box, which clips.
          "-m-1 max-w-[calc(100%+0.5rem)] [scrollbar-width:none] overflow-x-auto p-1",
        ],
        className,
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className="absolute top-(--active-tab-top) left-0 -z-10 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-md bg-hover transition-[translate,width] spring-glide forced-colors:outline forced-colors:-outline-offset-1"
      />
    </TabsPrimitive.List>
  );
}

export function Tab({ className, children, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tab"
      className={mergeClassName(
        [
          "group touch-target relative inline-flex h-(--control-md) items-center gap-2 rounded-md pr-3.5 pl-3 text-control font-medium whitespace-nowrap text-fg-muted select-none",
          "transition-colors duration-150 ease-out hover:text-fg data-active:text-fg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-disabled:pointer-events-none data-disabled:text-on-disabled",
        ],
        className,
      )}
      {...props}
    >
      <span data-slot="tab-mark" aria-hidden className="mark group-data-active:mark-on" />
      {children}
    </TabsPrimitive.Tab>
  );
}

// Whether the panels stand in one place (TabsPanels), each as tall as the tallest.
const StackContext = createContext(false);

export type TabsPanelsProps = ComponentProps<"div">;

/**
 * The panels of one `Tabs`, stacked in one place: every panel stays rendered, the ones not shown
 * are invisible and inert, and the place is as tall as the tallest of them. Switching tabs then
 * never moves what stands below. For panels of different heights on a page that is read
 * downwards, such as the cases of a graphic.
 *
 * What moves by itself inside a panel (a demo on a timer) should wait while its panel is not
 * shown: Base UI marks such a panel `data-hidden`.
 */
export function TabsPanels({ className, ...props }: TabsPanelsProps) {
  return (
    <StackContext value>
      <div
        data-slot="tabs-panels"
        className={cn("grid *:col-start-1 *:row-start-1", className)}
        {...props}
      />
    </StackContext>
  );
}

/** Panels do not slide: the highlight already showed where you went. */
export function TabsPanel({ className, keepMounted, render, ...props }: TabsPrimitive.Panel.Props) {
  const stacked = useContext(StackContext);
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      keepMounted={stacked || keepMounted}
      // Stacked, a panel that is not shown keeps its place: Base UI's `hidden` would take it out
      // of the layout (and Tailwind's base layer makes that `!important`), so it is dropped, and
      // the panel is invisible instead. Base UI keeps it inert.
      render={stacked ? (panel) => <div {...panel} hidden={undefined} /> : render}
      className={mergeClassName(
        [
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          stacked && "data-hidden:invisible",
        ],
        className,
      )}
      {...props}
    />
  );
}
