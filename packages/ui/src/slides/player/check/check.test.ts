import { describe, expect, it } from "vitest";

import { countLines, excerpt } from "./lines";
import {
  beyond,
  CANVAS,
  clipTo,
  CONTENT,
  cutsOff,
  lineBox,
  markedSteps,
  stepIssue,
  toCanvas,
  union,
} from "./measure";
import { buildReport } from "./report";

describe("counting the lines of a text", () => {
  it("counts the tops that stand apart", () => {
    expect(countLines([], 12)).toBe(0);
    expect(countLines([100], 12)).toBe(1);
    expect(countLines([100, 176, 252], 12)).toBe(3);
  });

  it("takes the pieces of one line as one line, in any order", () => {
    // A bold word and a smaller unit sit a few px off the line's top.
    expect(countLines([176, 100, 103, 100, 178, 97], 12)).toBe(2);
  });

  it("does not join two lines through pieces that drift", () => {
    // Each piece is within the tolerance of the one before, but the run spans two lines.
    expect(countLines([100, 110, 120, 130], 12)).toBe(2);
  });

  it("leaves out what is not a number", () => {
    expect(countLines([100, Number.NaN, 200], 12)).toBe(2);
  });

  it("cuts a text for the report to one line of 80 characters", () => {
    expect(excerpt("  Ihre Kunden\n   prüfen Sie.  ")).toBe("Ihre Kunden prüfen Sie.");
    expect(excerpt("a".repeat(200))).toHaveLength(80);
  });
});

describe("the boxes of a slide", () => {
  it("lets a box inside its limit pass, also by a px of rounding", () => {
    expect(beyond({ top: 128, right: 1792, bottom: 920, left: 128 }, CONTENT)).toBeNull();
    expect(beyond({ top: 127.3, right: 1792.4, bottom: 921, left: 128 }, CONTENT)).toBeNull();
    expect(beyond({ top: 126.8, right: 1792, bottom: 920, left: 128 }, CONTENT)).toEqual({
      top: 1.2,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it("says how far a box reaches beyond its limit, per side", () => {
    expect(beyond({ top: 128, right: 1850, bottom: 1003.26, left: 100 }, CONTENT)).toEqual({
      top: 0,
      right: 58,
      bottom: 83.3,
      left: 28,
    });
  });

  it("holds a placed part to the canvas, not to the content box", () => {
    const footer = { top: 992, right: 1792, bottom: 1016, left: 128 };
    expect(beyond(footer, CANVAS)).toBeNull();
    expect(beyond(footer, CONTENT)).toEqual({ top: 0, right: 0, bottom: 96, left: 0 });
    expect(beyond({ top: -40, right: 1960, bottom: 300, left: 1500 }, CANVAS)).toEqual({
      top: 40,
      right: 40,
      bottom: 0,
      left: 0,
    });
  });

  it("reports canvas px for a page drawn at another size", () => {
    // A slide drawn at half size, 100px in and 50px down the page.
    const slide = { top: 50, right: 1060, bottom: 590, left: 100 };
    const part = { top: 114, right: 996, bottom: 520, left: 164 };
    expect(toCanvas(part, slide, 0.5)).toEqual({ top: 128, right: 1792, bottom: 940, left: 128 });
  });

  it("cuts a box to what a clipping box around it shows", () => {
    const frame = { top: 200, right: 900, bottom: 700, left: 100 };
    expect(clipTo({ top: 150, right: 1200, bottom: 400, left: 300 }, frame)).toEqual({
      top: 200,
      right: 900,
      bottom: 400,
      left: 300,
    });
    expect(clipTo({ top: 800, right: 1200, bottom: 900, left: 300 }, frame)).toBeNull();
    expect(clipTo(frame, null)).toEqual(frame);
  });

  it("joins boxes", () => {
    const a = { top: 10, right: 50, bottom: 60, left: 20 };
    const b = { top: 30, right: 90, bottom: 40, left: 5 };
    expect(union(a, b)).toEqual({ top: 10, right: 90, bottom: 60, left: 5 });
    expect(union(null, b)).toEqual(b);
    expect(union(a, null)).toEqual(a);
    expect(union(null, null)).toBeNull();
  });

  it("takes a piece of text as tall as its line, not as its font", () => {
    // A 72px title on a line of 1.06 (76.32px): the font's box is 88px and starts 6px above.
    const font = { top: 122.16, right: 900, bottom: 210.16, left: 128 };
    const line = lineBox(font, 76.32);
    expect(line.top).toBeCloseTo(128, 5);
    expect(line.bottom).toBeCloseTo(204.32, 5);
    expect(line).toMatchObject({ left: 128, right: 900 });
    // A box no taller than its line, and a line of no fixed height ("normal"), stay.
    expect(lineBox(font, 120)).toEqual(font);
    expect(lineBox(font, Number.NaN)).toEqual(font);
  });

  it("calls a box cut off when its content is larger by more than 1px", () => {
    expect(cutsOff(400, 400)).toBe(false);
    expect(cutsOff(401, 400)).toBe(false);
    expect(cutsOff(402, 400)).toBe(true);
  });
});

describe("the steps a slide's parts ask for", () => {
  /** A box of the page that answers `[name]` selectors from a list of elements' attributes. */
  const boxOf = (elements: readonly Record<string, string>[]) => ({
    querySelectorAll(selector: string) {
      const name = /^\[([a-z-]+)\]$/.exec(selector)?.[1];
      if (name === undefined) throw new Error(`not a selector this box answers: ${selector}`);
      return elements
        .filter((attributes) => name in attributes)
        .map((attributes) => ({ getAttribute: (asked: string) => attributes[asked] ?? null }));
    },
  });

  it("reads the kit's own mark from the page, and not a deck's data-step", () => {
    const box = boxOf([
      { "data-slides-at": "1" },
      { "data-step": "3" },
      { "data-slides-at": "2", "data-step": "7" },
    ]);
    expect(markedSteps(box)).toEqual([1, 2]);
    // A slide of two steps with a `data-step="3"` of the deck's own: nothing to report.
    expect(stepIssue(markedSteps(box), 2)).toBeUndefined();
    expect(markedSteps(boxOf([{ "data-step": "3" }]))).toEqual([]);
  });

  it("lets parts pass that ask for no more steps than the slide has", () => {
    expect(stepIssue([], 0)).toBeUndefined();
    expect(stepIssue([1, 2, 2], 2)).toBeUndefined();
    expect(stepIssue([1], 3)).toBeUndefined();
    expect(stepIssue([Number.NaN], 0)).toBeUndefined();
  });

  it("calls a part a structure issue when it asks for a step the slide does not have", () => {
    expect(stepIssue([1, 3, 2], 2)).toEqual({
      kind: "structure",
      message: "A part asks for step 3, but the slide has 2 steps: name `steps` on the slide.",
    });
    expect(stepIssue([2], 1)?.message).toBe(
      "A part asks for step 2, but the slide has 1 step: name `steps` on the slide.",
    );
    expect(stepIssue([1], 0)?.message).toBe(
      "A part asks for step 1, but the slide has 0 steps: name `steps` on the slide.",
    );
  });
});

describe("the report", () => {
  const parts = {
    kit: "1.2.3",
    deck: { title: "Der digitale Handschlag", lang: "de", slides: 2 },
    fonts: { ready: true, missing: [] },
    slides: [
      { index: 0, id: "cover", issues: [] },
      { index: 1, issues: [] },
    ],
    errors: [],
  };

  it("is fine when nothing is wrong", () => {
    const report = buildReport(parts);
    expect(report).toMatchObject({ version: 1, kit: "1.2.3", ok: true });
    const none = { issues: [], overflow: [], wraps: [], errors: [] };
    expect(report.slides).toEqual([
      { index: 0, id: "cover", ok: true, ...none },
      { index: 1, ok: true, ...none },
    ]);
  });

  it("is not fine with an issue on one slide, and says on which", () => {
    const report = buildReport({
      ...parts,
      slides: [
        { index: 0, issues: [] },
        { index: 1, issues: [{ kind: "clipped", target: "p" }] },
      ],
    });
    expect(report.ok).toBe(false);
    expect(report.slides.map((slide) => slide.ok)).toEqual([true, false]);
  });

  it("is not fine with an error on the page or a missing face", () => {
    expect(buildReport({ ...parts, errors: [{ kind: "error", message: "x" }] }).ok).toBe(false);
    expect(
      buildReport({ ...parts, fonts: { ready: true, missing: ["Sofia Sans Variable"] } }).ok,
    ).toBe(false);
    expect(buildReport({ ...parts, fonts: { ready: false, missing: [] } }).ok).toBe(false);
  });
});
