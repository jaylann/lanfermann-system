/**
 * For stories only (not exported): an answer of an assistant, as a Markdown renderer would hand
 * it over, that can be cut off after any number of characters, and a clock that lets it arrive
 * a few words at a time. The text is a real case: a quote for a bakery.
 */
import { type ReactNode, useEffect, useState } from "react";

import { SourceReference } from "@/components/sources/sources";

/** A piece of text, bold text, or a reference to a source (which has no characters). */
type Run = string | { strong: string } | { ref: number };
type Block = { kind: "p"; runs: Run[] } | { kind: "ul"; items: Run[][] };

export const QUESTION =
  "Fasse das Angebot für die Bäckerei Kornprobst zusammen. Was kostet es, und bis wann gilt es?";

export const ANSWER: Block[] = [
  {
    kind: "p",
    runs: [
      "Das Angebot an die ",
      { strong: "Bäckerei Kornprobst" },
      " umfasst eine neue Website mit einem Bestellformular für Torten und einer Seite für jede der drei Filialen.",
      { ref: 1 },
    ],
  },
  { kind: "p", runs: ["Die Kosten im Überblick:"] },
  {
    kind: "ul",
    items: [
      ["Gestaltung und Umsetzung: ", { strong: "3.800 €" }],
      ["Bestellformular mit Abholzeiten: ", { strong: "900 €" }],
      ["Pflege im ersten Jahr: ", { strong: "480 €" }],
    ],
  },
  {
    kind: "p",
    runs: [
      "Zusammen sind das ",
      { strong: "5.180 € netto" },
      ".",
      { ref: 2 },
      " Das Angebot gilt bis zum 15. Dezember 2026; danach werden die Preise neu berechnet.",
      { ref: 1 },
      " Den Entwurf der Startseite findest du im Anhang.",
    ],
  },
];

const textOf = (run: Run) => (typeof run === "string" ? run : "strong" in run ? run.strong : "");

/** The answer as plain text, for a copy. */
export const ANSWER_TEXT = ANSWER.map((block) =>
  block.kind === "p"
    ? block.runs.map(textOf).join("")
    : block.items.map((item) => `- ${item.map(textOf).join("")}`).join("\n"),
).join("\n\n");

/** How many characters the answer has, counted the way `answerUpTo` counts them. */
export const ANSWER_LENGTH = ANSWER.reduce(
  (sum, block) =>
    sum +
    (block.kind === "p"
      ? block.runs.map(textOf).join("").length
      : block.items.reduce((items, item) => items + item.map(textOf).join("").length, 0)),
  0,
);

/**
 * The answer as far as `count` of its characters have arrived. With `sources` its references
 * stand after their sentences (inside `Sources`), once the sentence is there.
 */
export function answerUpTo(count: number, { sources = false } = {}): ReactNode {
  let left = count;
  const complete = count >= ANSWER_LENGTH;
  const runs = (list: Run[]) =>
    list.map((run, index) => {
      if (typeof run === "object" && "ref" in run) {
        return sources && (left > 0 || complete) ? (
          <SourceReference key={index} n={run.ref} />
        ) : null;
      }
      if (left <= 0) return null;
      const text = textOf(run).slice(0, left);
      left -= text.length;
      return typeof run === "string" ? text : <strong key={index}>{text}</strong>;
    });
  const blocks: ReactNode[] = [];
  for (const [index, block] of ANSWER.entries()) {
    if (left <= 0) break;
    if (block.kind === "p") {
      blocks.push(<p key={index}>{runs(block.runs)}</p>);
    } else {
      const items: ReactNode[] = [];
      for (const [item, run] of block.items.entries()) {
        if (left <= 0) break;
        items.push(<li key={item}>{runs(run)}</li>);
      }
      blocks.push(<ul key={index}>{items}</ul>);
    }
  }
  return blocks;
}

/** Where each word of the answer ends, with the space after it. */
const WORD_ENDS = (() => {
  const texts = ANSWER.flatMap((block) =>
    block.kind === "p"
      ? [block.runs.map(textOf).join("")]
      : block.items.map((item) => item.map(textOf).join("")),
  );
  const ends: number[] = [];
  let offset = 0;
  for (const text of texts) {
    for (const word of text.matchAll(/\S+\s*/g)) ends.push(offset + word.index + word[0].length);
    offset += text.length;
  }
  return ends;
})();

/** The count that `words` more words reach from `count`. */
export function afterWords(count: number, words: number): number {
  const next = WORD_ENDS.findIndex((end) => end > count);
  if (next === -1) return ANSWER_LENGTH;
  return WORD_ENDS[Math.min(next + words - 1, WORD_ENDS.length - 1)] ?? ANSWER_LENGTH;
}

/**
 * A clock that lets the answer arrive: one to three words every `every` ms, the way a model's
 * pieces come in, from `from` characters on. `run` starts it again.
 */
export function useArrivingAnswer({
  from = 0,
  every = 70,
}: { from?: number; every?: number } = {}) {
  const [count, setCount] = useState(from);
  const [round, setRound] = useState(0);
  useEffect(() => {
    let tick = 0;
    const clock = window.setInterval(() => {
      tick += 1;
      setCount((now) => {
        if (now >= ANSWER_LENGTH) {
          window.clearInterval(clock);
          return now;
        }
        return afterWords(now, (tick % 3) + 1);
      });
    }, every);
    return () => window.clearInterval(clock);
  }, [every, round]);
  return {
    count,
    done: count >= ANSWER_LENGTH,
    run: () => {
      setCount(from);
      setRound((value) => value + 1);
    },
  };
}
