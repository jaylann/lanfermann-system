import type { ReactNode } from "react";

import { Forms } from "@/slides/forms/forms";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

export type StatementSlideProps = {
  /** The sentence. Three lines at most, broken by hand. */
  children: ReactNode;
  /** A source line at the foot, when the claim rests on one. */
  source?: ReactNode;
  /** The composition. `edge` by default; a second statement in the same deck takes `halo`. */
  forms?: "edge" | "halo";
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
 * The claim on Ink: one sentence at 108px, top left.
 *
 * The kit's loudest slide, so a deck has one or two: the thesis, and perhaps the turn before the
 * ask. The sentence starts top left where every title starts; an indigo half stands on the right
 * edge (the `edge` forms) and the rest of the slide stays empty. No highlighted word, no second
 * sentence in small type. The closing question slide („Fragen?“) is a statement slide too.
 */
export function StatementSlide({
  children,
  source,
  forms = "edge",
  deck,
  page,
  id,
  notes,
}: StatementSlideProps) {
  return (
    <Slide ground="ink" deck={deck} page={page} id={id} notes={notes}>
      <Forms name={forms} />
      <Title size="statement">{children}</Title>
      <Spacer />
      {source != null && <Source>{source}</Source>}
    </Slide>
  );
}
