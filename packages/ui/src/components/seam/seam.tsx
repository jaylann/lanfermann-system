import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/cn";

import { type SeamDirection, seamHalfWidth, seamLift, seamOutline } from "./seam-outline";

const seamVariants = cva(
  [
    "pointer-events-none relative z-1 h-0",
    // The tongue is as wide as the page's content column, and never reaches into its gutter.
    "[--seam-half:36rem]",
    // The shape shrinks on a phone; the gutter is the Container's.
    "[--seam-gutter:1.25rem] [--seam-scale:0.7] sm:[--seam-gutter:2rem] sm:[--seam-scale:1]",
  ],
  {
    variants: {
      direction: {
        /** The plate above dips into the part below as a tongue. */
        down: "",
        /** The plate above has a notch, and the part below rises into it. */
        up: "",
      },
      /** The colour of the part above: the plate's face. */
      above: {
        ground: "[--seam-face:var(--lf-ground)]",
        well: "[--seam-face:var(--lf-well)]",
        surface: "[--seam-face:var(--lf-surface)]",
      },
      /** The colour of the part below: a notch (`up`) reaches above the seam and shows it there. */
      below: {
        ground: "[--seam-below:var(--lf-ground)]",
        well: "[--seam-below:var(--lf-well)]",
        surface: "[--seam-below:var(--lf-surface)]",
      },
    },
    defaultVariants: { direction: "down", above: "ground", below: "ground" },
  },
);

export type SeamProps = Omit<ComponentProps<"div">, "children"> & VariantProps<typeof seamVariants>;

const layer = "absolute inset-0";

/*
 * The plate's edge is three copies of one outline, stacked: the edge colour moved 1px down, the
 * face tinted with the inner shade, and the face moved 1px up. What shows of each lower copy is
 * the strip the copy above it leaves uncovered: the shade inside the edge, then the edge, as on a
 * raised button. The tinted copy keeps the face's colour under its tint, so it stays opaque.
 */
const layers = [
  "translate-y-px bg-(--depth-seam-edge) forced-colors:bg-[color:CanvasText]",
  "bg-(--seam-face) bg-[linear-gradient(var(--depth-seam-lo),var(--depth-seam-lo))]",
  "-translate-y-px bg-(--seam-face) forced-colors:bg-[color:Canvas]",
];

/**
 * Where one section of a website ends and the next begins, drawn as the edge of two plates: the
 * plate above lies on the part below and throws a short shadow onto it. Across the content column
 * its edge dips down as a tongue (`direction="down"`) or rises as a notch (`"up"`); choose per
 * seam, by what the sections say. Put it between two `Section`s, in place of the rule that would
 * open the second. It takes no room: it is drawn into the padding of the sections around it.
 *
 * Seams go with sections that alternate between the ground and the well (`bg-well` on every other
 * one), so the two plates really differ. Tell the seam both colours: `above` fills the plate's
 * face, `below` what shows in a notch. The page's closing (a `Cta`) needs none: its block closes
 * the page by itself. It is decoration and is hidden from assistive technology: the sections carry
 * the structure.
 */
export function Seam({ direction, above, below, className, style, ...props }: SeamProps) {
  const way: SeamDirection = direction ?? "down";
  const clip: CSSProperties = { clipPath: seamOutline[way] };
  return (
    <div
      aria-hidden
      data-slot="seam"
      data-direction={way}
      className={cn(seamVariants({ direction, above, below }), className)}
      style={{ "--seam-w": seamHalfWidth, ...style } as CSSProperties}
      {...props}
    >
      {/* The strip starts at the band above the edge and clips whatever spills above it. */}
      <div
        data-slot="seam-strip"
        className="absolute inset-x-0 h-16 overflow-hidden"
        style={{ top: seamLift[way] }}
      >
        {/* Under the plate, the part below: it fills a notch that rises above the seam. Outside
            the shadow's filter, which would otherwise take the whole strip for the plate. */}
        {way === "up" && (
          <div className={cn(layer, "bg-(--seam-below) forced-colors:bg-[color:Canvas]")} />
        )}
        <div data-slot="seam-plate" className={cn(layer, "depth-seam")}>
          {layers.map((look) => (
            <div key={look} style={clip} className={cn(layer, look)} />
          ))}
        </div>
      </div>
    </div>
  );
}
