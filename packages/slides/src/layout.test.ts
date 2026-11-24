import { describe, expect, it } from "vitest";

import type { SlideInfo } from "./deck-structure";
import { layoutDiagnostics } from "./layout";
import { formatDiagnostic } from "./types";

const slides: SlideInfo[] = [
  { index: 0, id: "wrap", hasNotes: false, line: 11, column: 5 },
  { index: 1, id: "overflow", hasNotes: false, line: 17, column: 5 },
  { index: 2, hasNotes: false, line: 21, column: 5 },
];
const lines = (report: unknown) =>
  layoutDiagnostics(report, slides, "deck.tsx").map(formatDiagnostic);
const fine = { ok: true, slides: [], errors: [], fonts: { ready: true, missing: [] } };

describe("layoutDiagnostics", () => {
  it("says nothing about a report that is fine", () => {
    expect(lines({ ...fine, slides: [{ index: 0, id: "wrap", ok: true, issues: [] }] })).toEqual(
      [],
    );
  });

  it("puts each issue at its slide's element, in words", () => {
    const report = {
      ...fine,
      ok: false,
      slides: [
        {
          index: 0,
          id: "wrap",
          issues: [
            { kind: "wrap", target: "slide-title", lines: 3, maxLines: 2, text: "Ein Titel, der" },
          ],
        },
        {
          index: 1,
          id: "overflow",
          issues: [
            {
              kind: "overflow",
              target: "div#zu-hoch",
              by: { top: 0, right: 0, bottom: 252.5, left: 0 },
            },
            { kind: "clipped", target: "p#kasten" },
          ],
        },
        {
          index: 2,
          issues: [
            { kind: "render-error", message: "Kaputt" },
            { kind: "structure", message: "The child drew 2 slides, not one." },
          ],
        },
      ],
    };
    expect(lines(report)).toEqual([
      'deck.tsx:11:5 error slide 1 ("wrap"): "slide-title" runs to 3 lines, 2 at most: "Ein Titel, der" (layout-wrap)',
      'deck.tsx:17:5 error slide 2 ("overflow"): "div#zu-hoch" reaches beyond its bounds on the slide: 252.5px at the bottom (layout-overflow)',
      'deck.tsx:17:5 error slide 2 ("overflow"): "p#kasten" cuts off its own content (layout-clipped)',
      'deck.tsx:21:5 error slide 3: the slide threw while it was drawn: "Kaputt" (render-error)',
      "deck.tsx:21:5 error slide 3: The child drew 2 slides, not one. (structure)",
    ]);
  });

  it("reports what the page threw and the faces that did not load", () => {
    const report = {
      ...fine,
      ok: false,
      errors: [{ kind: "error", message: "x is not defined" }],
      fonts: { ready: false, missing: ["Sofia Sans Variable"] },
    };
    expect(lines(report)).toEqual([
      'deck.tsx:1:1 error the page threw: "x is not defined" (render-error)',
      'deck.tsx:1:1 error the face "Sofia Sans Variable" did not load (font-missing)',
      "deck.tsx:1:1 error the page's fonts were not ready (font-missing)",
    ]);
  });

  it("places an issue of a slide the source does not know at the head of the file", () => {
    const report = { ...fine, slides: [{ index: 7, issues: [{ kind: "clipped", target: "p" }] }] };
    expect(lines(report)).toEqual([
      'deck.tsx:1:1 error slide 8: "p" cuts off its own content (layout-clipped)',
    ]);
  });

  it.each([undefined, null, "report", 3, [], {}, { slides: "none" }])(
    "is one error for %j, which is no report",
    (report) => {
      expect(lines(report)).toEqual([
        "deck.tsx:1:1 error the player wrote no report: the deck did not start (render-error)",
      ]);
    },
  );

  it("does not pass a report that says no without naming an issue this reads", () => {
    expect(lines({ ...fine, ok: false })).toMatchObject([expect.stringContaining("(layout)")]);
    expect(
      lines({ ...fine, slides: [{ index: 0, issues: [{ kind: "new-kind" }, "text", null] }] }),
    ).toEqual(['deck.tsx:11:5 error slide 1 ("wrap"): the player reports "new-kind" (layout)']);
  });

  it("writes a page's own text out safely", () => {
    const report = {
      ...fine,
      slides: [{ index: 0, issues: [{ kind: "render-error", message: "a\u001b[31mb\nc" }] }],
    };
    const [line = ""] = lines(report);
    expect(line.includes("\u001b") || line.includes("\n")).toBe(false);
    expect(line).toContain("\\u001b[31mb\\nc");
  });
});
