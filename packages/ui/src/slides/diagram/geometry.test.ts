import { describe, expect, it } from "vitest";

import {
  arrowHead,
  bandRect,
  diagramLayout,
  edgeRoute,
  type EdgeRouting,
  isNarrow,
  labelLeft,
  markerPosition,
  nodeBox,
  overlap,
  polyline,
  sharedMiddle,
} from "./geometry";

// The defaults of `Diagram`: rows of 136px, 48px apart. A column starts every 144px.
const ROW = 136;
const GAP = 48;

// The boxes of the artifact's architecture example, and one that faces none of them.
const voice = nodeBox({ col: 1, row: 1 }, ROW, GAP);
const agent = nodeBox({ col: 4, row: 1, span: 5, rows: 2 }, ROW, GAP);
const train = nodeBox({ col: 4, row: 3, span: 5 }, ROW, GAP);
const far = nodeBox({ col: 5, row: 3 }, ROW, GAP);

// Two of the four stages of the artifact's `Stages` example: 368px wide, 207px high.
const second = nodeBox({ x: 432, y: 0, w: 368, h: 207 }, ROW, GAP);
const third = nodeBox({ x: 864, y: 0, w: 368, h: 207 }, ROW, GAP);

describe("nodeBox", () => {
  it("places a box of five columns and two rows on the grid", () => {
    // x: three columns of 144. w: 5 * 80 + 4 * 64. h: 2 * 136 + 48.
    expect(agent).toEqual({ x: 432, y: 0, w: 656, h: 320, cx: 760, cy: 160, r: 1088, b: 320 });
  });

  it("takes three columns and one row by default, and moves down by the offset", () => {
    // y: 16 + one row of 136 and its gap of 48.
    expect(nodeBox({ col: 1, row: 2 }, ROW, GAP, 16)).toEqual({
      x: 0,
      y: 200,
      w: 368,
      h: 136,
      cx: 184,
      cy: 268,
      r: 368,
      b: 336,
    });
  });

  it("keeps a place given in px, under the same offset", () => {
    expect(nodeBox({ x: 1296, y: 0, w: 368, h: 207 }, ROW, GAP, 16)).toEqual({
      x: 1296,
      y: 16,
      w: 368,
      h: 207,
      cx: 1480,
      cy: 119.5,
      r: 1664,
      b: 223,
    });
  });
});

describe("edgeRoute", () => {
  it("draws a straight line between two boxes in one row", () => {
    const route = edgeRoute({}, voice, agent);
    // From the right edge of the first to the left edge of the second, through the middle of
    // the 136px they share.
    expect(route.points).toEqual([
      [368, 68],
      [432, 68],
    ]);
    expect(route.path).toBe("M368 68L432 68");
    expect(route.head).toBe("M423 77L432 68L423 59");
    expect(route.label).toEqual({ x: 400, y: 28, align: "center" });
    expect(route.gate).toEqual({ x: 396, y: 68 });
    expect(route.extent).toBeUndefined();
  });

  it("runs the same line backwards when the target stands to the left", () => {
    const route = edgeRoute({}, agent, voice);
    expect(route.path).toBe("M432 68L368 68");
    expect(route.head).toBe("M377 59L368 68L377 77");
  });

  it("draws an upright line between two boxes that stand above each other", () => {
    const route = edgeRoute({}, train, agent);
    // The boxes share the columns 432 to 1088; the line leaves the top of the lower one.
    expect(route.path).toBe("M760 368L760 320");
    expect(route.head).toBe("M769 329L760 320L751 329");
    expect(route.label).toEqual({ x: 776, y: 328, align: "left" });
  });

  it("turns one right angle between boxes that face on no side", () => {
    const route = edgeRoute({}, voice, far);
    // Out of the first box's right edge at its middle, then down into the second box's top.
    expect(route.points).toEqual([
      [368, 68],
      [760, 68],
      [760, 368],
    ]);
    expect(route.path).toBe("M368 68L760 68L760 368");
    expect(route.head).toBe("M751 359L760 368L769 359");
    expect(route.label).toEqual({ x: 776, y: 202, align: "left" });
    expect(route.gate).toEqual({ x: 560, y: 68 });

    // The other way round: out of the left edge, up into the bottom.
    const back = edgeRoute({}, far, voice);
    expect(back.path).toBe("M576 436L184 436L184 136");
    expect(back.head).toBe("M193 145L184 136L175 145");
    expect(back.label).toEqual({ x: 200, y: 270, align: "left" });
  });

  it("needs 24px of shared height for a straight line", () => {
    const left = nodeBox({ x: 0, y: 0, w: 100, h: 100 }, ROW, GAP);
    const shares24 = nodeBox({ x: 200, y: 76, w: 100, h: 100 }, ROW, GAP);
    const shares20 = nodeBox({ x: 200, y: 80, w: 100, h: 100 }, ROW, GAP);
    expect(edgeRoute({}, left, shares24).path).toBe("M100 88L200 88");
    expect(edgeRoute({}, left, shares20).path).toBe("M100 50L250 50L250 80");
  });

  it("leads a return path under the row", () => {
    const route = edgeRoute({ via: "below" }, third, second);
    // Out of the middle of the third stage, 64px below the boxes, into the second stage 32px
    // from its left edge.
    expect(route.points).toEqual([
      [1048, 207],
      [1048, 271],
      [464, 271],
      [464, 207],
    ]);
    expect(route.path).toBe("M1048 207L1048 271L464 271L464 207");
    expect(route.head).toBe("M473 216L464 207L455 216");
    expect(route.label).toEqual({ x: 480, y: 221, align: "left" });
    expect(route.extent).toBe(279);
  });

  it("sets the label on the shared line of two return paths", () => {
    const route = edgeRoute({ via: "below", toX: 336, labelAt: "bus" }, third, second);
    expect(route.path).toBe("M1048 207L1048 271L768 271L768 207");
    expect(route.label).toEqual({ x: 784, y: 283, align: "left" });
    expect(route.extent).toBe(319);
  });

  it("leads a return path over the row, with its own drop and start", () => {
    const from = nodeBox({ x: 864, y: 100, w: 368, h: 207 }, ROW, GAP);
    const to = nodeBox({ x: 432, y: 140, w: 368, h: 207 }, ROW, GAP);
    const route = edgeRoute({ via: "above", drop: 24, fromX: 40 }, from, to);
    // 24px above the higher of the two boxes.
    expect(route.path).toBe("M904 100L904 76L464 76L464 140");
    expect(route.head).toBe("M455 131L464 140L473 131");
    expect(route.label).toEqual({ x: 480, y: 94, align: "left" });
    expect(route.extent).toBe(84);

    const onBus = edgeRoute({ via: "above", drop: 24, fromX: 40, labelAt: "bus" }, from, to);
    expect(onBus.label).toEqual({ x: 480, y: 32, align: "left" });
  });
});

describe("the helpers", () => {
  it("measure what two ranges share", () => {
    expect(overlap(0, 136, 0, 320)).toBe(136);
    expect(overlap(368, 504, 0, 320)).toBe(-48);
    expect(sharedMiddle(0, 136, 0, 320)).toBe(68);
    expect(sharedMiddle(432, 1088, 576, 944)).toBe(760);
  });

  it("write a line and an arrowhead as SVG paths", () => {
    expect(
      polyline([
        [0, 16],
        [48, 16],
      ]),
    ).toBe("M0 16L48 16");
    // The arrow of the legend in `Stages`: 9px back and 9px to each side of the tip.
    expect(arrowHead([0, 16], [48, 16])).toBe("M39 25L48 16L39 7");
    // A line without length has no direction: the head collapses into its point.
    expect(arrowHead([5, 5], [5, 5])).toBe("M5 5L5 5L5 5");
  });

  it("place a band, a label and a marker", () => {
    expect(bandRect({ col: 4, row: 1, span: 5, rows: 2 }, ROW, GAP)).toEqual({
      left: 416,
      top: -16,
      width: 688,
      height: 352,
    });
    expect(bandRect({ col: 4, row: 2, span: 5, pad: 24 }, ROW, GAP, 16)).toEqual({
      left: 408,
      top: 176,
      width: 704,
      height: 184,
    });

    expect(labelLeft({ x: 400, y: 28, align: "center" }, 240)).toBe(280);
    expect(labelLeft({ x: 776, y: 328, align: "left" }, 240)).toBe(776);

    expect(markerPosition(agent)).toEqual({ left: 1056, top: -16 });
  });

  it("call a box narrow below 70% of four columns", () => {
    expect(isNarrow(224)).toBe(true);
    expect(isNarrow(358)).toBe(true);
    expect(isNarrow(368)).toBe(false);
  });
});

describe("diagramLayout", () => {
  const stages = [
    { id: "1", x: 0, y: 0, w: 368, h: 207 },
    { id: "2", x: 432, y: 0, w: 368, h: 207 },
    { id: "3", x: 864, y: 0, w: 368, h: 207 },
    { id: "4", x: 1296, y: 0, w: 368, h: 207 },
  ];
  const paths: Array<EdgeRouting & { from: string; to: string }> = [
    { from: "1", to: "2" },
    { from: "3", to: "2", via: "below" },
  ];

  it("is as high as its lowest box, band or return path", () => {
    const layout = diagramLayout(stages, paths, [], ROW, GAP);
    expect(layout.boxes).toHaveLength(4);
    expect(layout.routes[0]?.path).toBe("M368 103.5L432 103.5");
    expect(layout.routes[0]?.gate).toEqual({ x: 396, y: 103.5 });
    // The return path runs at 271 and asks for 8px under it.
    expect(layout.height).toBe(279);

    const banded = diagramLayout(
      [{ col: 1, row: 1 }],
      [],
      [{ col: 1, row: 1, span: 3, rows: 2 }],
      ROW,
      GAP,
    );
    expect(banded.bands).toEqual([{ left: -16, top: -16, width: 400, height: 352 }]);
    expect(banded.height).toBe(336);
  });

  it("starts 16px lower when a box carries a marker", () => {
    const marked = stages.map((stage, index) => (index === 2 ? { ...stage, marker: 1 } : stage));
    const layout = diagramLayout(marked, paths, [], ROW, GAP);
    expect(layout.boxes.map((box) => box.y)).toEqual([16, 16, 16, 16]);
    expect(layout.routes[1]?.path).toBe("M1048 223L1048 287L464 287L464 223");
    expect(layout.height).toBe(295);
  });

  it("finds a node without an id by its index", () => {
    const layout = diagramLayout(
      [
        { col: 1, row: 1 },
        { col: 5, row: 1 },
      ],
      [{ from: "0", to: "1" }],
      [],
      ROW,
      GAP,
    );
    expect(layout.routes[0]?.path).toBe("M368 68L576 68");
  });

  it("refuses an edge to a node that does not exist", () => {
    expect(() =>
      diagramLayout([{ id: "a", col: 1, row: 1 }], [{ from: "a", to: "b" }], [], ROW, GAP),
    ).toThrow("edge 0");
  });
});
