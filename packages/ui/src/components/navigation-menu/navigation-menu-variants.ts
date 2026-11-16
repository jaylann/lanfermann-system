import { cva, type VariantProps } from "class-variance-authority";

/**
 * The look of an entry in the row of a navigation menu, as class names. It lives outside the
 * client component so a plain link in the row can wear the look of a trigger:
 *
 *   <NavigationMenuLink kind="entry" href="/preise">Preise</NavigationMenuLink>
 *
 * An entry is quiet: no face, no shadow. It takes the hover wash, and keeps it while its panel is
 * open.
 */
export const navigationMenuEntryVariants = cva([
  "group/entry inline-flex h-(--control-md) items-center gap-1.5 rounded-md px-3 text-control font-medium whitespace-nowrap text-fg-body select-none",
  "transition-colors duration-150 ease-out hover:bg-hover hover:text-fg data-popup-open:bg-hover data-popup-open:text-fg",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "data-active:text-fg data-disabled:pointer-events-none data-disabled:text-on-disabled",
]);

export type NavigationMenuEntryVariants = VariantProps<typeof navigationMenuEntryVariants>;
