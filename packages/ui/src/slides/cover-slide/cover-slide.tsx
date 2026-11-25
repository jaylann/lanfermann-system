import type { ReactNode } from "react";

import { CoBrand } from "@/slides/co-brand/co-brand";
import { Forms } from "@/slides/forms/forms";
import { Lead } from "@/slides/lead/lead";
import { span } from "@/slides/lib/grid";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";
import { Wordmark } from "@/slides/wordmark/wordmark";

export type CoverSlideProps = {
  /** The deck's title at 162px. Two lines at most, broken by hand. */
  title: ReactNode;
  /** One sentence that says what the reader will learn. */
  lead?: ReactNode;
  /** Bottom left: who the deck is for. */
  audience?: ReactNode;
  /** Bottom right, on the indigo quarter: who presents, and when. 30 characters at most. */
  byline?: ReactNode;
  /** A client's name: the wordmark becomes a co-brand lockup. */
  partner?: ReactNode;
  /**
   * The composition. `rise` by default. `drop` when a title line is longer than 16 characters (20
   * at most): it leaves the lower half free. `orbit` as the other look, for title lines of 14
   * characters at most.
   */
  forms?: "rise" | "orbit" | "drop";
  /** The slide's id. */
  id?: string;
  /** What the presenter says here. Never drawn on the slide. */
  notes?: ReactNode;
};

/**
 * The cover: wordmark, title, one sentence, for whom and by whom, on Ink with the rising forms.
 *
 * Always on Ink, with the `rise` forms: an indigo quarter rising from the bottom right, a lavender
 * half hanging from the top edge, two small discs. The title stands on the bottom third, the
 * wordmark in the top left corner, and nothing else: no image, no date badge. A title line of 16
 * characters ends left of the forms. The two lines at the foot take the place of the footer row;
 * the byline stands on the quarter.
 */
export function CoverSlide({
  title,
  lead,
  audience,
  byline,
  partner,
  forms = "rise",
  id,
  notes,
}: CoverSlideProps) {
  return (
    <Slide ground="ink" footer={false} gap={48} id={id} notes={notes}>
      <Forms name={forms} />
      {partner != null ? (
        <div className="absolute top-32 left-32 flex h-8 slide-span-7">
          <CoBrand partner={partner} />
        </div>
      ) : (
        <Wordmark size={32} style={{ position: "absolute", left: 128, top: 128, width: span(5) }} />
      )}
      <Spacer />
      <Title size="cover">{title}</Title>
      {lead != null && <Lead>{lead}</Lead>}
      {audience != null && (
        <p className="absolute bottom-16 left-32 slide-span-7 text-slide-meta leading-none text-fg-muted">
          {audience}
        </p>
      )}
      {byline != null && (
        <p className="absolute right-32 bottom-16 slide-span-4 text-right text-slide-meta leading-none text-fg">
          {byline}
        </p>
      )}
    </Slide>
  );
}
