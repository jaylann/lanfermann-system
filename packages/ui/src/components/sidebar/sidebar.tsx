"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import type { useRender } from "@base-ui/react/use-render";
import {
  type ComponentProps,
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/drawer/drawer";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { Shortcut } from "@/components/shortcut/shortcut";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip/tooltip";
import { disclosureChevron, disclosurePanel } from "@/internal/disclosure";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { renderAs } from "@/internal/render-as";
import { useTravellingMark } from "@/internal/travelling-mark";
import { cn } from "@/lib/cn";

import { SidebarStateContext, useWideWindow } from "./sidebar-context";

/** What the parts need to know of the sidebar they stand in. */
type SidebarLayout = {
  /** Collapsed to the rail: only the symbols show. */
  rail: boolean;
  /** The sidebar's name, which names its navigation. */
  label: string;
  /** Whether the tint travels from entry to entry. */
  travel: boolean;
  /** Called when an entry is pressed, inside the drawer: the drawer closes. */
  onNavigate?: () => void;
};

const SidebarLayoutContext = createContext<SidebarLayout>({ rail: false, label: "", travel: true });

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The lengths every part is cut from.
 *
 *   --sidebar-width    the open sidebar
 *   --sidebar-rail     the collapsed one: a row's height, and the gutter to both sides
 *   --sidebar-pad      what a row keeps to the left of its symbol, so that a 16px symbol stands
 *                      in the middle of a row that is as wide as it is tall
 *   --sidebar-row      the width a row's content is laid out at, whatever the row's own width
 *   --sidebar-current  the tint of the current entry, taken away once the travelling tint has
 *                      taken over (and given back inside a group that is folding)
 */
const lengths = [
  "[--sidebar-width:15rem]",
  "[--sidebar-rail:calc(var(--control-md)+1rem)]",
  "[--sidebar-pad:calc((var(--control-md)-1rem)/2)]",
  "[--sidebar-row:calc(var(--sidebar-width)-1rem-1px)]",
  "[--sidebar-current:var(--lf-tint)]",
].join(" ");

export type SidebarProps = Omit<ComponentProps<"div">, "aria-label"> & {
  /** The name of the navigation for assistive tech ("Hauptnavigation"). */
  "aria-label": string;
  /**
   * What is left of it when it is collapsed. `rail` (the default): the symbols stay, each named
   * by a tooltip. `hidden`: nothing, and the page has the whole window.
   */
  collapse?: "rail" | "hidden";
  /**
   * The tint travels from the page that was current to the one that is now (the default). Set
   * it to `false` and the tint changes its place at once.
   */
  travel?: boolean;
};

/**
 * The navigation of an app, beside its pages: the places one works in, in groups, each with a
 * symbol. It is read and it leads somewhere, so it is flat: no shadow, a hairline to the page.
 * The page one is on stands on the tint, and the tint travels there when the page changes.
 *
 * Put a `SidebarHeader`, a `SidebarContent` with the entries and a `SidebarFooter` inside, and
 * the sidebar inside an `AppShell`. The shell keeps whether it is open; a `SidebarTrigger`
 * anywhere in the shell collapses it, and so does ⌘B. Collapsed, the symbols stay where they
 * are and what stands to their right leaves. On a narrow window the same sidebar comes in from
 * the left as a drawer that can be swiped back.
 *
 * Word an entry as the place, a noun of one or two words ("Angebote", "Einstellungen"). An
 * entry that does something instead of leading somewhere belongs in a menu or the page.
 */
export function Sidebar({
  "aria-label": label,
  collapse = "rail",
  travel = true,
  className,
  children,
  ...props
}: SidebarProps) {
  const state = useContext(SidebarStateContext);
  const box = useRef<HTMLDivElement>(null);
  const open = state?.open ?? true;
  const rail = !open && collapse === "rail";
  const gone = !open && collapse === "hidden";

  // A sidebar that leaves entirely takes the keyboard focus with it: hand it to the trigger.
  useEffect(() => {
    const sidebar = box.current;
    if (!gone || !sidebar?.contains(document.activeElement)) return;
    sidebar
      .closest('[data-slot="app-shell"]')
      ?.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')
      ?.focus();
  }, [gone]);

  const layout = useMemo(() => ({ rail, label, travel }), [rail, label, travel]);
  const closeDrawer = state?.setDrawerOpen;
  const drawerLayout = useMemo(
    () => ({ rail: false, label, travel, onNavigate: () => closeDrawer?.(false) }),
    [label, travel, closeDrawer],
  );

  return (
    // Once one entry of the rail has named itself, its neighbours do so without the wait.
    <TooltipProvider>
      <SidebarLayoutContext value={layout}>
        <div
          ref={box}
          id={state?.id}
          data-slot="sidebar"
          data-state={open ? "expanded" : "collapsed"}
          data-collapse={collapse}
          data-rail={rail ? "" : undefined}
          inert={gone}
          className={cn(
            lengths,
            "sticky top-0 z-10 h-dvh shrink-0 justify-end self-start overflow-hidden border-r border-hairline bg-ground text-control",
            // Width is laid out on every frame, which the rule against it is about. Here the
            // page beside it has to be pushed, and it never happens on a phone.
            "w-(--sidebar-width) transition-[width,border-color] spring-settle",
            "data-rail:w-(--sidebar-rail)",
            "data-[collapse=hidden]:data-[state=collapsed]:w-0 data-[collapse=hidden]:data-[state=collapsed]:border-transparent",
            // Inside a shell it stands beside the page only on a wide window.
            state ? "hidden md:flex" : "flex",
            className,
          )}
          {...props}
        >
          <div
            data-slot="sidebar-inner"
            className={cn(
              "flex min-h-0 flex-col",
              // Leaving entirely, it keeps its width and goes out with the edge, like a drawer.
              collapse === "hidden" ? "w-[calc(var(--sidebar-width)-1px)] shrink-0" : "w-full",
            )}
          >
            {children}
          </div>
        </div>
      </SidebarLayoutContext>
      {state ? (
        <Drawer side="left" open={state.drawerOpen} onOpenChange={state.setDrawerOpen}>
          <DrawerContent
            hideClose
            className="w-[calc(18rem+var(--bleed))] rounded-r-xl py-0 pr-0 pl-(--bleed)"
          >
            <DrawerTitle className="sr-only">{label}</DrawerTitle>
            <SidebarLayoutContext value={drawerLayout}>
              <div
                data-slot="sidebar"
                data-drawer=""
                className={cn(
                  lengths,
                  "flex min-h-0 flex-1 flex-col text-control [--sidebar-row:calc(var(--sidebar-width)-1rem)] [--sidebar-width:18rem]",
                )}
              >
                {children}
              </div>
            </SidebarLayoutContext>
            {/* The scrim and a swipe close it too; this is the way out for assistive tech. */}
            <DrawerClose className="sr-only">Schließen</DrawerClose>
          </DrawerContent>
        </Drawer>
      ) : null}
    </TooltipProvider>
  );
}

/** What stands above the entries and stays there: the workspace, the product's mark. */
export function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      // As tall as the page's bar beside it, so the two stand on one line.
      className={cn("flex h-12 shrink-0 items-center px-2", className)}
      {...props}
    />
  );
}

/** What stands below the entries and stays there: the person who is signed in. */
export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex shrink-0 flex-col gap-0.5 p-2", className)}
      {...props}
    />
  );
}

/**
 * The entries: `SidebarGroup`s, or `SidebarItem`s without a group. It is the navigation, named
 * by the sidebar's `aria-label`, and it scrolls inside itself when the entries do not fit,
 * fading at the end that has more.
 */
export function SidebarContent({ className, children, ...props }: ComponentProps<"nav">) {
  const { label, travel } = useContext(SidebarLayoutContext);
  const list = useRef<HTMLUListElement>(null);
  const mark = useRef<HTMLLIElement>(null);
  useTravellingMark(list, mark, {
    // A subpage wears the hairline, not the tint (`SidebarSubItem`).
    current: '[data-slot="sidebar-item"][aria-current="page"]',
    still: "data-folding",
    folds: '[data-slot="sidebar-sub"]',
    enabled: travel,
  });
  return (
    <nav
      data-slot="sidebar-content"
      aria-label={label}
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      <ScrollFade
        axis="y"
        className="min-h-0 flex-1 [scrollbar-width:none] overscroll-contain px-2 py-2"
      >
        <ul
          ref={list}
          data-slot="sidebar-list"
          className="relative isolate flex flex-col gap-4 data-placed:[--sidebar-current:transparent]"
        >
          {children}
          <li
            ref={mark}
            aria-hidden
            role="presentation"
            data-slot="sidebar-mark"
            className="travels -z-10 rounded-md bg-tint"
          />
        </ul>
      </ScrollFade>
    </nav>
  );
}

/** Text that leaves when the sidebar collapses to its rail, and comes back with it. */
const leaves = "transition-opacity spring-settle in-data-rail:opacity-0 in-data-rail:spring-leave";

const groupTitle = [
  "relative flex h-7 w-full shrink-0 items-center overflow-hidden rounded-md text-left text-sm text-fg-muted",
  // On the rail a short hairline stands where the name was: the groups stay apart. It comes
  // once the name has gone, or it would strike the name through for a moment, and it is the
  // first to go when the name comes back.
  "after:absolute after:top-1/2 after:left-(--sidebar-pad) after:h-px after:w-4 after:bg-hairline after:opacity-0 after:transition-opacity after:spring-leave",
  "in-data-rail:after:opacity-100 in-data-rail:after:delay-150 in-data-rail:after:spring-settle",
].join(" ");

const groupTitleStrip = cn(
  "flex w-(--sidebar-row) shrink-0 items-center gap-2 px-(--sidebar-pad) whitespace-nowrap",
  leaves,
);

const groupList = "flex flex-col gap-0.5";

export type SidebarGroupProps = Omit<ComponentProps<"li">, "title"> & {
  /** What the entries below have in common: a noun ("Arbeit", "Verwaltung"). */
  title?: ReactNode;
  /** The group can be folded under its name. */
  collapsible?: boolean;
  /** Whether a group that folds is open (controlled). */
  open?: boolean;
  /** Whether a group that folds is open at first. Open unless said otherwise. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Entries that belong together, under their name. Without a `title` they simply stand apart
 * from the group before. A group that is `collapsible` folds under its name; use it for a
 * group that is long and not needed every day, and leave the main one alone.
 */
export function SidebarGroup({
  title,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  className,
  children,
  ...props
}: SidebarGroupProps) {
  const id = useId();
  const { rail } = useContext(SidebarLayoutContext);
  // While the panel moves it clips its entries, and the travelling tint is not inside it: for
  // that time the current entry wears the tint itself (`useTravellingMark`, `still`).
  const [folding, setFolding] = useState(false);
  const rest = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(rest.current), []);

  if (!collapsible || title === undefined) {
    return (
      <li data-slot="sidebar-group" className={cn("flex flex-col gap-0.5", className)} {...props}>
        {title !== undefined && (
          <p id={id} data-slot="sidebar-group-title" className={groupTitle}>
            <span className={groupTitleStrip}>{title}</span>
          </p>
        )}
        <ul aria-labelledby={title !== undefined ? id : undefined} className={groupList}>
          {children}
        </ul>
      </li>
    );
  }

  const settled = () => {
    clearTimeout(rest.current);
    setFolding(false);
  };

  return (
    <CollapsiblePrimitive.Root
      render={<li {...props} />}
      data-slot="sidebar-group"
      data-folding={folding ? "" : undefined}
      open={open}
      defaultOpen={defaultOpen}
      // On the rail the name is not there to be pressed.
      disabled={rail}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        setFolding(true);
        clearTimeout(rest.current);
        // Should the panel never say that it has arrived (no transition at all).
        rest.current = setTimeout(settled, 900);
      }}
      className={cn(
        "flex flex-col gap-0.5 data-folding:[--sidebar-current:var(--lf-tint)]",
        className,
      )}
    >
      <CollapsiblePrimitive.Trigger
        id={id}
        data-slot="sidebar-group-title"
        className={cn(groupTitle, "group select-none hover:text-fg", focusRing)}
      >
        <span className={groupTitleStrip}>
          {title}
          <ChevronRightGlyph
            width={10}
            height={10}
            // Always there, not only under the pointer: a finger has no pointer to show it.
            className={cn(disclosureChevron, "ml-auto group-data-panel-open:rotate-90")}
          />
        </span>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Panel
        data-slot="sidebar-group-panel"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "height") settled();
        }}
        // The panel clips: it is 4px larger than its entries on every side, so the focus outline
        // of an entry at its edge is whole.
        className={cn("-m-1 h-(--collapsible-panel-height) p-1", disclosurePanel)}
      >
        <ul aria-labelledby={id} className={groupList}>
          {children}
        </ul>
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  );
}

/**
 * A row. It is as wide as the sidebar lets it be, and it clips: what it holds is laid out at
 * the sidebar's full width and never reflows. So when the sidebar collapses, the symbol stays
 * exactly where it is and the row's edge takes away what stands to its right.
 */
const row = [
  "group/row relative flex h-(--control-md) w-full shrink-0 items-center overflow-hidden rounded-md text-left text-control text-fg-body select-none",
  // Instant, like the highlight of a menu: it follows the pointer without lag.
  "not-aria-[current=page]:hover:bg-hover hover:text-fg data-popup-open:text-fg not-aria-[current=page]:data-popup-open:bg-hover",
  "aria-[current=page]:bg-(--sidebar-current) aria-[current=page]:font-medium aria-[current=page]:text-fg",
  "forced-colors:aria-[current=page]:outline forced-colors:aria-[current=page]:-outline-offset-1",
  focusRing,
].join(" ");

const rowStrip = "flex w-(--sidebar-row) shrink-0 items-center gap-2.5 px-(--sidebar-pad)";
// A 24px picture in place of the 16px symbol stands in the middle of the rail too, and the
// name after it starts where the names after a symbol start.
const rowStripMedia = "gap-1.5 px-[calc((var(--control-md)-1.5rem)/2)]";
const rowLabel = cn("min-w-0 flex-1 truncate", leaves);
const rowDetail = cn("flex shrink-0 items-center text-sm text-fg-muted tabular-nums", leaves);
/**
 * The symbol answers the hand. Its colour eases from muted to full; under a press it dips and,
 * let go, seats back with the small bounce a button has (`seat`). Under the pointer it does one
 * small thing of its own, which `iconMotion` chooses. All of it is a transform, and none of it
 * runs under reduced motion.
 */
const rowSymbol = [
  "text-fg-muted transition-[color,scale,rotate] spring-seat",
  "group-hover/row:text-fg group-hover/row:spring-snap group-aria-[current=page]/row:text-fg group-data-popup-open/row:text-fg",
  "motion-safe:group-active/row:scale-90 group-active/row:spring-snap",
].join(" ");

/** What the symbol does under the pointer. */
const symbolMotion = {
  /** It comes a little towards the hand. Right for nearly every symbol. */
  lift: "motion-safe:group-hover/row:scale-110 motion-safe:group-active/row:scale-90",
  /** It turns by a sixth: for what turns, a gear, a wheel, something that reloads. */
  turn: "motion-safe:group-hover/row:rotate-60",
  /** It leans, the way a sheet is picked up by its corner: for a page, a note, a letter. */
  tilt: "motion-safe:group-hover/row:-rotate-8",
  /** It keeps still, apart from the press. */
  none: "",
} as const;

/** Two chevrons that part a little: the row opens a menu. */
function UnfoldGlyph() {
  const part = "transition-[translate] spring-seat group-hover/row:spring-snap";
  return (
    <svg
      data-slot="glyph"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 overflow-visible"
    >
      <path
        d="M3.5 4.5 6 2l2.5 2.5"
        className={cn(
          part,
          "motion-safe:group-hover/row:-translate-y-px motion-safe:group-data-popup-open/row:-translate-y-px",
        )}
      />
      <path
        d="M3.5 7.5 6 10l2.5-2.5"
        className={cn(
          part,
          "motion-safe:group-hover/row:translate-y-px motion-safe:group-data-popup-open/row:translate-y-px",
        )}
      />
    </svg>
  );
}

type RowParts = {
  /** The symbol in front of the name, from `@hugeicons/core-free-icons`. */
  icon?: IconSvgElement;
  /**
   * What the symbol does under the pointer: `lift` (the default), `turn` for what turns (a
   * gear), `tilt` for a sheet or a note, `none`. A press makes every symbol dip and seat back.
   */
  iconMotion?: keyof typeof symbolMotion;
  /** A picture in place of the symbol: an `Avatar size="sm"`. */
  media?: ReactNode;
  /** A quiet fact at the end of the row: how many wait there (a number), a `Shortcut`. */
  detail?: ReactNode;
};

function RowContent({
  icon,
  iconMotion = "lift",
  media,
  detail,
  children,
}: RowParts & { children?: ReactNode }) {
  return (
    <span className={cn(rowStrip, media !== undefined && rowStripMedia)}>
      {media !== undefined ? (
        <span
          data-slot="sidebar-media"
          className="flex size-6 shrink-0 items-center justify-center transition-[scale] spring-seat group-active/row:spring-snap motion-safe:group-active/row:scale-92"
        >
          {media}
        </span>
      ) : icon ? (
        <Icon icon={icon} size={16} className={cn(rowSymbol, symbolMotion[iconMotion])} />
      ) : null}
      <span data-slot="sidebar-label" className={rowLabel}>
        {children}
      </span>
      {detail !== undefined && (
        <span data-slot="sidebar-detail" className={rowDetail}>
          {detail}
        </span>
      )}
    </span>
  );
}

export type SidebarItemProps = Omit<useRender.ComponentProps<"a">, "className"> &
  RowParts & {
    className?: string;
    /** The page this entry leads to is the one being worked on. */
    current?: boolean;
    /**
     * What lies under this page, as `SidebarSubItem`s. Shown under the current page, or under
     * any page that is `open`. They fold open under their page and fold away again, and what
     * stands below moves with them.
     */
    sub?: ReactNode;
    /**
     * Show `sub` although this page is not the current one: the reader is on one of its
     * subpages, which then wears `current` itself.
     */
    open?: boolean;
  };

/**
 * One place of the app: a symbol and its name. For a router's link, pass it as `render`. On
 * the rail the name is a tooltip beside the symbol.
 */
export function SidebarItem({
  icon,
  iconMotion,
  media,
  detail,
  current = false,
  sub,
  open = false,
  render,
  className,
  children,
  onClick,
  ...props
}: SidebarItemProps) {
  const { rail, onNavigate } = useContext(SidebarLayoutContext);
  // On the rail there is no room for subpages: they fold away, and come back with it.
  const unfolded = (current || open) && !rail;
  const link = renderAs("a", render, {
    ...props,
    "data-slot": "sidebar-item",
    "aria-current": current ? "page" : undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      onNavigate?.();
    },
    className: cn(row, className),
    children: (
      <RowContent icon={icon} iconMotion={iconMotion} media={media} detail={detail}>
        {children}
      </RowContent>
    ),
  });
  return (
    <li data-slot="sidebar-entry" className="flex flex-col">
      <Tooltip disabled={!rail}>
        <TooltipTrigger render={link} />
        {/* 8px to the sidebar's edge, and the tooltip's own 6px beyond it. */}
        <TooltipContent side="right" sideOffset={14}>
          {children}
        </TooltipContent>
      </Tooltip>
      {sub ? (
        <div
          data-slot="sidebar-sub"
          data-open={unfolded ? "" : undefined}
          // Folded away they are still in the page, so they can fold open and shut; nothing in
          // them can be reached then.
          inert={!unfolded}
          // A row that opens from nothing (`0fr`) on `settle` and closes on the faster `leave`.
          // The box clips; what it holds overflows its row on the way, which is what a row of a
          // fraction needs (motion.md).
          className={cn(
            "grid grid-rows-[0fr] overflow-hidden opacity-0 transition-[grid-template-rows,opacity,visibility] spring-leave",
            "invisible data-open:visible data-open:grid-rows-[1fr] data-open:opacity-100 data-open:spring-settle",
          )}
        >
          <div className="min-h-0">
            {/* The space around the list is a padding, not the list's margin: a margin is not
                part of what the box says it holds, and the tint asks it how tall it will be
                (`folds` in `useTravellingMark`). */}
            <div className="pt-1 pb-1.5">
              {/* The hairline runs down from the middle of the symbol above it. */}
              <ul className="ml-[calc(var(--sidebar-pad)+0.5rem-0.5px)] flex w-(--sidebar-row) flex-col border-l border-hairline">
                {sub}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export type SidebarSubItemProps = Omit<useRender.ComponentProps<"a">, "className"> & {
  className?: string;
  /** The subpage this entry leads to is the one being worked on. */
  current?: boolean;
};

/**
 * A subpage under an entry. The one being worked on takes the hairline in the text colour, as
 * a `SideNav` marks its subpage; its parent then stands without the tint.
 */
export function SidebarSubItem({
  current = false,
  render,
  className,
  onClick,
  ...props
}: SidebarSubItemProps) {
  const { onNavigate } = useContext(SidebarLayoutContext);
  const link = renderAs("a", render, {
    ...props,
    "data-slot": "sidebar-sub-item",
    "aria-current": current ? "page" : undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      onNavigate?.();
    },
    className: cn(
      // The name starts where the names of the entries above start.
      "-ml-px flex min-h-7 items-center rounded-r-xs border-l border-transparent py-0.5 pr-2 pl-4.5 text-sm text-fg-muted select-none hover:border-line hover:text-fg",
      "aria-[current=page]:border-fg aria-[current=page]:font-medium aria-[current=page]:text-fg",
      "forced-colors:aria-[current=page]:border-[Highlight]",
      focusRing,
      className,
    ),
  });
  return <li data-slot="sidebar-sub-entry">{link}</li>;
}

export type SidebarButtonProps = Omit<useRender.ComponentProps<"button">, "className"> &
  RowParts & {
    className?: string;
    /**
     * The row opens a menu: two small chevrons at its end say so. They part a little under the
     * pointer, and stay parted while the menu is open. Takes the place of `detail`.
     */
    menu?: boolean;
  };

/**
 * A row that is pressed instead of leading somewhere, for the header and the footer: the
 * workspace or the person, as the trigger of a `Menu`
 * (`<MenuTrigger render={<SidebarButton menu media={…}>…</SidebarButton>} />`). Not for the
 * list of places: those are `SidebarItem`s.
 */
export function SidebarButton({
  icon,
  iconMotion,
  media,
  detail,
  menu = false,
  render,
  className,
  children,
  ...props
}: SidebarButtonProps) {
  return renderAs("button", render, {
    type: "button",
    ...props,
    "data-slot": "sidebar-button",
    className: cn(row, className),
    children: (
      <RowContent
        icon={icon}
        iconMotion={iconMotion}
        media={media}
        detail={menu ? <UnfoldGlyph /> : detail}
      >
        {children}
      </RowContent>
    ),
  });
}

/** A window with its side panel. The dividing line steps aside while the sidebar is collapsed. */
function SidebarGlyph() {
  return (
    <svg
      data-slot="glyph"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2.5" />
      <path
        d="M6.25 3v10"
        className="transition-[translate] spring-seat group-aria-[expanded=false]/trigger:-translate-x-[1.5px]"
      />
    </svg>
  );
}

export type SidebarTriggerProps = Omit<ButtonProps, "iconOnly" | "aria-label" | "children"> & {
  /** The accessible name. It names the thing; whether it is open is said separately. */
  "aria-label"?: string;
};

/**
 * The button that collapses and expands the sidebar, usually the first thing in the page's bar.
 * On a narrow window it opens the sidebar as a drawer. Its tooltip names the shortcut.
 */
export function SidebarTrigger({
  "aria-label": label = "Seitenleiste",
  className,
  onClick,
  ...props
}: SidebarTriggerProps) {
  const state = useContext(SidebarStateContext);
  const wide = useWideWindow();
  const expanded = state ? (wide ? state.open : state.drawerOpen) : true;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="quiet"
            {...props}
            iconOnly
            aria-label={label}
            aria-expanded={expanded}
            aria-controls={wide ? state?.id : undefined}
            data-slot="sidebar-trigger"
            className={cn("group/trigger text-fg-muted hover:text-fg", className)}
            onClick={(event) => {
              onClick?.(event);
              state?.toggle();
            }}
          />
        }
      >
        <SidebarGlyph />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        {state?.shortcut ? <Shortcut keys={state.shortcut} /> : null}
      </TooltipContent>
    </Tooltip>
  );
}
