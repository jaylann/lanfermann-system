"use client";

import { Meter as MeterPrimitive } from "@base-ui/react/meter";
import { createContext, useContext } from "react";

import {
  fillFraction,
  fillStyle,
  gaugeLabel,
  gaugeRoot,
  gaugeValue,
  troughFill,
  troughTrack,
} from "@/internal/trough";
import { mergeClassName } from "@/lib/cn";

/** How far the fill stands, from 0 to 1. */
const MeterFill = createContext(0);

export type MeterProps = MeterPrimitive.Root.Props & {
  /**
   * The colour of the fill. `neutral` (the text colour) only measures. `accent` is Indigo, for
   * the one meter a view is about. `success`, `warning` and `danger` say what the amount means;
   * a colour is never the whole message, so say it in the label or the value as well ("fast
   * voll").
   */
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
};

/**
 * An amount within a known range: storage used, three of five quotes this month. It measures; it
 * does not advance. For a task that is being worked through, use a `Progress`.
 *
 * Name it with a `MeterLabel` or an `aria-label`. `MeterValue` shows a percentage; give it a
 * function to say it in the unit people think in ("3 von 5"). Without children it is the bare
 * track. The value is written in German unless `locale` says otherwise, on the server as in the
 * browser.
 */
export function Meter({
  className,
  children,
  tone = "neutral",
  // Base UI would write in the language of whatever runs it: the server's, then the browser's.
  locale = "de-DE",
  ...props
}: MeterProps) {
  // A value that is no number (`NaN`) measures nothing, as Base UI reports it.
  const fill = Number.isNaN(props.value) ? 0 : fillFraction(props.value, props.min, props.max);
  return (
    <MeterPrimitive.Root
      data-slot="meter"
      data-tone={tone}
      locale={locale}
      className={mergeClassName(["group/meter", gaugeRoot], className)}
      {...props}
    >
      <MeterFill value={fill}>{children ?? <MeterTrack />}</MeterFill>
    </MeterPrimitive.Root>
  );
}

/** Says what is measured. */
export function MeterLabel({ className, ...props }: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      className={mergeClassName(gaugeLabel, className)}
      {...props}
    />
  );
}

/** The amount as text: a percentage, or what the function you pass makes of it. */
export function MeterValue({ className, ...props }: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      className={mergeClassName(gaugeValue, className)}
      {...props}
    />
  );
}

/**
 * The trough and its fill. By default the fill is the text colour, not Indigo: Indigo marks what
 * was chosen or is being done, and a measurement is neither. `tone="accent"` on the `Meter`
 * makes it Indigo where a view wants that one meter to stand out.
 */
export function MeterTrack({ className, ...props }: MeterPrimitive.Track.Props) {
  const fill = useContext(MeterFill);
  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      className={mergeClassName(
        ["relative col-span-2 h-2 not-first:mt-1.5", troughTrack],
        className,
      )}
      {...props}
    >
      <MeterPrimitive.Indicator
        data-slot="meter-indicator"
        style={fillStyle(fill)}
        className={[
          troughFill,
          "bg-fg transition-[translate,background-color] spring-glide",
          "group-data-[tone=accent]/meter:bg-accent group-data-[tone=danger]/meter:bg-danger-solid group-data-[tone=success]/meter:bg-success-solid group-data-[tone=warning]/meter:bg-warning-solid",
        ].join(" ")}
      />
    </MeterPrimitive.Track>
  );
}
