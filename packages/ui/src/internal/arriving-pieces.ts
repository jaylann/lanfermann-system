/**
 * How a text that is still being written is cut into the pieces that fade in: the pure part of
 * `arriving.tsx`, without React or a browser, so it can be tested.
 *
 * A text is shown in pieces, each up to a few words long. What was shown stays in the pieces it
 * was shown in, so nothing fades in twice; what is new since the last look is cut into new
 * pieces. A word that is still being written is held back until it is finished (a space follows
 * it, or the text is complete), so a word never fades in in two halves.
 */

/** Where the pieces of one text end, in characters, in order. The last one is how far it shows. */
export type PieceEnds = readonly number[];

/** Words to a piece: "a few words at a time" (issue #33), not letter by letter. */
export const WORDS_PER_PIECE = 3;

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("de", { granularity: "word" })
    : null;

/** Where the words of `text` between `from` and `to` begin. Punctuation is not a word. */
function wordStarts(text: string, from: number, to: number): number[] {
  const stretch = text.slice(from, to);
  const starts: number[] = [];
  if (segmenter) {
    for (const segment of segmenter.segment(stretch)) {
      if (segment.isWordLike) starts.push(from + segment.index);
    }
  } else {
    for (const word of stretch.matchAll(/\S+/g)) starts.push(from + word.index);
  }
  return starts;
}

/** Scripts whose words are written without a space between them. */
const unspaced = /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Thai}\p{sc=Lao}\p{sc=Khmer}]/u;

/**
 * How far the finished words reach: just after the last white space at or after `from`. In a
 * script written without spaces (Japanese, Chinese, Thai) a sentence would wait unseen for a
 * space that never comes, so there the words after that are counted too, and only the last
 * one, which may still be growing, is held back.
 */
function finishedUpTo(text: string, from: number): number {
  let reach = from;
  for (let index = text.length - 1; index >= from; index -= 1) {
    if (/\s/.test(text.charAt(index))) {
      reach = index + 1;
      break;
    }
  }
  if (segmenter && unspaced.test(text.slice(reach)))
    return wordStarts(text, reach, text.length).at(-1) ?? reach;
  return reach;
}

export type Advanced = {
  ends: PieceEnds;
  /** The index of the first piece that is new: the ones from here on fade in. */
  fresh: number;
};

/**
 * The pieces of `text` now, given the pieces it was shown in before. `complete` says that no
 * more will be added to this text, so its last word is shown even without a space after it.
 *
 * A text that has become shorter (a renderer that took back what it had drawn, a retry that
 * starts again) keeps what still stands as shown and fades in only what is added after that.
 */
export function advancePieces(
  before: PieceEnds,
  text: string,
  { complete, wordsPerPiece = WORDS_PER_PIECE }: { complete: boolean; wordsPerPiece?: number },
): Advanced {
  let ends = before;
  let shown = ends.at(-1) ?? 0;
  if (text.length < shown) {
    ends = [...ends.filter((end) => end < text.length), text.length].filter((end) => end > 0);
    shown = text.length;
  }
  const fresh = ends.length;
  const reach = complete ? text.length : finishedUpTo(text, shown);
  if (reach <= shown) return { ends, fresh };
  // Cut before every few words, so white space and punctuation stay with the word before them.
  const cuts = wordStarts(text, shown, reach).filter(
    (start, index) => index > 0 && index % wordsPerPiece === 0 && start > shown,
  );
  return { ends: [...ends, ...cuts, reach], fresh };
}

/**
 * The delays of pieces that fade in together, in ms: one after the other, `step` apart, but
 * never longer than `span` for the lot. A burst of text is pressed together instead of queuing,
 * so a fast stream never falls behind what has arrived.
 */
export function staggerDelays(count: number, step: number, span: number): number[] {
  if (count <= 0) return [];
  const gap = count > 1 ? Math.min(step, span / (count - 1)) : 0;
  return Array.from({ length: count }, (_, index) => Math.round(index * gap));
}
