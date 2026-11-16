"use client";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import type { ComponentProps } from "react";

import { useGround } from "@/components/ground/ground";
import { ChevronDownGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";

import { navigationMenuEntryVariants } from "./navigation-menu-variants";

export type NavigationMenuProps = NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align" | "sideOffset">;

/**
 * The places of a website as one row: plain links, and entries that open a panel with the pages
 * behind them. A panel opens when its entry is pointed at or pressed, and one sheet serves them
 * all: moving along the row, it glides to the next entry and takes its size, and the content
 * changes inside it.
 *
 * It is a `<nav>`: name it with `aria-label`. Put a `NavigationMenuList` inside, with one
 * `NavigationMenuItem` per entry.
 */
export function NavigationMenu({
  align = "start",
  sideOffset = 8,
  className,
  children,
  ...props
}: NavigationMenuProps) {
  const ground = useGround();
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={mergeClassName("relative flex items-center", className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Portal>
        <NavigationMenuPrimitive.Positioner
          data-slot="navigation-menu-positioner"
          side="bottom"
          align={align}
          sideOffset={sideOffset}
          collisionPadding={{ top: 8, bottom: 8, left: 16, right: 16 }}
          // The sheet belongs under its row: it never flips above it.
          collisionAvoidance={{ side: "none" }}
          className={cn(
            "z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)",
            // It glides from entry to entry; it does not close and open again.
            "transition-[top,left,right,bottom] spring-glide data-instant:transition-none",
            // A bridge over the gap, so the pointer can travel from the entry to the sheet.
            "before:absolute before:inset-x-0 before:-top-2 before:h-2 before:content-['']",
          )}
        >
          <NavigationMenuPrimitive.Popup
            data-slot="navigation-menu-popup"
            data-theme={ground}
            className={cn(
              "relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-xl bg-sheet text-fg-body depth-floating outline-hidden",
              // Size is the one thing that has to be laid out here: the sheet takes the measure
              // of whatever content it holds.
              "transition-[opacity,scale,width,height] spring-glide",
              "data-starting-style:scale-(--motion-enter-scale) data-starting-style:opacity-0",
              "data-ending-style:opacity-0 data-ending-style:spring-leave",
              "data-instant:transition-none",
            )}
          >
            <NavigationMenuPrimitive.Viewport
              data-slot="navigation-menu-viewport"
              className="relative size-full overflow-hidden rounded-[inherit]"
            />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>
      </NavigationMenuPrimitive.Portal>
    </NavigationMenuPrimitive.Root>
  );
}

export function NavigationMenuList({ className, ...props }: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={mergeClassName("flex list-none items-center gap-1", className)}
      {...props}
    />
  );
}

export function NavigationMenuItem({ className, ...props }: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={mergeClassName("relative", className)}
      {...props}
    />
  );
}

/**
 * An entry that opens a panel: a noun of one or two words ("Produkt", "Dokumentation"). The
 * chevron says that more is behind it and turns while the panel is open.
 */
export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={mergeClassName(navigationMenuEntryVariants(), className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon
        data-slot="navigation-menu-icon"
        className="flex text-fg-muted transition-[rotate] spring-settle group-data-popup-open/entry:rotate-180"
      >
        <ChevronDownGlyph />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  );
}

/**
 * The panel of an entry. Lay its links out as a list, one column or two, and give the list a
 * width: the sheet takes it. Coming from a neighbouring entry, the content arrives from that
 * side; it leaves by fading.
 */
export function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={mergeClassName(
        [
          "h-full w-max max-w-[calc(100vw-2rem)] p-2",
          "transition-[opacity,translate] spring-settle",
          "data-ending-style:opacity-0 data-ending-style:spring-leave data-starting-style:opacity-0",
          "data-starting-style:data-[activation-direction=left]:-translate-x-[calc(var(--motion-enter-offset)*6)]",
          "data-starting-style:data-[activation-direction=right]:translate-x-[calc(var(--motion-enter-offset)*6)]",
        ],
        className,
      )}
      {...props}
    />
  );
}

export type NavigationMenuLinkProps = NavigationMenuPrimitive.Link.Props & {
  /**
   * `page` is a row in a panel: a title, and a line that says what is there. `entry` is a plain
   * link in the row itself, which looks like the entries beside it and opens nothing.
   */
  kind?: "page" | "entry";
};

/**
 * A link in the navigation menu. Mark the page the reader is on with `active`. For a router's
 * link, pass it as `render`: `<NavigationMenuLink render={<NextLink href="/preise" />}>`.
 */
export function NavigationMenuLink({
  kind = "page",
  className,
  ...props
}: NavigationMenuLinkProps) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={mergeClassName(
        kind === "entry"
          ? navigationMenuEntryVariants()
          : [
              // The concentric radius of the sheet: 12px outside, 8px of padding, 4px left over
              // would read as square, so the row takes the control radius.
              "flex flex-col gap-0.5 rounded-md px-3 py-2.5 text-fg-body",
              "transition-colors duration-150 ease-out hover:bg-hover data-active:bg-tint",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
            ],
        className,
      )}
      {...props}
    />
  );
}

/** The name of the page a row leads to. */
export function NavigationMenuLinkTitle({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-title"
      className={cn("text-control leading-snug font-medium text-fg", className)}
      {...props}
    />
  );
}

/** One line that says what is on that page, without a full stop. */
export function NavigationMenuLinkDescription({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-description"
      className={cn("text-sm text-pretty text-fg-muted", className)}
      {...props}
    />
  );
}
