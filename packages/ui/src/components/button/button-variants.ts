import { cva, type VariantProps } from "class-variance-authority";

/**
 * The look of a button as class names. It lives outside the client component so Server Components
 * can call it, e.g. for a link that should look like a button:
 *
 *   <a href="/angebot" className={buttonVariants({ variant: "primary" })}>Angebot ansehen</a>
 *
 * (A link keeps its own semantics; do not render one through `Button`.)
 */
export const buttonVariants = cva(
  [
    "touch-target relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none",
    // The resting transition is the release; hover and press bring their own, faster spring.
    "transition-[box-shadow,background-color,color,scale] spring-seat",
    "hover:spring-snap active:scale-(--motion-press-scale) active:spring-snap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "data-disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        /** The committed action of a view: the dark key. */
        primary:
          "bg-key depth-raised text-on-key depth-tone-key hover:bg-key-hover hover:depth-raised-hover active:bg-key-pressed active:depth-pressed",
        /** Everything else that deserves a visible button. The default. */
        secondary:
          "bg-raised depth-raised text-fg hover:depth-raised-hover active:bg-raised-pressed active:depth-pressed",
        /** An action that should not compete: toolbars, rows, cancel. */
        quiet: "text-fg hover:bg-hover active:bg-hover",
        /** The ask. Indigo, at most once per view. */
        ask: "bg-accent depth-raised text-on-accent depth-tone-accent hover:bg-accent-hover hover:depth-raised-hover active:bg-accent-pressed active:depth-pressed",
        /** Confirms something irreversible. Only where the danger is real. */
        danger:
          "bg-danger-solid depth-raised text-on-danger depth-tone-danger hover:depth-raised-hover active:depth-pressed",
      },
      size: {
        sm: "h-(--control-sm) gap-1.5 rounded-sm px-(--control-pad-sm) text-sm",
        md: "h-(--control-md) gap-2 rounded-md px-(--control-pad-md) text-control",
        lg: "h-(--control-lg) gap-2 rounded-lg px-(--control-pad-lg) text-control",
      },
      /** A square button that holds one icon. */
      iconOnly: { true: "px-0", false: "" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", class: "w-(--control-sm)" },
      { iconOnly: true, size: "md", class: "w-(--control-md)" },
      { iconOnly: true, size: "lg", class: "w-(--control-lg)" },
    ],
    defaultVariants: { variant: "secondary", size: "md", iconOnly: false },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * What a button looks like when it cannot be used: no gloss, no shadow, muted label. Left out
 * while a button is loading, which is disabled too but should keep its colour.
 */
export const buttonDisabledLook = {
  primary: "data-disabled:bg-disabled data-disabled:text-on-disabled data-disabled:depth-flat",
  secondary: "data-disabled:bg-disabled data-disabled:text-on-disabled data-disabled:depth-flat",
  quiet: "data-disabled:text-on-disabled",
  ask: "data-disabled:bg-disabled data-disabled:text-on-disabled data-disabled:depth-flat",
  danger: "data-disabled:bg-disabled data-disabled:text-on-disabled data-disabled:depth-flat",
} as const;
