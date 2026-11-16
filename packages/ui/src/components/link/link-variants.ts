import { cva, type VariantProps } from "class-variance-authority";

/**
 * The look of a text link as class names. It lives outside the component so a router's own link
 * can wear it without being wrapped:
 *
 *   <NextLink href="/angebote" className={linkVariants()}>Alle Angebote</NextLink>
 *
 * A link is underlined as well as coloured: colour alone never says "this is a link".
 */
export const linkVariants = cva(
  [
    "rounded-xs underline decoration-1 underline-offset-[0.25em]",
    "transition-colors spring-snap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  ],
  {
    variants: {
      variant: {
        /** Indigo: the link in running text, in a form, at the end of a card. */
        accent: "font-medium text-accent hover:text-accent-hover active:text-accent-pressed",
        /**
         * The colour and weight of the text around it, for a link inside muted text (a helper
         * line, a legal line) where Indigo would shout. It darkens to the text colour on hover.
         */
        quiet: "text-inherit hover:text-fg",
      },
    },
    defaultVariants: { variant: "accent" },
  },
);

export type LinkVariants = VariantProps<typeof linkVariants>;
