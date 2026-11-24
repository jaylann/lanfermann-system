import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { CoverSlide } from "@/slides/cover-slide/cover-slide";
import { Slide } from "@/slides/slide/slide";
import { Step } from "@/slides/step/step";

import { flattenSlides } from "./flatten-slides";

function Aufgabe(_props: { id?: string; notes?: ReactNode; steps?: number }) {
  return <Slide ground="tint" />;
}

describe("flattenSlides", () => {
  it("takes every top-level child as one slide, in order", () => {
    const slides = flattenSlides([<Slide key="a" id="cover" />, <Slide key="b" id="frage" />]);
    expect(slides.map((slide) => slide.id)).toEqual(["cover", "frage"]);
    expect(slides.map((slide) => slide.key)).toEqual(["a", "b"]);
  });

  it("opens fragments and arrays, and drops text and empty children", () => {
    const more = [<Slide key="c" id="drei" />, <Slide key="d" id="vier" />];
    const slides = flattenSlides(
      <>
        <Slide id="eins" />
        {null}
        zwischen den Folien
        <>
          <Slide id="zwei" />
          {more}
        </>
        {false}
      </>,
    );
    expect(slides.map((slide) => slide.id)).toEqual(["eins", "zwei", "drei", "vier"]);
  });

  it("gives slides without a key one from their place", () => {
    const slides = flattenSlides(
      <>
        <Slide />
        <Slide />
      </>,
    );
    expect(new Set(slides.map((slide) => slide.key)).size).toBe(2);
  });

  it("reads notes and ground where the slide is used, also on a deck's own part", () => {
    const [plain, wrapped] = flattenSlides(
      <>
        <Slide ground="ink" notes="Kurz warten." />
        <Aufgabe id="aufgabe" notes={<p>Zwei Minuten Zeit geben.</p>} />
      </>,
    );
    expect(plain).toMatchObject({ ground: "ink", notes: "Kurz warten." });
    expect(wrapped?.id).toBe("aufgabe");
    expect(wrapped?.notes).toBeTruthy();
    // The wrapper sets its ground inside: it is not known from outside.
    expect(wrapped?.ground).toBeUndefined();
  });

  it("gives every slide its steps, 0 for one that shows everything at once", () => {
    const slides = flattenSlides(
      <>
        <Slide id="still" />
        <Slide id="zwei">
          <Step at={1}>
            <p>Rückruf am selben Tag.</p>
          </Step>
          <Step at={2}>Termin per Mail bestätigt.</Step>
        </Slide>
      </>,
    );
    expect(slides.map((slide) => slide.steps)).toEqual([0, 2]);
  });

  it("takes the steps a deck's own part names where it is used", () => {
    const [counted, named, still] = flattenSlides(
      <>
        <CoverSlide title="Der digitale Handschlag." steps={1} />
        <Aufgabe id="aufgabe" steps={3} />
        <Aufgabe id="ohne" />
      </>,
    );
    expect(counted?.steps).toBe(1);
    expect(named?.steps).toBe(3);
    // What the wrapper draws inside is not seen from outside.
    expect(still?.steps).toBe(0);
  });

  it("lets a slide's own steps win over what its parts ask for", () => {
    const [slide] = flattenSlides(
      <Slide steps={1}>
        <Step at={3}>Angebot</Step>
      </Slide>,
    );
    expect(slide?.steps).toBe(1);
  });
});
