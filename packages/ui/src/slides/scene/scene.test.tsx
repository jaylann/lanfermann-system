import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Slide } from "@/slides/slide/slide";
import { SlideStepProvider } from "@/slides/step/step-context";
import { countSteps } from "@/slides/step/steps";

import { Scene } from "./scene";
import { SceneExample } from "./scene.example";

const visibleCaptions = (html: string) =>
  html.match(/data-slot="slide-scene-caption" data-lines="2" class="[^"]*\bvisible\b/g) ?? [];

describe("Scene", () => {
  it("stands still at its last beat where nobody steps", () => {
    const html = renderToStaticMarkup(<SceneExample />);
    // The example's world is 2448 by 312 units with its frames and its wire back: at 1664 / 2448
    // across, its corner (-24, -24) lands on (0, 48).
    expect(html).toContain("transform:translate(16.31px, 64.31px) scale(0.67974)");
    expect(html).toContain('data-zoom="far"');
    expect(visibleCaptions(html)).toHaveLength(1);
    expect(html).toContain("Der Kreis schließt sich:");
    expect(html.match(/aria-hidden="true"[^>]*>(?:<b>)?Drei Stationen/g)).toHaveLength(1);
  });

  it("shows one beat at a step: the camera on its view, what it cuts left out", () => {
    const html = renderToStaticMarkup(
      <SlideStepProvider step={1} steps={2}>
        <SceneExample />
      </SlideStepProvider>,
    );
    // The group „Anfrage“ (808, -24, 784 by 304) at 1: its corner on (0, 48).
    expect(html).toContain("transform:translate(-808px, 72px) scale(1)");
    expect(html).toContain('data-zoom="near"');
    // „Gefunden werden“ stands left of the box: there, but not drawn.
    expect(html).toMatch(/data-state="away"[^]*?data-node="google"/);
  });

  it("opens a presented slide one frame before its first beat, with nothing there yet", () => {
    const html = renderToStaticMarkup(
      <SlideStepProvider step={0} steps={2} live>
        <SceneExample />
      </SlideStepProvider>,
    );
    expect(html).not.toMatch(/data-slot="slide-scene-node" data-state="(shown|away)"/);
    expect(html.match(/data-slot="slide-scene-node" data-state="absent"/g)).toHaveLength(12);
  });

  it("is one picture with its alternative text, and counts its beats as steps", () => {
    const world = { nodes: [{ id: "anfrage", label: "Anfrage", col: 1, row: 1 }] };
    const beats = [{}, { highlight: ["anfrage"] }, {}];
    const html = renderToStaticMarkup(<Scene alt="Eine Anfrage." world={world} beats={beats} />);
    expect(html).toContain('role="img" aria-label="Eine Anfrage."');
    expect(Scene.slideSteps({ alt: "", world, beats })).toBe(2);
    expect(
      countSteps(
        <Slide>
          <Scene alt="" world={world} beats={beats} />
        </Slide>,
      ),
    ).toBe(2);
  });
});
