import { LANGUAGE_TAG } from "./deck-structure";
import { DECK_ENTRY, hasControlCharacter } from "./source";
import type { DeckSource } from "./types";

/** The templates a new deck can start from. */
export const TEMPLATE_NAMES = ["blank"] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export type TemplateOptions = {
  /** The deck's title, also the cover's. White space is joined to one space. */
  title: string;
  /** A language tag. `"en"` by default. */
  lang?: string;
};

/** A template asked for with a name or a value it cannot take. The message says which. */
export class TemplateError extends Error {
  override readonly name = "TemplateError";
}

export function isTemplateName(name: string): name is TemplateName {
  return (TEMPLATE_NAMES as readonly string[]).includes(name);
}

/**
 * Text as the value of a JSX attribute: as written when JSX reads it back the same, else as a
 * string in braces (a quote or a character reference would change it).
 */
function attribute(text: string): string {
  return /["&\\]/.test(text) ? `{${JSON.stringify(text)}}` : `"${text}"`;
}

// Each folder holds one file that says what goes there: a deck holds only code and pictures,
// so a folder with nothing in it would not reach a package.

const PARTS = `// Components of this deck's own: a slide or a block it shows more than once, built from the
// kit's parts. Write each in a file of its own (parts/quote-card.tsx) and import it in deck.tsx
// from "./parts/quote-card". This file only keeps the folder: delete it once it holds more.
export {};
`;

const DATA = `// What the slides show, kept apart from how they show it: figures, the rows of a table, the
// items of a list, as typed constants in files of their own (data/figures.ts) that deck.tsx
// imports. This file only keeps the folder: delete it once it holds more.
export {};
`;

const IMAGES = `// The deck's pictures: .png, .jpg, .jpeg, .webp, .svg or .avif, at most 2 MB each and 12 MB
// together. Import one where a slide shows it: import team from "./images/team.jpg". This file
// only keeps the folder: delete it once it holds a picture.
export {};
`;

function blank(title: string, lang: string): DeckSource {
  const deck = `// The deck: its default export is the <Deck>, and each child of it is one slide.
//
//   parts/   components of this deck's own
//   data/    what the slides show: figures, rows, lists
//   images/  pictures
//
// The parts and their props are in @lanfermann/ui/slides/catalog, the format in
// docs/deck-format.md of @lanfermann/slides. A cover title takes two lines of about 16
// characters: break a longer one with <br />. \`slides check\` says what is wrong.
import { ClosingSlide, CoverSlide, Deck } from "@lanfermann/ui/slides";

export default (
  <Deck title=${attribute(title)} lang=${attribute(lang)}>
    <CoverSlide
      id="cover"
      title=${attribute(title)}
      lead="One sentence on what the audience takes away."
      audience="Who this deck is for"
      byline="Your name, date"
      notes="Say who you are and why this matters to the people in the room."
    />
    <ClosingSlide
      id="closing"
      title="The next step."
      lead="What you ask of the audience, in one or two sentences."
      notes="Ask for that one thing, then stop talking and wait for an answer."
    />
  </Deck>
);
`;
  return {
    entry: DECK_ENTRY,
    files: {
      [DECK_ENTRY]: deck,
      "data/index.ts": DATA,
      "images/index.ts": IMAGES,
      "parts/index.ts": PARTS,
    },
    images: {},
  };
}

/**
 * A new deck from a template, in memory: what `slides init` writes to a folder, and what a
 * server seeds a deck with. `blank` is a cover with the title and a closing slide, with English
 * placeholder text, and the folders `parts/`, `data/` and `images/`, each with a file that says
 * what goes there. The result passes `checkDeck` as it is.
 *
 * Throws a `TemplateError` for a name that is no template, a title without a word, or a
 * language that is no tag.
 */
export function deckTemplate(name: TemplateName, options: TemplateOptions): DeckSource {
  const title = options.title.replace(/\s+/g, " ").trim();
  if (title === "") throw new TemplateError("A deck needs a title.");
  if (hasControlCharacter(title)) {
    throw new TemplateError("A title cannot hold a control character.");
  }
  const lang = options.lang ?? "en";
  if (!LANGUAGE_TAG.test(lang)) {
    throw new TemplateError('The language has to be a tag such as "en" or "de-CH".');
  }
  switch (name) {
    case "blank":
      return blank(title, lang);
    default: {
      // A caller in plain JavaScript can pass any text.
      const unknown: never = name;
      throw new TemplateError(
        `There is no template of that name. The templates are ${TEMPLATE_NAMES.join(", ")}.`,
        { cause: unknown },
      );
    }
  }
}
