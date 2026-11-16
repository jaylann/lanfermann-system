"use client";

import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import {
  Segment,
  SegmentedControl,
  type SegmentedControlProps,
} from "@/components/segmented-control/segmented-control";

/** How a site should look: as the system says, light, or dark. */
export type Theme = "system" | "light" | "dark";

const themes: readonly { value: Theme; icon: IconSvgElement }[] = [
  { value: "system", icon: ComputerIcon },
  { value: "light", icon: Sun03Icon },
  { value: "dark", icon: Moon02Icon },
];

const defaultLabels: Record<Theme, string> = {
  system: "System",
  light: "Hell",
  dark: "Dunkel",
};

export type ThemeSwitchProps = Omit<
  SegmentedControlProps,
  "value" | "defaultValue" | "onValueChange" | "children" | "shape" | "aria-label"
> & {
  /** The chosen appearance (controlled). */
  value?: Theme;
  /** The appearance chosen at first (uncontrolled). The system's unless said otherwise. */
  defaultValue?: Theme;
  onValueChange?: (theme: Theme) => void;
  /** What the control is about, for assistive tech. */
  "aria-label"?: string;
  /** The names of the three choices: each segment's name, and its words with `withLabels`. */
  labels?: Partial<Record<Theme, string>>;
  /**
   * Writes the names beside the symbols. For a settings page, where there is room; in a site's
   * bar the three symbols are enough.
   */
  withLabels?: boolean;
};

/**
 * The choice between the system's appearance, light and dark, as three symbols in one trough:
 * the thumb travels to the chosen one with the weight of every segmented thumb.
 *
 * It is the control only. It holds a choice and reports it (`onValueChange`); it does not
 * remember the choice, read the system's setting or change the page. The app does that: it sets
 * `data-theme="paper"` or `"ink"` on `<html>`, and for `system` follows
 * `prefers-color-scheme`.
 */
export function ThemeSwitch({
  value,
  defaultValue = "system",
  onValueChange,
  "aria-label": label = "Erscheinungsbild",
  labels,
  withLabels = false,
  ...props
}: ThemeSwitchProps) {
  const names = { ...defaultLabels, ...labels };
  return (
    // It keeps the segmented control's own slot: the stylesheet finds the control by it.
    <SegmentedControl
      aria-label={label}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => onValueChange?.(next as Theme)}
      {...props}
    >
      {themes.map((theme) => (
        <Segment
          key={theme.value}
          value={theme.value}
          aria-label={withLabels ? undefined : names[theme.value]}
        >
          {withLabels ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={theme.icon} size={16} />
              {names[theme.value]}
            </span>
          ) : (
            <Icon icon={theme.icon} size={16} />
          )}
        </Segment>
      ))}
    </SegmentedControl>
  );
}
