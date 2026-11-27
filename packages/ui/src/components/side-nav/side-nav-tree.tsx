"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import type { useRender } from "@base-ui/react/use-render";
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  use,
  useId,
} from "react";

import { ContextMenu, ContextMenuTrigger } from "@/components/context-menu/context-menu";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { disclosureChevron, disclosurePanel } from "@/internal/disclosure";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { renderAs } from "@/internal/render-as";
import { cn } from "@/lib/cn";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** How deep the rows of this part of the tree stand: 1 at the top. */
const DepthContext = createContext(1);

export type SideNavTreeProps = ComponentProps<"nav"> & {
  /** The name of the tree for assistive tech ("Ordner"). */
  "aria-label": string;
};

/**
 * A tree of places in a side rail: the folders of a library, the collections of a workspace.
 * Unlike a `SideNav`, whose pages are fixed, its rows are things a person makes, fills and moves:
 * each can say how much it holds, carry a menu of its own, fold its children away, become a
 * field while it is renamed, and take what is dragged onto it.
 *
 * Put a `SideNavTreeItem` per place; what lies inside one goes into its `sub`. The place that is
 * open stands on the tint. It is a navigation of links with disclosure keys, not a `tree` role:
 * Tab walks its links, keys and menus like everywhere else on the page.
 */
export function SideNavTree({ className, children, ...props }: SideNavTreeProps) {
  return (
    <nav
      data-slot="side-nav-tree"
      // Once one row can fold, every row keeps the chevron's room, so the symbols of a level
      // stand in one line whether or not their row has children.
      className={cn(
        "has-data-[slot=side-nav-tree-toggle]:[--side-nav-tree-lead:1rem]",
        // Likewise on a touch screen, where the keys always show: once one row has a key, every
        // row keeps its room, so the counts stand in one column.
        "pointer-coarse:has-data-[slot=side-nav-tree-actions]:[--side-nav-tree-tail:2.25rem]",
        className,
      )}
      {...props}
    >
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </nav>
  );
}

/** A row's indent: the rail's own inset, the chevron's room, and a step per level below the top. */
const indent =
  "pl-[calc(0.625rem+var(--side-nav-tree-lead,0px)+(var(--side-nav-tree-depth)-1)*0.875rem)]";

const row = [
  "relative flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-md py-1 pr-[calc(0.625rem+var(--side-nav-tree-tail,0px))] text-control text-fg-body",
  indent,
].join(" ");

const link = [
  // Instant, like the highlight of a menu: it follows the pointer without lag.
  "hover:bg-hover hover:text-fg",
  "aria-[current=page]:bg-tint aria-[current=page]:font-medium aria-[current=page]:text-fg",
  "forced-colors:aria-[current=page]:outline forced-colors:aria-[current=page]:-outline-offset-1",
  // Something it takes hangs over it: the tint and the field's halo, on `snap`.
  "transition-[box-shadow] spring-snap data-drop-over:bg-tint data-drop-over:text-fg data-drop-over:shadow-field-focus",
  focusRing,
].join(" ");

/** When a row shows its actions: under the pointer, with the keyboard inside it, with its menu open. */
const shown = [
  "group-hover/row:opacity-100",
  "group-has-focus-visible/row:opacity-100",
  "group-has-data-popup-open/row:opacity-100",
].join(" ");
const hidden = [
  "group-hover/row:opacity-0",
  "group-has-focus-visible/row:opacity-0",
  "group-has-data-popup-open/row:opacity-0",
].join(" ");

export type SideNavTreeItemProps = Omit<
  useRender.ComponentProps<"a">,
  "children" | "contextMenu"
> & {
  /** The place's name. */
  children: ReactNode;
  /** A symbol before the name: a folder, an inbox. */
  icon?: IconSvgElement;
  /**
   * What lies in it, already formatted ("12", "1.204"). Muted, at the end of the row; it gives
   * way to `actions` while the row is pointed at or has the keyboard.
   */
  count?: ReactNode;
  /**
   * The row's own key at its end, usually a `Menu` behind a `⋯` (a quiet, small, symbol-only
   * `Button`, named after the place: „Mehr zu Bewerbung“). It shows under the pointer, with the
   * keyboard in the row and while its menu is open; on a touch screen it always shows.
   */
  actions?: ReactNode;
  /** The place this row leads to is the one that is open. */
  current?: boolean;
  /**
   * How deep the row stands, 1 at the top. A row inside another's `sub` knows by itself; say it
   * only for rows that are drawn as one flat list.
   */
  depth?: number;
  /**
   * The field that stands in the name's place while it is changed: an `EditableName` with
   * `editing`. The row is then no link, and shows neither count nor actions.
   */
  editing?: ReactNode;
  /** The places inside this one, as `SideNavTreeItem`s. The row then has a chevron that folds them. */
  sub?: ReactNode;
  /** Whether `sub` shows (controlled). */
  open?: boolean;
  /** Whether `sub` shows at first. */
  defaultOpen?: boolean;
  /** Called when the chevron folds or unfolds `sub`. */
  onOpenChange?: (open: boolean) => void;
  /** What the chevron is called before the place's name: „Unterordner“. */
  toggleLabel?: string;
  /**
   * A `ContextMenuContent` with the same entries as the `⋯`: a right click anywhere on the row
   * opens it.
   */
  contextMenu?: ReactElement;
};

/**
 * One place of a `SideNavTree`. It is a link (`href`, or a router's link as `render`); what else
 * is passed lands on that link too, so a drop target's `dropProps` and an item's drag props are
 * simply spread on the row.
 */
export function SideNavTreeItem({
  icon,
  count,
  actions,
  current = false,
  depth,
  editing,
  sub,
  open,
  defaultOpen,
  onOpenChange,
  toggleLabel = "Unterordner",
  contextMenu,
  render,
  className,
  children,
  ...props
}: SideNavTreeItemProps) {
  const inherited = use(DepthContext);
  const level = depth ?? inherited;
  const id = useId();
  const nameId = `${id}-name`;
  const toggleId = `${id}-toggle`;
  const isEditing = editing !== undefined && editing !== null && editing !== false;
  const hasActions = actions !== undefined && actions !== null && actions !== false;

  const symbol = icon ? <Icon icon={icon} size={16} className="shrink-0 text-fg-muted" /> : null;
  const place = isEditing ? (
    <div data-slot="side-nav-tree-link" data-editing="" className={cn(row, className)}>
      {symbol}
      {editing}
    </div>
  ) : (
    renderAs("a", render, {
      ...props,
      "data-slot": "side-nav-tree-link",
      "aria-current": current ? "page" : undefined,
      className: cn(row, link, className),
      children: (
        <>
          {symbol}
          <span id={nameId} data-slot="side-nav-tree-name" className="min-w-0 flex-1 truncate">
            {children}
          </span>
          {count !== undefined && count !== null && (
            <span
              data-slot="side-nav-tree-count"
              className={cn(
                "shrink-0 text-right text-sm font-normal text-fg-muted tabular-nums",
                // As wide as the key that takes its place, so a long name ends before either.
                hasActions &&
                  cn("min-w-5 transition-opacity spring-snap pointer-coarse:opacity-100!", hidden),
              )}
            >
              {count}
            </span>
          )}
          {/* Without a count the key still needs its room at the end of the name. */}
          {hasActions && (count === undefined || count === null) && (
            <span aria-hidden className="w-5 shrink-0 pointer-coarse:hidden" />
          )}
        </>
      ),
    })
  );

  const line = (
    <div data-slot="side-nav-tree-row" className="group/row relative flex">
      {sub ? (
        <CollapsiblePrimitive.Trigger
          id={toggleId}
          data-slot="side-nav-tree-toggle"
          aria-label={toggleLabel}
          aria-labelledby={`${toggleId} ${nameId}`}
          className={cn(
            "group touch-target absolute top-1.5 z-10 flex size-5 items-center justify-center rounded-xs",
            "left-[calc(0.25rem+(var(--side-nav-tree-depth)-1)*0.875rem)]",
            focusRing,
          )}
        >
          <ChevronRightGlyph
            className={cn(
              disclosureChevron,
              "[--lean:var(--motion-lean)_0] group-data-panel-open:rotate-90 group-data-panel-open:[--lean:0_var(--motion-lean)]",
            )}
          />
        </CollapsiblePrimitive.Trigger>
      ) : null}
      {place}
      {hasActions && !isEditing ? (
        <span
          data-slot="side-nav-tree-actions"
          className={cn(
            "absolute inset-y-0 right-0.5 flex items-center opacity-0 transition-opacity spring-snap pointer-coarse:right-1.5 pointer-coarse:opacity-100",
            shown,
          )}
        >
          {actions}
        </span>
      ) : null}
    </div>
  );
  const withMenu =
    contextMenu && !isEditing ? (
      <ContextMenu>
        <ContextMenuTrigger render={line} />
        {contextMenu}
      </ContextMenu>
    ) : (
      line
    );

  const item = { "--side-nav-tree-depth": level } as CSSProperties;
  if (!sub) {
    return (
      <li data-slot="side-nav-tree-item" style={item} className="flex flex-col">
        {withMenu}
      </li>
    );
  }
  return (
    <CollapsiblePrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      render={<li />}
      data-slot="side-nav-tree-item"
      style={item}
      className="flex flex-col"
    >
      {withMenu}
      <CollapsiblePrimitive.Panel
        data-slot="side-nav-tree-sub"
        // It clips, so it is 4px wider than its rows to both sides and keeps 4px above and
        // below them: the focus outline of a row inside is whole.
        className={cn("-mx-1 h-(--collapsible-panel-height) px-1", disclosurePanel)}
      >
        <DepthContext value={level + 1}>
          <ul className="flex flex-col gap-0.5 py-1">{sub}</ul>
        </DepthContext>
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  );
}
