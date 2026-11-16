"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

import { disclosureChevron, disclosurePanel } from "@/internal/disclosure";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";

export type CollapsibleProps = CollapsiblePrimitive.Root.Props;

/**
 * One thing that can be folded away: the optional part of a form ("Weitere Angaben"), the
 * details under a sum. For several rows of the same kind, use an `Accordion`.
 *
 * Name the trigger after what is inside, not after the action: "Weitere Angaben", not
 * "Mehr anzeigen". The chevron already says that it opens.
 */
export function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={mergeClassName("flex flex-col items-start", className)}
      {...props}
    />
  );
}

export type CollapsibleTriggerProps = CollapsiblePrimitive.Trigger.Props;

/**
 * A line of text with a chevron in front that turns down when the panel opens. It is as tall as
 * a control, so it lines up with the fields around it.
 */
export function CollapsibleTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={mergeClassName(
        [
          // The padding is room for the focus outline; the margin takes it back, so the line
          // still starts on the edge of what stands above and below it.
          "group touch-target relative -mx-1.5 inline-flex min-h-(--control-md) items-center gap-1.5 rounded-md px-1.5 text-control font-medium text-fg select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-disabled:pointer-events-none data-disabled:text-on-disabled",
        ],
        className,
      )}
      {...props}
    >
      <ChevronRightGlyph
        data-slot="collapsible-chevron"
        // The glyph's stroke starts 4px inside its box: pulled out, it stands on the edge.
        className={cn(disclosureChevron, "-ml-1 group-data-panel-open:rotate-90")}
      />
      {children}
    </CollapsiblePrimitive.Trigger>
  );
}

export type CollapsiblePanelProps = CollapsiblePrimitive.Panel.Props;

/** What was folded away. It opens on `settle` to its own height and leaves faster than it came. */
export function CollapsiblePanel({ className, children, ...props }: CollapsiblePanelProps) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      className={mergeClassName(
        // The panel clips, so it is a little wider than its content: a field at the edge keeps
        // its focus halo.
        ["-mx-1 h-(--collapsible-panel-height) self-stretch", disclosurePanel],
        className,
      )}
      {...props}
    >
      <div data-slot="collapsible-panel-content" className="px-1 pt-2 pb-1">
        {children}
      </div>
    </CollapsiblePrimitive.Panel>
  );
}
