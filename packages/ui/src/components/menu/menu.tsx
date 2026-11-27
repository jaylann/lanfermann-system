"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { ReactNode } from "react";

import { useGround, useGroundMode } from "@/components/ground/ground";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { ListMark } from "@/internal/list-mark";
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
  const groundMode = useGroundMode();
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
          data-mode={groundMode}
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

type WithTone = {
  /**
   * `danger` for a row that destroys something ("Löschen", "In den Papierkorb"): its words and
   * symbol take the danger colour and its highlight the danger wash. Put it last, under a
   * `MenuSeparator`, and name what it does; the colour alone says nothing.
   */
  tone?: "neutral" | "danger";
};

// The danger row on top of `listItem`: the colour in every state but disabled, and the wash in
// place of the grey highlight (forced colours keep the system's highlight from `listItem`).
const dangerRow =
  "data-[tone=danger]:not-data-disabled:text-danger data-[tone=danger]:data-highlighted:bg-danger-soft";

function RowIcon({ icon }: WithIcon) {
  return icon ? (
    <Icon
      icon={icon}
      size={16}
      className="text-fg-muted group-data-disabled:text-on-disabled group-data-highlighted:text-fg group-data-[tone=danger]:not-group-data-disabled:text-danger"
    />
  ) : null;
}

export function MenuItem({
  className,
  icon,
  tone,
  children,
  ...props
}: MenuPrimitive.Item.Props & WithIcon & WithTone) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-tone={tone === "danger" ? "danger" : undefined}
      className={mergeClassName(["group", listItem, dangerRow], className)}
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
  tone,
  children,
  ...props
}: MenuPrimitive.LinkItem.Props & WithIcon & WithTone) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-item"
      data-tone={tone === "danger" ? "danger" : undefined}
      className={mergeClassName(["group", listItem, dangerRow], className)}
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
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={mergeClassName(["group", listItem], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
      <ListMark kind="multiple" className="ml-auto" />
    </MenuPrimitive.CheckboxItem>
  );
}

export const MenuRadioGroup = MenuPrimitive.RadioGroup;

/** One of several: the chosen one carries the disc at the right. */
export function MenuRadioItem({
  className,
  icon,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props & WithIcon) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={mergeClassName(["group", listItem], className)}
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
  detail,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props &
  WithIcon & {
    /** What the submenu is set to now ("Hell" beside "Erscheinungsbild"): muted, at the right. */
    detail?: ReactNode;
  }) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={mergeClassName(["group", listItem, "data-popup-open:bg-hover"], className)}
      {...props}
    >
      <RowIcon icon={icon} />
      {children}
      {detail !== undefined && (
        <span
          data-slot="menu-sub-trigger-detail"
          className="ml-auto min-w-0 truncate ps-4 text-fg-muted group-data-disabled:text-on-disabled"
        >
          {detail}
        </span>
      )}
      <ChevronRightGlyph
        className={detail === undefined ? "ml-auto text-fg-muted" : "-ml-1 text-fg-muted"}
      />
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
  const groundMode = useGroundMode();
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
          data-mode={groundMode}
          className={mergeClassName([listSheet, popupMotion, "min-w-40"], className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}
