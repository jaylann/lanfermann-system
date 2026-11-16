import { cva, type VariantProps } from "class-variance-authority";

/**
 * The fitting of a `ButtonGroup`: the face, the edge and the shadow that all its keys share. It
 * moves as one part: under the pointer the whole fitting lifts, under a press it goes down and
 * drops its ambient shadow, whichever key it is. Server-safe, like `buttonVariants`.
 *
 * `--key-hover` and `--key-pressed` are what a key lays over the face (button-group.css has the
 * seams and the corners).
 */
export const buttonGroupVariants = cva(
  [
    "relative inline-flex shrink-0 items-stretch font-medium",
    "transition-[box-shadow,scale] spring-seat",
    // Hover only while nothing is pressed, so the press never competes with it for the shadow.
    "has-[[data-group-key]:hover]:spring-snap has-[[data-group-key]:hover:not(:active)]:depth-raised-hover",
    "has-[[data-group-key]:active]:scale-(--motion-press-scale) has-[[data-group-key]:active]:shadow-pressed has-[[data-group-key]:active]:spring-snap",
    "data-[orientation=vertical]:flex-col",
    // A group that cannot be used is one flat part, like a disabled button.
    "data-disabled:bg-disabled data-disabled:depth-flat",
  ],
  {
    variants: {
      variant: {
        /** The neutral fitting. The default. */
        secondary:
          "bg-raised depth-raised text-fg [--key-hover:var(--color-hover)] [--key-pressed:var(--color-raised-pressed)]",
        /** The committed action with a second way beside it: the dark key, split. */
        primary:
          "bg-key depth-raised text-on-key depth-tone-key [--key-hover:color-mix(in_srgb,currentColor_9%,transparent)] [--key-pressed:var(--color-key-pressed)]",
        /** The ask, split. Indigo, at most once per view. */
        ask: "bg-accent depth-raised text-on-accent depth-tone-accent [--key-hover:color-mix(in_srgb,currentColor_12%,transparent)] [--key-pressed:var(--color-accent-pressed)]",
      },
      size: {
        sm: "rounded-sm text-sm",
        md: "rounded-md text-control",
        lg: "rounded-lg text-control",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;

/**
 * A key that cannot be pressed: a flat patch in the fitting, its label still readable. Left out
 * while a key is loading, which is disabled too but keeps its colour.
 */
export const buttonGroupKeyDisabledLook =
  "data-disabled:bg-disabled data-disabled:text-on-disabled";

/**
 * One key of the fitting. It has no face of its own: the fitting's gloss shows through, a wash
 * marks the key under the pointer, and a press shades only this key, so the fitting rocks on it
 * while the others keep their gloss. On a touch screen its target grows to 44px up and down,
 * never sideways, so two keys never take each other's taps.
 */
export const buttonGroupKeyVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-offset-2 select-none",
    "transition-[background-color,box-shadow] spring-seat hover:bg-(--key-hover) hover:spring-snap",
    "active:bg-(--key-pressed) active:inset-shadow-pressed active:spring-snap",
    // The key that opened a popup stays marked while it is open.
    "data-popup-open:bg-(--key-hover)",
    // With the keyboard on it a key rounds all four corners, so its ring closes around that key.
    "focus-visible:z-1 focus-visible:rounded-[inherit] focus-visible:outline-2 focus-visible:outline-accent",
    "pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
    "data-disabled:pointer-events-none",
  ],
  {
    variants: {
      size: {
        sm: "h-(--control-sm) gap-1.5 px-(--control-pad-sm)",
        md: "h-(--control-md) gap-2 px-(--control-pad-md)",
        lg: "h-(--control-lg) gap-2 px-(--control-pad-lg)",
      },
      /** A square key that holds one icon. */
      iconOnly: { true: "px-0", false: "" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", class: "w-(--control-sm)" },
      { iconOnly: true, size: "md", class: "w-(--control-md)" },
      { iconOnly: true, size: "lg", class: "w-(--control-lg)" },
    ],
    defaultVariants: { size: "md", iconOnly: false },
  },
);
