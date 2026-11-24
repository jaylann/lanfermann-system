import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Slide } from "@/slides/slide/slide";

import { flattenSlides } from "./flatten-slides";

function Aufgabe(_props: { id?: string; notes?: ReactNode }) {
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
});
