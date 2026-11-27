"use client";

import { MenuRadioGroup, MenuRadioItem } from "@/components/menu/menu";
import { useLocale } from "@/locale/locale";

import type { Theme } from "./theme-mode";
import { themes } from "./theme-switch";

export type ThemeMenuItemsProps = {
  /** The chosen appearance (controlled). */
  value?: Theme;
  /** The appearance chosen at first (uncontrolled). The system's unless said otherwise. */
  defaultValue?: Theme;
  onValueChange?: (theme: Theme) => void;
  /** What the choice is about, for assistive tech. */
  "aria-label"?: string;
  /** The names of the three choices. */
  labels?: Partial<Record<Theme, string>>;
};

/** The names of the three appearances in the page's language, for a row that says the chosen one. */
export function useThemeNames(labels?: Partial<Record<Theme, string>>): Record<Theme, string> {
  const { messages } = useLocale();
  return { ...messages.themeSwitch.themes, ...labels };
}

/**
 * The `ThemeSwitch`'s choice as rows of a menu: the same three appearances with the same symbols
 * and names, the chosen one carrying the disc. For an account menu, where the appearance is one
 * setting among others: put it in a `MenuSubContent` (or straight in a `MenuContent` under a
 * `MenuGroupLabel`), and name the chosen one on the trigger with
 * `<MenuSubTrigger detail={useThemeNames()[theme]}>`. Wire it to the page with `useTheme`, as
 * the switch is.
 */
export function ThemeMenuItems({
  value,
  defaultValue = "system",
  onValueChange,
  "aria-label": label,
  labels,
}: ThemeMenuItemsProps) {
  const { messages } = useLocale();
  const names = useThemeNames(labels);
  return (
    <MenuRadioGroup
      data-slot="theme-menu-items"
      aria-label={label ?? messages.themeSwitch.label}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next: Theme) => onValueChange?.(next)}
    >
      {themes.map((theme) => (
        <MenuRadioItem key={theme.value} value={theme.value} icon={theme.icon}>
          {names[theme.value]}
        </MenuRadioItem>
      ))}
    </MenuRadioGroup>
  );
}
