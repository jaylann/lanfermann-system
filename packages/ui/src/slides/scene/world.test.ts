import { describe, expect, it } from "vitest";

import type { Rect } from "./camera";
import {
  arrivalDelays,
  entryState,
  groupRect,
  layoutWorld,
  nodeRect,
  sceneBeats,
  type SceneWire,
  type SceneWorld,
  unionRect,
  viewRect,
  wirePaths,
} from "./world";

// A column of the world's grid starts every 416 units, a row every 144; a node is 320 by 112.
const BOX = { w: 1664, h: 480 };

const rects = (entries: Record<string, Rect>) => new Map(Object.entries(entries));
const at = (col: number, row: number) => nodeRect({ id: "", label: "", col, row });

// Three in a row, and the node under the first.
const a = at(1, 1); // 0..320 × 0..112
const b = at(2, 1); // 416..736
const d = at(3, 1); // 832..1152
const c = at(2, 2); // 416..736 × 144..256
const under = at(1, 2); // 0..320 × 144..256

describe("nodeRect", () => {
  it("places a node on the grid, taking the gaps it spans", () => {
    expect(at(1, 1)).toEqual({ x: 0, y: 0, w: 320, h: 112 });
    expect(nodeRect({ id: "n", label: "", col: 3, row: 2, span: 2, rows: 2 })).toEqual({
      x: 832,
      y: 144,
      w: 736,
      h: 256,
    });
  });

  it("places a node in world units, at the default size unless told", () => {
    expect(nodeRect({ id: "n", label: "", x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      w: 320,
      h: 112,
    });
    expect(nodeRect({ id: "n", label: "", x: 10, y: 20, w: 200, h: 80 })).toEqual({
      x: 10,
      y: 20,
      w: 200,
      h: 80,
    });
  });

  it("refuses a node without a place", () => {
    expect(() => nodeRect({ id: "n", label: "", col: 2 })).toThrow(/col.*row/);
  });
});

describe("rectangles around", () => {
  it("joins rectangles, and gives nothing for none", () => {
    expect(unionRect([a, c])).toEqual({ x: 0, y: 0, w: 736, h: 256 });
    expect(unionRect([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it("frames a group 24 units past its nodes", () => {
    expect(groupRect([a, c])).toEqual({ x: -24, y: -24, w: 784, h: 304 });
  });
});

describe("wirePaths", () => {
  const wire = (from: string, to: string, extra: Partial<SceneWire> = {}): SceneWire => ({
    from,
    to,
    ...extra,
  });
  const paths = (...args: Parameters<typeof wirePaths>) => wirePaths(...args).map((path) => path.d);

  it("runs a level wire onwards as an S that is straight, or a straight elbow", () => {
    // From the right edge at 320 to the left edge at 416, both at the middle, 56.
    const boxes = rects({ a, b });
    expect(paths(boxes, [wire("a", "b")], "curve")).toEqual(["M320 56C368 56,368 56,416 56"]);
    expect(paths(boxes, [wire("a", "b")], "elbow")).toEqual(["M320 56L416 56"]);
  });

  it("turns halfway across at right angles, or curves there", () => {
    // Into the node one row down: its middle is at 200; halfway across is 368.
    const boxes = rects({ a, c });
    expect(paths(boxes, [wire("a", "c")], "elbow")).toEqual(["M320 56L368 56L368 200L416 200"]);
    expect(paths(boxes, [wire("a", "c")], "curve")).toEqual(["M320 56C368 56,368 200,416 200"]);
  });

  it("spreads the ends on one edge 12 apart, ordered by the other ends", () => {
    // Two wires leave a: the one to b (middle 56) above, the one to c (middle 200) below.
    const boxes = rects({ a, b, c });
    expect(paths(boxes, [wire("a", "c"), wire("a", "b")], "elbow")).toEqual([
      "M320 62L368 62L368 200L416 200",
      "M320 50L368 50L368 56L416 56",
    ]);
  });

  it("takes a lane over a box in the way", () => {
    // a to d runs through b. Over b (y -8) and under it (y 120) cost the same, 128: the first
    // found, over, is taken. The lane starts 8 before b (408) and ends 8 after it (744).
    const boxes = rects({ a, b, d });
    const [lane] = wirePaths(boxes, [wire("a", "d")], "curve");
    expect(lane?.d).toBe("M320 56C364 56,364 -8,408 -8H744C788 -8,788 56,832 56");
    // Its hull reaches up to the lane.
    expect(lane?.hull).toEqual({ x: 320, y: -8, w: 512, h: 64 });
    // The elbow turns halfway between a and b (368) and between b and d (784).
    expect(paths(boxes, [wire("a", "d")], "elbow")).toEqual([
      "M320 56L368 56L368 -8L784 -8L784 56L832 56",
    ]);
  });

  it("runs a wire back under the boxes, from bottom middle to bottom middle", () => {
    // d's middle is 992, a's 160; 32 under the row's bottom (112).
    const boxes = rects({ a, b, d });
    expect(paths(boxes, [wire("d", "a")], "curve")).toEqual(["M992 112L992 144L160 144L160 112"]);
    expect(paths(boxes, [wire("d", "a", { via: "above" })], "curve")).toEqual([
      "M992 0L992 -32L160 -32L160 0",
    ]);
  });

  it("runs a wire back to a neighbour of the row straight, left edge to right edge", () => {
    // Nothing stands between d (832) and b (736 is its right edge): level at the middle, 56.
    expect(paths(rects({ a, b, d }), [wire("d", "b")], "curve")).toEqual(["M832 56L736 56"]);
  });

  it("runs a wire back under a box of the next row that is in its way", () => {
    // c (144..256) stands under b: the line goes 32 under c, at 288.
    const boxes = rects({ a, b, c, d });
    expect(paths(boxes, [wire("d", "a")], "elbow")).toEqual(["M992 112L992 288L160 288L160 112"]);
  });

  it("joins boxes above each other straight, or with a turn when they share little", () => {
    expect(paths(rects({ a, under }), [wire("a", "under")], "elbow")).toEqual(["M160 112L160 144"]);
    // Shares 20 units of width: bottom middle (160, 112) to top middle (460, 300), turning at 206.
    const aside = { x: 300, y: 300, w: 320, h: 112 };
    expect(paths(rects({ a, aside }), [wire("a", "aside")], "elbow")).toEqual([
      "M160 112L160 206L460 206L460 300",
    ]);
    expect(paths(rects({ a, aside }), [wire("a", "aside")], "curve")).toEqual([
      "M160 112C160 206,460 206,460 300",
    ]);
  });

  it("refuses a wire to a node that is not there, or to itself", () => {
    expect(() => wirePaths(rects({ a }), [wire("a", "b")], "curve")).toThrow(/"b"/);
    expect(() => wirePaths(rects({ a }), [wire("a", "a")], "curve")).toThrow(/starts where/);
  });
});

// The world of the beats below: Anfrage and Rückruf framed as one group, Termin after them.
const world: SceneWorld = {
  nodes: [
    { id: "anfrage", label: "Anfrage", col: 1, row: 1 },
    { id: "rueckruf", label: "Rückruf", col: 2, row: 1 },
    { id: "termin", label: "Termin", col: 3, row: 1 },
  ],
  groups: [{ id: "kontakt", label: "Kontakt", nodes: ["anfrage", "rueckruf"] }],
  wires: [
    { from: "anfrage", to: "rueckruf" },
    { from: "rueckruf", to: "termin" },
    { from: "termin", to: "anfrage" },
  ],
};
const layout = layoutWorld(world);

describe("layoutWorld", () => {
  it("bounds the nodes and the frames together", () => {
    // Nodes 0..1152 × 0..112, the frame -24..760 × -24..136, the wire back down to 144.
    expect(layout.bounds).toEqual({ x: -24, y: -24, w: 1176, h: 168 });
    expect(layout.wires.map((placed) => placed.key)).toEqual([
      "anfrage>rueckruf",
      "rueckruf>termin",
      "termin>anfrage",
    ]);
  });

  it("refuses two of one id, the reserved id, and a group of strangers", () => {
    const node = { label: "", col: 1, row: 1 };
    expect(() =>
      layoutWorld({
        nodes: [
          { id: "x", ...node },
          { id: "x", ...node },
        ],
      }),
    ).toThrow(/two nodes/);
    expect(() => layoutWorld({ nodes: [{ id: "all", ...node }] })).toThrow(/whole world/);
    expect(() =>
      layoutWorld({
        nodes: [{ id: "x", ...node }],
        groups: [{ id: "g", label: "", nodes: ["y"] }],
      }),
    ).toThrow(/"y"/);
  });
});

describe("viewRect", () => {
  it("reads all, an id, several ids and a rectangle", () => {
    expect(viewRect(layout, "all")).toEqual(layout.bounds);
    expect(viewRect(layout, "termin")).toEqual({ x: 832, y: 0, w: 320, h: 112 });
    expect(viewRect(layout, ["rueckruf", "termin"])).toEqual({ x: 416, y: 0, w: 736, h: 112 });
    expect(viewRect(layout, { x: 1, y: 2, w: 3, h: 4 })).toEqual({ x: 1, y: 2, w: 3, h: 4 });
    expect(() => viewRect(layout, "angebot", "beat 2")).toThrow(/beat 2.*"angebot"/);
  });
});

describe("sceneBeats", () => {
  const beats = sceneBeats(
    layout,
    [
      { view: "all" },
      { show: ["termin"], highlight: ["termin"] },
      { view: "anfrage", highlight: ["kontakt"] },
    ],
    BOX,
  );

  it("opens on the whole world with what no beat brings in", () => {
    const [first] = beats;
    // 1176 by 160 fits at 1; the frame's corner (-24, -24) lands on (0, 48).
    expect(first?.camera).toEqual({ x: 24, y: 72, scale: 1 });
    expect([...(first?.present ?? [])]).toEqual([
      "anfrage",
      "rueckruf",
      "kontakt",
      "anfrage>rueckruf",
    ]);
    expect(first?.visible).toEqual(first?.present);
    expect(first?.focus).toBe(false);
  });

  it("keeps the camera, brings Termin in and dims the rest", () => {
    const second = beats[1];
    expect(second?.camera).toEqual(beats[0]?.camera);
    expect(second?.present.has("termin")).toBe(true);
    expect(second?.present.has("rueckruf>termin")).toBe(true);
    expect([...(second?.highlight ?? [])]).toEqual(["termin"]);
    expect(second?.focus).toBe(true);
  });

  it("zooms to one node, drops the frame it cuts, and lights a group with its nodes", () => {
    const third = beats[2];
    expect(third?.camera).toEqual({ x: 0, y: 48, scale: 1 });
    // The frame would start at x -24: outside the box, so it is not drawn.
    expect(third?.visible.has("kontakt")).toBe(false);
    expect(third?.visible.has("termin")).toBe(true);
    expect([...(third?.highlight ?? [])]).toEqual([
      "anfrage",
      "rueckruf",
      "kontakt",
      "anfrage>rueckruf",
    ]);
  });

  it("marches a loop over the wires between its neighbours and back", () => {
    const [looping] = sceneBeats(layout, [{ loop: ["anfrage", "rueckruf", "termin"] }], BOX);
    expect([...(looping?.loopWires ?? [])]).toEqual([
      "anfrage>rueckruf",
      "rueckruf>termin",
      "termin>anfrage",
    ]);
    expect(looping?.highlight.has("termin")).toBe(true);
  });

  it("keeps the alignment of a view the next beat keeps", () => {
    const kept = sceneBeats(layout, [{ view: "termin", align: "end" }, {}], BOX);
    // Termin at 1, standing on the right edge: 1664 - (832 + 320).
    expect(kept[1]?.camera).toEqual({ x: 512, y: 48, scale: 1 });
  });

  it("reads no beats as one beat on the whole world", () => {
    expect(sceneBeats(layout, [], BOX)).toHaveLength(1);
  });

  it("refuses ids the world does not have", () => {
    expect(() => sceneBeats(layout, [{ show: ["angebot"] }], BOX)).toThrow(/beat 0 shows/);
    expect(() => sceneBeats(layout, [{}, { highlight: ["x"] }], BOX)).toThrow(/beat 1 highlights/);
    expect(() => sceneBeats(layout, [{ loop: ["kontakt"] }], BOX)).toThrow(/loops through/);
  });
});

describe("entryState", () => {
  const [first] = sceneBeats(layout, [{ view: "all" }], BOX);

  it("opens empty at the first view, so that everything arrives", () => {
    if (!first) throw new Error("no beat");
    const entry = entryState(layout, first, undefined, BOX);
    expect(entry.present.size).toBe(0);
    expect(entry.camera).toBe(first.camera);
  });

  it("opens full at `from`, so that the camera travels on and nothing arrives", () => {
    if (!first) throw new Error("no beat");
    const entry = entryState(layout, first, "termin", BOX);
    expect(entry.camera).toEqual({ x: -832, y: 48, scale: 1 });
    expect(entry.present).toBe(first.present);
    expect(entry.visible.has("anfrage")).toBe(false);
  });
});

describe("arrivalDelays", () => {
  it("staggers by column, frames first, wires after their nodes", () => {
    const [first] = sceneBeats(layout, [{}], BOX);
    const delays = arrivalDelays(layout, new Set(), first?.present ?? new Set());
    // Two columns, 110 apart from 250; the frame 150 before its first node; the wire into
    // Rückruf at 450 plus Rückruf's column.
    expect(Object.fromEntries(delays)).toEqual({
      anfrage: 250,
      rueckruf: 360,
      termin: 470,
      kontakt: 100,
      "anfrage>rueckruf": 560,
      "rueckruf>termin": 670,
      "termin>anfrage": 450,
    });
  });

  it("packs many columns into the same 660ms, and leaves what stays alone", () => {
    const wide = layoutWorld({
      nodes: Array.from({ length: 8 }, (_, index) => ({
        id: `n${index}`,
        label: "",
        col: index + 1,
        row: 1,
      })),
    });
    const all = new Set(wide.nodes.map((placed) => placed.id));
    expect(arrivalDelays(wide, new Set(), all).get("n7")).toBe(910);
    expect(arrivalDelays(wide, new Set(["n0"]), all).has("n0")).toBe(false);
  });
});
