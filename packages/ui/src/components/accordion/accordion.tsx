"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

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
};

/**
 * The row: a heading that is a button. The chevron stays on the first line of a long question
 * and turns when the panel opens.
 */
export function AccordionTrigger({
  className,
  children,
  level = 3,
  ...props
}: AccordionTriggerProps) {
  const Heading = `h${level}` as const;
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" render={<Heading />} className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={mergeClassName(
          [
            // The wash under the pointer is the trigger's ::before (styles/accordion.css).
            "group touch-target relative flex min-h-(--control-lg) w-full items-start gap-4 rounded-md px-3 py-3 text-left text-base font-medium text-fg select-none",
            "focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "data-disabled:pointer-events-none data-disabled:text-on-disabled",
          ],
          className,
        )}
        {...props}
      >
        <span data-slot="accordion-trigger-label" className="min-w-0 flex-1">
          {children}
        </span>
        <span aria-hidden className="flex h-lh shrink-0 items-center">
          <ChevronDownGlyph
            data-slot="accordion-chevron"
            // It points down, and up once it has turned: it leans that way.
            className={cn(
              disclosureChevron,
              "[--lean:0_var(--motion-lean)] group-data-panel-open:rotate-180 group-data-panel-open:[--lean:0_calc(var(--motion-lean)*-1)]",
            )}
          />
        </span>
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
      {/* The padding keeps a focus outline inside the panel, which clips. */}
      <div data-slot="accordion-panel-content" className="px-3 pt-0.5 pb-4">
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}
