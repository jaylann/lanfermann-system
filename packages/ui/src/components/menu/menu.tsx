"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { useGround } from "@/components/ground/ground";
import { ChevronRightGlyph, TickGlyph } from "@/internal/glyphs";
import { listGroupLabel, listItem, listSeparator, listSheet, popupMotion } from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/** A list of actions or places behind one trigger. */
export const Menu = MenuPrimitive.Root;

export function MenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

export type MenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset">;

/**
 * The sheet. It floats on the long shadow and grows out of its trigger; inside, panel rules apply
 * (lines between groups, no boxes). Items take the concentric radius of the sheet.
 */
export function MenuContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  ...props
}: MenuContentProps) {
  const ground = useGround();
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="menu-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          data-theme={ground}
          className={mergeClassName([listSheet, popupMotion, "min-w-48"], className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={mergeClassName(listItem, className)}
      {...props}
    />
  );
}

/** A place rather than an action: a real link, so it can be opened in a new tab. */
export function MenuLinkItem({ className, ...props }: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-item"
      className={mergeClassName(listItem, className)}
      {...props}
    />
  );
}

/** An option that is on or off. The menu stays open, so several can be set in one go. */
export function MenuCheckboxItem({
  className,
  children,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={mergeClassName(listItem, className)}
      {...props}
    >
      <span aria-hidden className="flex size-3 shrink-0 items-center justify-center text-accent">
        <MenuPrimitive.CheckboxItemIndicator data-slot="menu-item-indicator">
          <TickGlyph />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export const MenuRadioGroup = MenuPrimitive.RadioGroup;

/** One of several: the chosen one carries the disc. */
export function MenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={mergeClassName(["group", listItem], className)}
      {...props}
    >
      <span aria-hidden className="flex size-3 shrink-0 items-center justify-center">
        <span className="mark mark-quiet group-data-checked:mark-on" />
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={mergeClassName(listSeparator, className)}
      {...props}
    />
  );
}

export const MenuGroup = MenuPrimitive.Group;

export function MenuGroupLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="menu-group-label"
      className={mergeClassName(listGroupLabel, className)}
      {...props}
    />
  );
}

/** A menu inside a menu. One level is the limit: deeper and people lose their way. */
export const MenuSub = MenuPrimitive.SubmenuRoot;

export function MenuSubTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={mergeClassName([listItem, "data-popup-open:bg-hover"], className)}
      {...props}
    >
      {children}
      <ChevronRightGlyph className="ml-auto text-fg-muted" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

/** The submenu's sheet. It overlaps its parent by the sheet's padding, so the rows line up. */
export function MenuSubContent({
  className,
  sideOffset = -4,
  alignOffset = -4,
  ...props
}: MenuContentProps) {
  const ground = useGround();
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="menu-positioner"
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          data-theme={ground}
          className={mergeClassName([listSheet, popupMotion, "min-w-40"], className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}
