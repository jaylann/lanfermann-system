"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import type { ReactNode } from "react";

import { disclosureChevron, disclosurePanel, disclosureUnfold } from "@/internal/disclosure";
import { ChevronDownGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";

export type AccordionProps = AccordionPrimitive.Root.Props & {
  /**
   * No wash under the pointer: the lines stay and only the chevron answers. For a page where the
   * accordion should recede, such as a docs page dense with other rows.
   */
  quiet?: boolean;
};

/**
 * Questions with their answers, or the sections of a long page that are read one at a time. One
 * item is open at a time; `multiple` lets several stay open, for sections that are compared.
 *
 * Word each row as the question a customer would ask ("Was kostet eine Website?"). Do not hide
 * what everybody needs behind a row: an accordion is for the second look. `hiddenUntilFound`
 * lets the browser's page search open the row that holds the match.
 *
 * A list of things that each open (integrations, accounts) stands in a `Card`: put the accordion
 * straight in the card, not in a `CardContent`. There the card's edge holds it: the lines run
 * from edge to edge, the rows' text stands 20px in as a `CardBar`'s does, the washes fill their
 * rows, and neither the card's edge, a `CardBar` above nor a `CardFooter` below gets a second
 * line. In a `CardContent` it stays the block it is on a page.
 */
export function Accordion({ className, quiet = false, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      data-quiet={quiet || undefined}
      // Structure by line: hairlines open the block and divide the rows. The lines and the washes
      // are drawn in styles/accordion.css.
      className={mergeClassName("flex w-full flex-col", className)}
      {...props}
    />
  );
}

export type AccordionItemProps = AccordionPrimitive.Item.Props;

/** One row with its panel. Give it a `value` to open it at first or to control it. */
export function AccordionItem({ className, ...props }: AccordionItemProps) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={className} {...props} />;
}

export type AccordionTriggerProps = AccordionPrimitive.Trigger.Props & {
  /** The heading level of the row, so it fits the outline of the page it stands on. */
  level?: 2 | 3 | 4 | 5 | 6;
  /**
   * A symbol in front of the title: an `IconTile` (40px, or `size="sm"`). It is decoration, the
   * name stands in the title. The answer then starts under the title, not under the symbol.
   */
  media?: ReactNode;
  /** One muted line under the title that says what the row holds. */
  description?: ReactNode;
  /**
   * What the row reports, before the chevron: a `Badge`, a count. It is part of the button's
   * name, so word it to be read after the title. In a row narrower than 24rem it moves under
   * the description instead of squeezing the title.
   */
  trailing?: ReactNode;
};

/**
 * The row: a heading that is a button. The chevron stays on the first line of a long question
 * and turns when the panel opens.
 *
 * With `media`, `description` or `trailing` it is a row of a list: a symbol, a name with a line
 * under it and a state, as an integration in the settings. The children stay the title.
 */
export function AccordionTrigger({
  className,
  children,
  level = 3,
  media,
  description,
  trailing,
  ...props
}: AccordionTriggerProps) {
  const Heading = `h${level}` as const;
  const listRow = media != null || description != null || trailing != null;
  const chevron = (
    <ChevronDownGlyph
      data-slot="accordion-chevron"
      // It points down, and up once it has turned: it leans that way.
      className={cn(
        disclosureChevron,
        "[--lean:0_var(--motion-lean)] group-data-panel-open:rotate-180 group-data-panel-open:[--lean:0_calc(var(--motion-lean)*-1)]",
      )}
    />
  );
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      render={<Heading />}
      // A list row asks its own width where its state goes.
      className={cn("flex", listRow && "@container/accordion-row")}
    >
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        data-list-row={listRow ? "" : undefined}
        className={mergeClassName(
          [
            // The wash under the pointer is the trigger's ::before (styles/accordion.css). The
            // gutter is the accordion's: 12px on a page, the card's 20px in a card.
            "group touch-target relative min-h-(--control-lg) w-full rounded-md px-(--accordion-gutter) py-3 text-left text-base font-medium text-fg select-none",
            listRow
              ? // Four columns; one that holds nothing takes no room. The symbol and the chevron
                // are centred on the title and its line, also when the state stands below them.
                "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center"
              : "flex items-start gap-4",
            "focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "data-disabled:pointer-events-none data-disabled:text-on-disabled",
          ],
          className,
        )}
        {...props}
      >
        {listRow ? (
          <>
            {media != null && (
              <span
                data-slot="accordion-trigger-media"
                className="col-start-1 row-start-1 me-3 flex shrink-0"
              >
                {media}
              </span>
            )}
            <span
              data-slot="accordion-trigger-label"
              className="col-start-2 row-start-1 flex min-w-0 flex-col @max-sm/accordion-row:col-span-2"
            >
              <span data-slot="accordion-trigger-title">{children}</span>
              {description != null && (
                <span
                  data-slot="accordion-trigger-description"
                  className="text-sm font-normal text-fg-muted group-data-disabled:text-on-disabled"
                >
                  {description}
                </span>
              )}
            </span>
            {trailing != null && (
              <span
                data-slot="accordion-trigger-trailing"
                className={cn(
                  "col-start-3 row-start-1 ms-4 flex shrink-0 items-center gap-2 text-sm font-normal text-fg-muted",
                  "@max-sm/accordion-row:col-span-2 @max-sm/accordion-row:col-start-2 @max-sm/accordion-row:row-start-2 @max-sm/accordion-row:ms-0 @max-sm/accordion-row:mt-2 @max-sm/accordion-row:justify-self-start",
                )}
              >
                {trailing}
              </span>
            )}
            <span aria-hidden className="col-start-4 row-start-1 ms-4 flex shrink-0 items-center">
              {chevron}
            </span>
          </>
        ) : (
          <>
            <span data-slot="accordion-trigger-label" className="min-w-0 flex-1">
              {children}
            </span>
            <span aria-hidden className="flex h-lh shrink-0 items-center">
              {chevron}
            </span>
          </>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export type AccordionPanelProps = AccordionPrimitive.Panel.Props;

/**
 * The answer. It opens on `settle` to its own height and unfolds, and leaves faster than it came.
 */
export function AccordionPanel({ className, children, ...props }: AccordionPanelProps) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-panel"
      className={mergeClassName(
        ["h-(--accordion-panel-height) text-base text-fg-body", disclosurePanel, disclosureUnfold],
        className,
      )}
      {...props}
    >
      {/* The padding keeps a focus outline inside the panel, which clips. The text starts under
          the row's title: past its symbol, where it has one (`--accordion-indent`). */}
      <div
        data-slot="accordion-panel-content"
        className="ps-[calc(var(--accordion-gutter)+var(--accordion-indent))] pe-(--accordion-gutter) pt-0.5 pb-4"
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}
