"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
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

/** How far the fill stands, from 0 to 1; `null` while the end is not known. */
const ProgressFill = createContext<number | null>(null);

export type ProgressProps = ProgressPrimitive.Root.Props;

/**
 * How far a task has come: an upload, an export, the steps of a setup. The trough fills with
 * Indigo as the value rises. Pass `value={null}` while the end is not known; the fill then runs
 * through the trough. For a wait inside a button, use a `Spinner`; for an amount that is measured
 * and not worked towards (storage, a quota), a `Meter`.
 *
 * Name it: a `ProgressLabel` ("Angebot wird exportiert"), or an `aria-label` when it stands
 * alone. Without children it is the bare track. Pass `locale` so the percentage reads the same on
 * the server and in the browser.
 */
export function Progress({ className, children, ...props }: ProgressProps) {
  const { value, min, max } = props;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={mergeClassName(gaugeRoot, className)}
      {...props}
    >
      <ProgressFill value={value == null ? null : fillFraction(value, min, max)}>
        {children ?? <ProgressTrack />}
      </ProgressFill>
    </ProgressPrimitive.Root>
  );
}

/** Says what is being worked on, in the present tense. */
export function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={mergeClassName(gaugeLabel, className)}
      {...props}
    />
  );
}

/** The value as text, a percentage unless `format` says otherwise. Empty while the end is open. */
export function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={mergeClassName(gaugeValue, className)}
      {...props}
    />
  );
}

/** The trough and its fill. The fill follows the value on `glide`, without bounce. */
export function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  const fill = useContext(ProgressFill);
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={mergeClassName(
        ["relative col-span-2 h-2 not-first:mt-1.5", troughTrack],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        style={fill == null ? undefined : fillStyle(fill)}
        className={[
          troughFill,
          "bg-accent transition-[translate] spring-glide",
          // No known end: a part of the fill runs through; under reduced motion it stays and breathes.
          "data-indeterminate:w-2/5 motion-safe:data-indeterminate:animate-indeterminate",
          "motion-reduce:data-indeterminate:w-full motion-reduce:data-indeterminate:animate-breathe",
        ].join(" ")}
      />
    </ProgressPrimitive.Track>
  );
}
