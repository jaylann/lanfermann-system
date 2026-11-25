/**
 * What the check mode says about a deck: one object on `window.__slidesReport`, read by the tool
 * that builds a deck and by whoever wrote it. All lengths are px on the 1920 by 1080 canvas,
 * however large the page is drawn.
 */
export type SlidesReport = {
  version: 1;
  /** The version of `@lanfermann/ui` the deck was checked with. */
  kit: string;
  /** No issue on any slide, no error on the page, and both faces of the kit loaded. */
  ok: boolean;
  deck: { title: string; lang: string; slides: number };
  fonts: { ready: boolean; missing: string[] };
  slides: SlideReport[];
  errors: PageError[];
};

export type SlideReport = {
  /** Counted from 0. */
  index: number;
  id?: string;
  ok: boolean;
  issues: SlideIssue[];
};

export type PageError = { kind: "error" | "unhandledrejection"; message: string };

/** Px beyond a box, per side. 0 on a side that holds. */
export type Sides = { top: number; right: number; bottom: number; left: number };

export type SlideIssue =
  /** A part reaches beyond the content box, or a placed part beyond the canvas. */
  | { kind: "overflow"; target: string; by: Sides }
  /** A box cuts off its own content. */
  | { kind: "clipped"; target: string }
  /** A text with `data-lines` runs to more lines than it may. */
  | { kind: "wrap"; target: string; lines: number; maxLines: number; text: string }
  /** The slide threw while it was drawn. */
  | { kind: "render-error"; message: string }
  /** A child of the deck is not exactly one slide. */
  | { kind: "structure"; message: string };

type ReportParts = {
  kit: string;
  deck: SlidesReport["deck"];
  fonts: SlidesReport["fonts"];
  slides: readonly { index: number; id?: string; issues: SlideIssue[] }[];
  errors: readonly PageError[];
};

/** Puts the report together and draws its conclusions: a slide is fine without issues, a deck
 * when every slide is, nothing threw and no face is missing. */
export function buildReport({ kit, deck, fonts, slides, errors }: ReportParts): SlidesReport {
  const checked = slides.map((slide) => ({ ...slide, ok: slide.issues.length === 0 }));
  return {
    version: 1,
    kit,
    ok:
      checked.every((slide) => slide.ok) &&
      errors.length === 0 &&
      fonts.ready &&
      fonts.missing.length === 0,
    deck,
    fonts,
    slides: checked,
    errors: [...errors],
  };
}
