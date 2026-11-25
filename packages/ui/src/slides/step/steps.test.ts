import { createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Slide } from "@/slides/slide/slide";

import { Step } from "./step";
import { countSteps, maxStep, stepAttributes, type StepCounter, stepsOfSlide } from "./steps";

/** A part with steps of its own, as `Columns` will have: one per item that names one. */
function Reihen(_props: { items: { text: string; step?: number }[] }) {
  return null;
}
Reihen.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<{
  items: { text: string; step?: number }[];
}>;

/** A deck's own component: what it draws inside is not seen from outside. */
function EigeneFolie(_props: { steps?: number; children?: ReactNode }) {
  return null;
}

const p = (props: Record<string, unknown> | null, ...children: ReactNode[]) =>
  createElement("p", props, ...children);

/** `<Step at={at}>{children}</Step>`, as an element that is not drawn. */
const stepAt = (at: number, children: ReactNode) => createElement(Step, { at, children });

describe("stepAttributes", () => {
  it("marks an element with the step and its custom property", () => {
    expect(stepAttributes(2)).toEqual({ "data-step": 2, style: { "--step-at": 2 } });
  });

  it("drops the fraction of a step", () => {
    expect(stepAttributes(2.7)).toEqual({ "data-step": 2, style: { "--step-at": 2 } });
  });

  it("marks nothing for no step, zero, a negative or an endless one", () => {
    for (const at of [undefined, 0, -1, Number.NaN, Infinity])
      expect(stepAttributes(at)).toEqual({});
  });
});

describe("maxStep", () => {
  it("is the highest step among the items", () => {
    expect(maxStep([{ step: 1 }, { step: 3 }, {}, { step: 2 }])).toBe(3);
  });

  it("is 0 for no items, empty items and items without a step", () => {
    expect(maxStep(undefined)).toBe(0);
    expect(maxStep([])).toBe(0);
    expect(maxStep([null, undefined, {}])).toBe(0);
  });

  it("ignores steps that are not finite and drops fractions", () => {
    expect(maxStep([{ step: Number.NaN }, { step: Infinity }, { step: 1.9 }])).toBe(1);
  });
});

describe("countSteps", () => {
  it("reads plain data-step attributes", () => {
    expect(countSteps(p({ "data-step": 2 }, "Rückruf"))).toBe(2);
  });

  it("reads a part's slideSteps from its props without drawing it", () => {
    const rows = createElement(Reihen, {
      items: [{ text: "Anfrage" }, { text: "Rückruf", step: 1 }, { text: "Termin", step: 3 }],
    });
    expect(countSteps(rows)).toBe(3);
  });

  it("follows children, fragments and arrays to the highest step", () => {
    const tree = createElement(
      "div",
      null,
      p({ "data-step": 1 }),
      createElement(Fragment, null, [
        p({ key: "a", "data-step": 2 }),
        createElement("div", { key: "b" }, p({ "data-step": 4 })),
      ]),
    );
    expect(countSteps(tree)).toBe(4);
  });

  it("counts Step by its at, also nested inside other markup", () => {
    const tree = createElement(
      "section",
      null,
      stepAt(1, p(null, "Anfrage")),
      createElement("div", null, stepAt(2, "Termin")),
    );
    expect(countSteps(tree)).toBe(2);
  });

  it("is 0 for nothing, text and markup without steps", () => {
    expect(countSteps(null)).toBe(0);
    expect(countSteps(undefined)).toBe(0);
    expect(countSteps("Rückruf")).toBe(0);
    expect(countSteps([false, 0, p(null, "Anfrage")])).toBe(0);
  });

  it("does not see what a deck's own component draws inside", () => {
    expect(countSteps(createElement(EigeneFolie))).toBe(0);
  });
});

describe("stepsOfSlide", () => {
  it("counts the steps of the slide's children", () => {
    const slide = createElement(
      Slide,
      null,
      stepAt(1, p(null, "Rückruf")),
      stepAt(2, p(null, "Termin")),
    );
    expect(stepsOfSlide(slide)).toBe(2);
  });

  it("takes steps where the element names them, over what it would count", () => {
    const slide = createElement(Slide, { steps: 3 }, stepAt(1, "Rückruf"));
    expect(stepsOfSlide(slide)).toBe(3);
    expect(stepsOfSlide(createElement(EigeneFolie, { steps: 2 }))).toBe(2);
  });

  it("takes an explicit 0 as a slide without steps", () => {
    const slide = createElement(Slide, { steps: 0 }, stepAt(2, "Termin"));
    expect(stepsOfSlide(slide)).toBe(0);
  });

  it("is 0 for what is not an element, and for a slide without steps", () => {
    expect(stepsOfSlide(null)).toBe(0);
    expect(stepsOfSlide("Folie")).toBe(0);
    expect(stepsOfSlide(createElement(Slide))).toBe(0);
  });
});

/** The element a `Step` returns: it draws no hooks, so it can be called as a function. */
function step(at: number, children: ReactNode): ReactElement<Record<string, unknown>> {
  const element: unknown = Step({ at, children });
  if (!isValidElement<Record<string, unknown>>(element)) throw new Error("Step drew no element");
  return element;
}

describe("Step", () => {
  it("marks one plain element itself and keeps its own style", () => {
    const element = step(2, p({ className: "slide-span-6", style: { width: 800 } }, "Rückruf"));
    expect(element.type).toBe("p");
    expect(element.props["data-step"]).toBe(2);
    expect(element.props.className).toBe("slide-span-6");
    expect(element.props.style).toEqual({ width: 800, "--step-at": 2 });
    expect(element.props.children).toBe("Rückruf");
  });

  it("wraps text, several children and parts in a block of its own", () => {
    for (const children of [
      "Rückruf am selben Tag.",
      [p({ key: "a" }, "Anfrage"), p({ key: "b" }, "Rückruf")],
      createElement(Reihen, { items: [] }),
    ]) {
      const element = step(1, children);
      expect(element.type).toBe("div");
      expect(element.props["data-slot"]).toBe("slide-step");
      expect(element.props["data-step"]).toBe(1);
      expect(element.props.style).toEqual({ "--step-at": 1 });
      expect(element.props.children).toBe(children);
    }
  });

  it("leaves a plain element as it is for a step of 0", () => {
    const child = p(null, "Anfrage");
    expect(step(0, child)).toBe(child);
  });

  it("says how many steps it asks for", () => {
    expect(Step.slideSteps({ at: 3, children: null })).toBe(3);
  });
});
