/** One prop of a slide part, as its author documented it. */
export type SlideCatalogProp = {
  name: string;
  /** The TypeScript type, as written in the part's props. */
  type: string;
  required: boolean;
  /** What the prop does, and what to put in it. */
  description: string;
};

/** One slide part, as the author of a deck needs to know it. */
export type SlideCatalogEntry = {
  /** The export of `@lanfermann/ui/slides`. */
  name: string;
  /** Where it belongs: Scaffold, Text, Lists, … */
  group: string;
  /** What the part is, in one sentence. */
  summary: string;
  /** When to use it and how to word it. Paragraphs are separated by a blank line. */
  notes: string;
  props: SlideCatalogProp[];
  /** One slide that uses the part, as TSX with its import line. */
  example?: string;
};
