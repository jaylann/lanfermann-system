import type { ReactNode } from "react";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

export type ReferencesSlideProps = {
  /** The slide title. „Quellen.“ by default. */
  title?: ReactNode;
  /** One row per source, in the order the deck cites them. Eight rows a slide. */
  items: Array<{ by: ReactNode; title: ReactNode; year: ReactNode }>;
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
 * The list of sources: publisher, title, year.
 *
 * The last slide of the appendix, always on Paper. Every source line in the deck has its full
 * entry here, so the short form on the slide („Quelle: BrightLocal, Local Consumer Review Survey
 * 2024“) can stay short. Own measurements are listed too, with their date and method as the
 * title.
 */
export function ReferencesSlide({
  title = "Quellen.",
  items,
  deck,
  page,
  id,
  notes,
}: ReferencesSlideProps) {
  return (
    <Slide deck={deck} page={page} id={id} notes={notes}>
      <Title>{title}</Title>
      <Spacer />
      <ul data-slot="slide-references" className="flex flex-col text-slide-meta">
        {items.map((item, index) => (
          <li
            key={index}
            className="grid grid-cols-[auto_auto_auto] items-baseline justify-start gap-16 border-t border-line py-4 first:border-t-2 first:border-rule"
          >
            <p className="slide-span-3 font-semibold text-fg">{item.by}</p>
            <p className="slide-span-7 text-fg-body">{item.title}</p>
            <p className="slide-span-2 text-right text-fg-muted tabular-nums">{item.year}</p>
          </li>
        ))}
      </ul>
    </Slide>
  );
}
