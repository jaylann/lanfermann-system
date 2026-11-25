import { describe, expect, it } from "vitest";

import { buildReport } from "./check/report";
import { parseEmbedCommand, readyMessage, stateMessage } from "./embed";

describe("the bridge to a framing page", () => {
  it("reads the two commands", () => {
    expect(parseEmbedCommand({ lfSlides: "embed", type: "go", index: 4 })).toEqual({
      type: "go",
      index: 4,
    });
    expect(parseEmbedCommand({ lfSlides: "embed", type: "go", index: 2, blackout: true })).toEqual({
      type: "go",
      index: 2,
      blackout: true,
    });
    for (const intent of ["next", "previous", "first", "last", "blackout", "grid", "escape"]) {
      expect(parseEmbedCommand({ lfSlides: "embed", type: "intent", intent })).toEqual({
        type: "intent",
        intent,
      });
    }
  });

  it("drops what is not a command of the bridge", () => {
    const not = [
      null,
      "go",
      { type: "go", index: 1 },
      { lfSlides: "other", type: "go", index: 1 },
      { lfSlides: "embed", type: "go" },
      { lfSlides: "embed", type: "go", index: -1 },
      { lfSlides: "embed", type: "go", index: 1.5 },
      { lfSlides: "embed", type: "go", index: "1" },
      { lfSlides: "embed", type: "go", index: 1, blackout: "yes" },
      { lfSlides: "embed", type: "intent", intent: "fullscreen" },
      { lfSlides: "embed", type: "intent", intent: "audience-window" },
      { lfSlides: "embed", type: "intent" },
      { lfSlides: "embed", type: "state", index: 1 },
    ];
    for (const data of not) expect(parseEmbedCommand(data)).toBeUndefined();
  });

  it("says first how many slides there are, with their ids in order", () => {
    expect(readyMessage(["cover", undefined, "befunde"])).toEqual({
      lfSlides: "embed",
      type: "ready",
      count: 3,
      slides: [{ id: "cover" }, {}, { id: "befunde" }],
    });
  });

  it("says where the deck is, with the slide's id where it has one", () => {
    expect(stateMessage({ index: 2, count: 3, id: "befunde", blackout: false })).toEqual({
      lfSlides: "embed",
      type: "state",
      index: 2,
      count: 3,
      id: "befunde",
      blackout: false,
    });
    expect(stateMessage({ index: 1, count: 3, blackout: true })).toEqual({
      lfSlides: "embed",
      type: "state",
      index: 1,
      count: 3,
      blackout: true,
    });
  });
});

describe("the report as the hub reads it", () => {
  it("sorts a slide's issues by kind and keeps them all", () => {
    const by = { top: 0, right: 12, bottom: 0, left: 0 };
    const report = buildReport({
      kit: "0.0.0",
      deck: { title: "Deck", lang: "de", slides: 2 },
      fonts: { ready: true, missing: [] },
      slides: [
        { index: 0, id: "cover", issues: [] },
        {
          index: 1,
          issues: [
            { kind: "overflow", target: "slide-table", by },
            { kind: "wrap", target: "slide-title", lines: 3, maxLines: 2, text: "Zu lang" },
            { kind: "clipped", target: "div" },
            { kind: "render-error", message: "Kaputt" },
          ],
        },
      ],
      errors: [],
    });
    expect(report.ok).toBe(false);
    expect(report.slides[0]).toEqual({
      index: 0,
      id: "cover",
      ok: true,
      issues: [],
      overflow: [],
      wraps: [],
      errors: [],
    });
    const second = report.slides[1];
    expect(second?.overflow.map((issue) => issue.kind)).toEqual(["overflow", "clipped"]);
    expect(second?.wraps).toHaveLength(1);
    expect(second?.errors).toEqual([{ kind: "render-error", message: "Kaputt" }]);
    expect(second?.issues).toHaveLength(4);
  });
});
