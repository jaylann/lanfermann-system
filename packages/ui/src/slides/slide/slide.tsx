import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Footer } from "@/slides/footer/footer";
import { Forms } from "@/slides/forms/forms";

/** Who is speaking on a slide. */
export type SlideGround = "paper" | "tint" | "ink" | "indigo";

export type SlideProps = ComponentProps<"section"> & {
  /** Who is speaking. Paper: evidence (default). Tint: someone else's voice. Ink: the claim. Indigo: the ask. */
  ground?: SlideGround;
  /**
   * What the presenter says here. Never drawn on the slide: the player shows it in the
   * presenter's console, and a build for an audience leaves it out.
   */
  notes?: ReactNode;
  /** Deck title for the footer row. Inside a `Deck` it is the deck's own. */
  deck?: ReactNode;
  /** Page number for the footer row. Inside a `Deck` it is counted. */
  page?: ReactNode;
  /** Set false on the cover and the closing slide. */
  footer?: boolean;
  /** Space between the slide's blocks in px, 32 by default (48 on cover and closing). */
  gap?: number;
  /**
   * A composition of forms behind the content: `corner` or `bend` when the evidence starts below
   * y 432, `edge` or `halo` when it ends left of x 1536. Not with tables, charts, diagrams,
   * screenshots or code.
   */
  forms?: "corner" | "bend" | "edge" | "halo";
  /** Title first, then a `Spacer`, then the evidence and its source line. */
  children?: ReactNode;
};

/**
 * The slide frame: a 1920 by 1080 canvas on one ground, with the 128px margins, the 12-column
 * measure and the footer row.
 *
 * Three frames cover every content slide. Stack: title across the top, a `Spacer`, wide evidence
 * on the bottom. Split: title, a `Spacer`, then a `Split` with the evidence beside its reading.
 * Statement: one sentence on Ink, nothing else. The title starts top left and the evidence stands
 * on the bottom margin, so the empty space sits in the middle and not at the foot. Flow content
 * ends at y 920; what does not fit is a second slide, never smaller type.
 */
export function Slide({
  ground = "paper",
  // Read by a player from the element's props, never rendered here.
  notes: _notes,
  deck,
  page,
  footer = true,
  gap = 32,
  forms,
  className,
  style,
  children,
  ...props
}: SlideProps) {
  return (
    <section
      data-slot="slide"
      data-slide-ground={ground}
      className={cn(
        "relative flex h-[1080px] w-[1920px] shrink-0 flex-col overflow-hidden bg-ground px-32 pt-32 pb-40 font-sans text-slide-body text-fg-body",
        className,
      )}
      style={{ gap, ...style }}
      {...props}
    >
      {forms && <Forms name={forms} />}
      {children}
      {footer && <Footer deck={deck} page={page} />}
    </section>
  );
}
