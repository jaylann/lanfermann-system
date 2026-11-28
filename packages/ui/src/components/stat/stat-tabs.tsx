"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

import { mergeClassName } from "@/lib/cn";

export type StatTabsListProps = TabsPrimitive.List.Props;

/**
 * Figures as the tabs of what stands under them: the measures of one chart (clicks,
 * impressions, CTR, position), of which one is drawn. Each tab is a figure, its label with the
 * mark, the figure and how it moved; one soft highlight glides to the chosen one, as in a
 * `TabsList`, and its mark closes from ring to disc.
 *
 * Put it into `Tabs` in a `TabsList`'s place, with a `StatTab` per figure, two to five. The
 * figures share the width in equal columns; on a phone they stand two abreast and the highlight
 * travels down as well as across. Name the row („Kennzahl“). For figures that choose nothing, a
 * `StatGroup` is the part.
 */
export function StatTabsList({ className, children, ...props }: StatTabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="stat-tabs-list"
      className={mergeClassName(
        [
          // `isolate` lets the highlight sit behind the tabs without leaving the list.
          "relative isolate grid grid-cols-2 gap-1",
          "sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none",
        ],
        className,
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="stat-tabs-indicator"
        // Placed from the tab Base UI measures, and moved by `translate` in both directions:
        // two abreast, the highlight goes to the row below as it goes across.
        className="absolute top-0 left-0 -z-10 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-lg bg-hover transition-[translate,width,height] spring-glide forced-colors:outline forced-colors:-outline-offset-1"
      />
    </TabsPrimitive.List>
  );
}

export type StatTabProps = Omit<TabsPrimitive.Tab.Props, "children"> & {
  /** What the figure is: a noun („Besuche“, „Durchschnittliche Position“). */
  label: ReactNode;
  /**
   * How the figure moved, under it: a `StatChange` with `render={<span />}` (a paragraph may
   * not stand in a tab), or a muted line of what it is compared with.
   */
  change?: ReactNode;
  /** The figure itself: a formatted number, or a `RollingNumber` where it changes on screen. */
  children: ReactNode;
};

/**
 * One figure of a `StatTabsList`. Its mark hangs before the label, and the figure and its change
 * stand under the label on the label's own edge, so the figures of a row read as one line.
 */
export function StatTab({ label, change, className, children, ...props }: StatTabProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="stat-tab"
      className={mergeClassName(
        [
          "group relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] content-start items-center gap-x-2 gap-y-1 rounded-lg px-3.5 pt-3 pb-3.5 text-left select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-disabled:pointer-events-none",
        ],
        className,
      )}
      {...props}
    >
      <span data-slot="stat-tab-mark" aria-hidden className="mark group-data-active:mark-on" />
      <span
        data-slot="stat-tab-label"
        className="truncate text-sm text-fg-muted transition-colors duration-150 ease-out group-hover:text-fg group-data-active:text-fg group-data-disabled:text-on-disabled"
      >
        {label}
      </span>
      <span
        data-slot="stat-tab-value"
        className="col-start-2 text-xl font-medium whitespace-nowrap text-fg tabular-nums group-data-disabled:text-on-disabled"
      >
        {children}
      </span>
      {change !== undefined && change !== null && (
        <span
          data-slot="stat-tab-change"
          // A figure that takes no press says nothing in colour either.
          className="col-start-2 flex min-w-0 text-sm text-fg-muted group-data-disabled:**:text-on-disabled"
        >
          {change}
        </span>
      )}
    </TabsPrimitive.Tab>
  );
}
