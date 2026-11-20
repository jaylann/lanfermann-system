"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { useGround } from "@/components/ground/ground";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { listChosen, ListMark, useListMarking } from "@/internal/list-mark";
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

/**
 * A 16px symbol before a row's words, muted, darkening with the row's highlight. Give every row
 * of a group one or none, so the words start on one line.
 */
type WithIcon = { icon?: IconSvgElement };

function RowIcon({ icon }: WithIcon) {
  return icon ? (
    <Icon
      icon={icon}
      size={16}
      className="text-fg-muted group-data-disabled:text-on-disabled group-data-highlighted:text-fg"
    />
  ) : null;
}

export function MenuItem({
  className,
  icon,
  children,
  ...props
}: MenuPrimitive.Item.Props & WithIcon) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={mergeClassName(["group", listItem], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
    </MenuPrimitive.Item>
  );
}

/** A place rather than an action: a real link, so it can be opened in a new tab. */
export function MenuLinkItem({
  className,
  icon,
  children,
  ...props
}: MenuPrimitive.LinkItem.Props & WithIcon) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-item"
      className={mergeClassName(["group", listItem], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
    </MenuPrimitive.LinkItem>
  );
}

/**
 * An option that is on or off. The menu stays open, so several can be set in one go. Its words
 * start at the row's edge like every other row's; when it is on, the tick stands at the right.
 */
export function MenuCheckboxItem({
  className,
  icon,
  children,
  ...props
}: MenuPrimitive.CheckboxItem.Props & WithIcon) {
  const { marking } = useListMarking();
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={mergeClassName(["group", listItem, listChosen[marking]], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
      <ListMark kind="multiple" className="ml-auto" />
    </MenuPrimitive.CheckboxItem>
  );
}

export const MenuRadioGroup = MenuPrimitive.RadioGroup;

/** One of several: the chosen one carries the mark at the right. */
export function MenuRadioItem({
  className,
  icon,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props & WithIcon) {
  const { marking } = useListMarking();
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={mergeClassName(["group", listItem, listChosen[marking]], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
      <ListMark className="ml-auto" />
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
  icon,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & WithIcon) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={mergeClassName(["group", listItem, "data-popup-open:bg-hover"], className)}
      {...props}
    >
      <RowIcon icon={icon} />
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
