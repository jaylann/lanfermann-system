import { describe, expect, it } from "vitest";

import { advancePieces, staggerDelays } from "./arriving-pieces";

const pieces = (text: string, ends: readonly number[]) => {
  let start = 0;
  return ends.map((end) => {
    const piece = text.slice(start, end);
    start = end;
    return piece;
  });
};

describe("advancePieces", () => {
  it("cuts new words into pieces of three and holds back the word being written", () => {
    const text = "Das Angebot für die Bäckerei Kornprobst liegt bei";
    const { ends, fresh } = advancePieces([], text, { complete: false });
    expect(fresh).toBe(0);
    expect(pieces(text, ends)).toEqual(["Das Angebot für ", "die Bäckerei Kornprobst ", "liegt "]);
  });

  it("keeps what was shown in its pieces and adds only what is new", () => {
    const first = "Das Angebot für die ";
    const before = advancePieces([], first, { complete: false }).ends;
    const text = `${first}Bäckerei Kornprobst steht.`;
    const { ends, fresh } = advancePieces(before, text, { complete: false });
    expect(ends.slice(0, before.length)).toEqual(before);
    expect(fresh).toBe(before.length);
    expect(pieces(text, ends).slice(fresh)).toEqual(["Bäckerei Kornprobst "]);
  });

  it("shows the last word once the text is complete", () => {
    const text = "Es kostet 4.200 Euro.";
    const { ends } = advancePieces([], text, { complete: true });
    expect(pieces(text, ends)).toEqual(["Es kostet 4.200 ", "Euro."]);
  });

  it("adds nothing while only the word being written grows", () => {
    const before = advancePieces([], "Hallo Wel", { complete: false });
    const after = advancePieces(before.ends, "Hallo Welt", { complete: false });
    expect(after.ends).toEqual(before.ends);
    expect(after.fresh).toBe(after.ends.length);
  });

  it("keeps punctuation with the word before it", () => {
    const text = "Ja, gern. Das geht: morgen früh. ";
    const { ends } = advancePieces([], text, { complete: false });
    expect(pieces(text, ends)).toEqual(["Ja, gern. Das ", "geht: morgen früh. "]);
  });

  it("starts over where a text became shorter", () => {
    const before = advancePieces([], "Erster Versuch mit vielen Wörtern ", { complete: false });
    const { ends, fresh } = advancePieces(before.ends, "Zweiter ", { complete: false });
    expect(ends.at(-1)).toBe("Zweiter ".length);
    expect(fresh).toBe(ends.length);
  });
});

describe("staggerDelays", () => {
  it("spaces a few pieces by the step", () => {
    expect(staggerDelays(3, 40, 240)).toEqual([0, 40, 80]);
  });

  it("presses a burst into the span instead of queuing it", () => {
    const delays = staggerDelays(25, 40, 240);
    expect(delays.at(-1)).toBe(240);
    expect(delays[1]).toBe(10);
  });

  it("gives a single piece no delay", () => {
    expect(staggerDelays(1, 40, 240)).toEqual([0]);
    expect(staggerDelays(0, 40, 240)).toEqual([]);
  });
});
