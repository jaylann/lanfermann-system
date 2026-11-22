"use client";

import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectProps,
  SelectTrigger,
  type SelectTriggerProps,
} from "@/components/select/select";
import { cn } from "@/lib/cn";

import type { Theme } from "./theme-mode";

export type { Theme };

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

type Choice = {
  /** The chosen appearance (controlled). */
  value?: Theme;
  /** The appearance chosen at first (uncontrolled). The system's unless said otherwise. */
  defaultValue?: Theme;
  onValueChange?: (theme: Theme) => void;
  /** What the control is about, for assistive tech. */
  "aria-label"?: string;
  /** The names of the three choices: what is read, and what is said where only a symbol shows. */
  labels?: Partial<Record<Theme, string>>;
  id?: string;
  className?: string;
};

type AsSelect = Choice &
  Pick<SelectProps<Theme>, "open" | "defaultOpen" | "onOpenChange" | "modal"> & {
    /**
     * `select` names the choice in one control and opens the three as a list: it takes a
     * button's room, in a site's bar or footer. `segmented` lays the three out as symbols in a
     * round trough: all in sight, each one press away.
     */
    variant?: "select";
    /** The size of the select's trigger. */
    size?: SelectTriggerProps["size"];
  };

type AsSegments = Choice & {
  variant: "segmented";
  /**
   * Writes the names beside the symbols. For a settings page, where there is room; elsewhere
   * the three symbols are enough.
   */
  withLabels?: boolean;
};

export type ThemeSwitchProps = AsSelect | AsSegments;

/**
 * The choice between the system's appearance, light and dark. Two forms of the same choice: a
 * select that shows the chosen one by symbol and name, and three symbols in a round trough whose
 * thumb travels to the chosen one.
 *
 * It is the control only: it holds a choice and reports it (`onValueChange`). `useTheme` keeps
 * the choice and turns the page, and `ThemeScript` in the <head> sets the mode before the first
 * paint:
 *
 *   const { theme, setTheme } = useTheme();
 *   <ThemeSwitch value={theme} onValueChange={setTheme} />
 */
export function ThemeSwitch(props: ThemeSwitchProps) {
  return props.variant === "segmented" ? <ThemeSegments {...props} /> : <ThemeSelect {...props} />;
}

function ThemeSelect({
  variant: _variant,
  value,
  defaultValue = "system",
  onValueChange,
  "aria-label": label = "Erscheinungsbild",
  labels,
  size,
  id,
  className,
  ...root
}: AsSelect) {
  const items = useMemo(
    () =>
      themes.map((theme) => ({
        value: theme.value,
        label: labels?.[theme.value] ?? defaultLabels[theme.value],
        icon: theme.icon,
      })),
    [labels],
  );
  return (
    <Select<Theme>
      items={items}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      // There is always one chosen: the list has no entry for none.
      onValueChange={(next) => {
        if (next !== null) onValueChange?.(next);
      }}
      {...root}
    >
      {/* As wide as its longest name needs, so the bar around it does not move with the choice. */}
      <SelectTrigger id={id} aria-label={label} size={size} className={cn("min-w-32", className)} />
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ThemeSegments({
  variant: _variant,
  value,
  defaultValue = "system",
  onValueChange,
  "aria-label": label = "Erscheinungsbild",
  labels,
  withLabels = false,
  id,
  className,
}: AsSegments) {
  const names = { ...defaultLabels, ...labels };
  return (
    // No marks: each symbol is its segment's mark. It keeps the segmented control's own slot,
    // by which the stylesheet finds the control.
    <SegmentedControl
      id={id}
      shape="round"
      marks={false}
      aria-label={label}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => onValueChange?.(next as Theme)}
      className={className}
    >
      {themes.map((theme) =>
        withLabels ? (
          <Segment key={theme.value} value={theme.value} className="px-3.5">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={theme.icon} size={16} />
              {names[theme.value]}
            </span>
          </Segment>
        ) : (
          // A symbol alone stands in a circle: the thumb under it is as wide as it is tall.
          <Segment
            key={theme.value}
            value={theme.value}
            aria-label={names[theme.value]}
            className="w-(--control-md) px-0"
          >
            <Icon icon={theme.icon} size={16} />
          </Segment>
        ),
      )}
    </SegmentedControl>
  );
}
