import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BeforeAfter } from "@/slides/before-after/before-after";
import { PhoneFrame } from "@/slides/phone-frame/phone-frame";
import { Split } from "@/slides/split/split";
import { countSteps } from "@/slides/step/steps";

import { BrowserFrame } from "./browser-frame";

describe("markers by step", () => {
  it("pins a marker without a step where it stood, with no mark", () => {
    const html = renderToStaticMarkup(
      <BrowserFrame url="ihr-betrieb.de" markers={[{ n: 1, x: 40, y: 60 }]} />,
    );
    expect(html).toContain(
      '<div style="position:absolute;left:40px;top:60px"><p data-slot="slide-marker"',
    );
    expect(html).not.toContain("data-slides-at");
  });

  it("marks the box of a marker with a step, in a browser and on a phone", () => {
    const marker = { n: 2, x: 40, y: 60, step: 2 };
    const expected =
      '<div data-slides-at="2" style="--step-at:2;position:absolute;left:40px;top:60px"><p data-slot="slide-marker"';
    expect(
      renderToStaticMarkup(<BrowserFrame url="ihr-betrieb.de" markers={[marker]} />),
    ).toContain(expected);
    expect(renderToStaticMarkup(<PhoneFrame markers={[marker]} />)).toContain(expected);
  });

  it("counts the markers' steps, through a BeforeAfter's two sides too", () => {
    const markers = [
      { n: 1, x: 0, y: 0, step: 1 },
      { n: 2, x: 0, y: 0, step: 3 },
    ];
    expect(BrowserFrame.slideSteps({ url: "a.de" })).toBe(0);
    expect(PhoneFrame.slideSteps({ markers })).toBe(3);
    expect(
      countSteps(
        <Split>
          <BrowserFrame url="a.de" markers={markers} />
          <PhoneFrame markers={[{ n: 1, x: 0, y: 0, step: 4 }]} />
        </Split>,
      ),
    ).toBe(4);
    expect(
      countSteps(
        <BeforeAfter
          before={{ url: "a.de", markers: [{ n: 1, x: 0, y: 0, step: 5 }] }}
          after={{ url: "a.de", markers }}
        />,
      ),
    ).toBe(5);
  });
});
