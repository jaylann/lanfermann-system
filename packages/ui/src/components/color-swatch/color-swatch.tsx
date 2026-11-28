"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { createContext, type CSSProperties, useContext } from "react";

import { TickGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";
import { type ColorTone, colorTone } from "@/lib/color";
import { useLocale } from "@/locale/locale";

/** How large the swatches of a group are: the height of a control of that size. */
export type ColorSwatchSize = "sm" | "md" | "lg";

/**
 * How a swatch is cut. `socket` (the default): a disc of the colour lying in a socket ring,
 * which it fills when it is chosen, as a `Radio`'s disc does. `raised`: a round fitting in the
 * colour, lit from above, which goes down under a press.
 */
export type ColorSwatchLook = "socket" | "raised";

const SwatchContext = createContext<{ size: ColorSwatchSize; look: ColorSwatchLook }>({
  size: "md",
  look: "socket",
});

export type ColorSwatchGroupProps = RadioGroupPrimitive.Props<string> & {
  /** The size of every swatch, from the density. */
  size?: ColorSwatchSize;
  /** How the swatches are cut. */
  look?: ColorSwatchLook;
};

/**
 * One colour out of a palette: the colour of a label, a code, a chart's line. It is a radio
 * group: the arrow keys move the choice, `name` submits the chosen swatch's value, and
 * `value` / `defaultValue` / `onValueChange` hold it.
 *
 * Name the group with an `aria-label` or `aria-labelledby` that says what is coloured
 * ("Farbe des Codes"); without one it is called "Farbe". Keep a palette to a row or two, and
 * offer a `ColorField` beside it where any colour may be taken.
 */
export function ColorSwatchGroup({
  size = "md",
  look = "socket",
  className,
  ...props
}: ColorSwatchGroupProps) {
  const { messages } = useLocale();
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <SwatchContext value={{ size, look }}>
      <RadioGroupPrimitive
        data-slot="color-swatch-group"
        data-size={size}
        data-look={look}
        aria-label={named ? undefined : messages.colorSwatchGroup.label}
        // On a touch screen every swatch has a 44px target; the wider gap keeps them apart.
        className={mergeClassName("flex flex-wrap gap-2 pointer-coarse:gap-3", className)}
        {...props}
      />
    </SwatchContext>
  );
}

const swatchSize: Record<ColorSwatchSize, string> = {
  sm: "size-(--control-sm)",
  md: "size-(--control-md)",
  lg: "size-(--control-lg)",
};

/** What carries the swatch: the socket's ring, or nothing under a fitting. */
const swatchRing: Record<ColorSwatchLook, string> = {
  socket: "bg-surface depth-socket",
  raised: "",
};

/**
 * The disc of colour. In a socket it lies 3px inside the ring, comes a little closer under the
 * pointer and fills the ring once chosen. As a fitting it wears a key's depth in its own hue.
 */
const swatchDisc: Record<ColorSwatchLook, string> = {
  socket: [
    "scale-[0.8] group-hover:scale-[0.88] group-data-checked:scale-100",
    "group-data-disabled:scale-[0.8]",
  ].join(" "),
  raised: [
    "depth-raised depth-tone-swatch group-hover:depth-raised-hover",
    "group-active:depth-pressed group-data-checked:depth-plug",
    "group-data-disabled:scale-[0.8] group-data-disabled:depth-none",
  ].join(" "),
};

/**
 * The tick is black or white, whichever reads on the colour: these two are not tokens of a
 * ground, they belong to the swatch's own colour and stay the same in dark mode.
 */
const tickTone: Record<ColorTone, string> = { light: "text-black", dark: "text-white" };

/**
 * For a colour the script cannot read (a custom property) and no `tone`: the browser derives
 * black or white from the colour's lightness, also when the property changes with the theme.
 * Where relative colours are not supported the declaration is dropped and the tick stays white.
 */
const TICK_FROM_COLOR = "oklch(from var(--swatch) calc((0.62 - l) * 1000) 0 0)";

export type ColorSwatchProps = Omit<RadioPrimitive.Root.Props, "children" | "value" | "style"> & {
  /** The colour: a value (`#5b4fcf`) or a custom property (`var(--brand)`). */
  color: string;
  /** The colour's name for assistive tech: "Indigo", not "#5b4fcf". */
  label: string;
  /** What the group reports, and a form receives, when this swatch is chosen. The colour if left out. */
  value?: string;
  /**
   * Whether the colour is light or dark, which decides the tick: dark on `light`, white on
   * `dark`. A hex colour is measured; say it for a custom property whose colour you know.
   */
  tone?: ColorTone;
  style?: CSSProperties;
};

/**
 * One colour of a `ColorSwatchGroup`. The chosen one carries a tick, never colour alone, and
 * every swatch keeps a hairline inside its rim, so white still has an edge on Paper and black
 * on a dark ground.
 */
export function ColorSwatch({
  color,
  label,
  value,
  tone,
  className,
  style,
  ...props
}: ColorSwatchProps) {
  const { size, look } = useContext(SwatchContext);
  const known = tone ?? colorTone(color);
  return (
    <RadioPrimitive.Root
      data-slot="color-swatch"
      aria-label={label}
      value={value ?? color}
      // The colour travels as a property: the disc, its edge and its shadows are drawn from it.
      style={{ "--swatch": color, ...style } as CSSProperties}
      className={mergeClassName(
        [
          "group touch-target relative inline-flex shrink-0 items-center justify-center rounded-full",
          swatchSize[size],
          swatchRing[look],
          "transition-[box-shadow,background-color,scale] spring-seat hover:spring-snap active:scale-[0.92] active:spring-snap",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-disabled:pointer-events-none data-disabled:bg-disabled data-disabled:depth-flat",
        ],
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="color-swatch-disc"
        keepMounted
        style={known === undefined ? { color: TICK_FROM_COLOR } : undefined}
        className={cn(
          // A colour is content, not chrome: forced colours must not repaint it.
          "flex size-full items-center justify-center rounded-full bg-(--swatch) inset-ring inset-ring-hairline forced-color-adjust-none",
          "transition-[box-shadow,scale] spring-seat group-hover:spring-snap group-active:spring-snap",
          tickTone[known ?? "dark"],
          swatchDisc[look],
        )}
      >
        {/* As in a checkbox: the tick draws in (short leg first) and simply fades out. */}
        <TickGlyph
          className={cn(
            "opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-checked:opacity-100 group-data-checked:[stroke-dashoffset:0]",
            size === "lg" && "size-3.5",
          )}
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}
