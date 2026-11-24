import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Forms } from "@/slides/forms/forms";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

export type SectionSlideProps = {
  /** The part's title at 108px, a short sentence or phrase with a full stop. Two lines at most. */
  title: ReactNode;
  /** What this part will show. */
  lead?: ReactNode;
  /** Which part starts, counted from 1. */
  part?: number;
  /**
   * How many parts the deck has, 5 at most. With both, small discs in the top left corner show
   * where the deck is.
   */
  parts?: number;
  /**
   * The composition. `arc` by default; in a deck with several parts the openers may take the
   * rings in turn: `arc`, `halo`, `orbit`.
   */
  forms?: "arc" | "halo" | "orbit";
  /** Deck title for the footer row. Inside a `Deck` it is the deck's own. */
  deck?: ReactNode;
  /** Page number for the footer row. Inside a `Deck` it is counted. */
  page?: ReactNode;
  /** The slide's id. */
  id?: string;
  /** What the presenter says here. Never drawn on the slide. */
  notes?: ReactNode;
};

/**
 * A part opener on Ink: the arc in the corner, the part's title and one sentence on the bottom.
 *
 * Only in decks long enough to have parts (fifteen slides or more). On Ink with a ring: `arc`, an
 * indigo quarter ring around the top right corner with a lavender disc nested in it. A deck with
 * several parts may give each opener its own ring, in the order `arc`, `halo`, `orbit`. No part
 * number, no „Teil 2“, no oversized numeral: a row of 32px discs in the top left corner says
 * where the deck is, filled up to the part that starts and open for the ones to come, the same
 * discs that start the `Agenda` rows. The appendix opens with the same slide, titled „Anhang.“,
 * without the row.
 */
export function SectionSlide({
  title,
  lead,
  part,
  parts,
  forms = "arc",
  deck,
  page,
  id,
  notes,
}: SectionSlideProps) {
  return (
    <Slide ground="ink" deck={deck} page={page} id={id} notes={notes}>
      <Forms name={forms} />
      {part != null && parts != null && part > 0 && parts > 0 && (
        <div
          role="img"
          aria-label={`Teil ${part} von ${parts}`}
          className="absolute top-32 left-32 flex gap-4"
        >
          {Array.from({ length: Math.min(5, parts) }, (_, index) => (
            <span
              key={index}
              className={cn(
                "size-8 rounded-full",
                index < part ? "bg-accent" : "border-2 border-accent",
              )}
            />
          ))}
        </div>
      )}
      <Spacer />
      <Title size="statement">{title}</Title>
      {lead != null && <Lead>{lead}</Lead>}
    </Slide>
  );
}
