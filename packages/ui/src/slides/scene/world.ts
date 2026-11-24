/**
 * The world of a `Scene` and what each beat makes of it, as numbers only: where the nodes and
 * the frames of their groups stand, how a wire runs, what is there, what is seen and what stands
 * out at a beat, and when what arrives comes in. No React and no DOM.
 *
 * World units are px at scale 1. The camera (`camera.ts`) never draws them larger.
 */
import type { IconGlyph } from "@/slides/icon/icons";

import { type Camera, type CameraAlign, fitView, insideBox, type Rect, type Size } from "./camera";

/** A node's size when it names none: room for an icon, a label and a detail line of 24px. */
export const NODE_W = 320;
export const NODE_H = 112;
/** The world's grid: a column of nodes every 416 units, a row every 144. */
export const COL_GAP = 96;
export const ROW_GAP = 32;
/** How far a group's frame reaches past its nodes. */
export const GROUP_PAD = 24;
/** The room a group's label takes above its frame, in px on screen. */
export const LABEL_ROOM = 40;
/** How far apart the ends of several wires on one edge of a node stand. */
const SPREAD = 12;
/** How far a wire back runs under (or over) the lowest (highest) box in its way. */
const DROP = 32;
/** Wires that share a lane keep this far apart. */
const LANE_GAP = 6;
/** Two boxes above each other are joined by a straight wire when they share this much width. */
const MIN_FACING = 24;

/**
 * When what arrives at a beat comes in, in ms after the step (the reference's numbers): nodes
 * from 250, one column of the world after the other 110 apart (closer when many columns arrive,
 * so that the last starts by 910); a group's frame 150 before its first node; a wire from 450,
 * with the column of the node it leads into.
 */
export const ARRIVAL = { node: 250, column: 110, columns: 660, frameLead: 150, wire: 450 };

/** How a node is filled. */
export type SceneTone = "plain" | "quiet" | "solid" | "ghost";

/** How wires bend: the reference's smooth curves, or the kit's right angles. */
export type SceneRoute = "curve" | "elbow";

export type SceneNode = {
  id: string;
  label: string;
  detail?: string;
  icon?: IconGlyph;
  tone?: SceneTone;
  /** On the world's grid, from 1. */
  col?: number;
  row?: number;
  /** Columns and rows the node takes, 1 by default. */
  span?: number;
  rows?: number;
  /** In world units, instead of `col` and `row`. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type SceneGroup = { id: string; label: string; detail?: string; nodes: readonly string[] };

export type SceneWire = {
  from: string;
  to: string;
  /** Names the wire for a beat's `show`; `from>to` otherwise. */
  id?: string;
  dashed?: boolean;
  /** A wire back runs under its boxes; `above` sends it over them. */
  via?: "below" | "above";
};

export type SceneWorld = {
  nodes: readonly SceneNode[];
  groups?: readonly SceneGroup[];
  wires?: readonly SceneWire[];
  route?: SceneRoute;
};

/**
 * Where the camera looks: `"all"` (the whole world), the id of a node or group, several ids, or a
 * rectangle in world units. (`"all"` is a string like an id, so the type cannot name it apart.)
 */
export type SceneView = string | readonly string[] | Rect;

/** What a beat asks of the world (its caption is the part's own business). */
export type SceneBeatPlan = {
  view?: SceneView;
  align?: CameraAlign;
  show?: readonly string[];
  highlight?: readonly string[];
  loop?: readonly string[];
};

export type PlacedNode = { id: string; node: SceneNode; rect: Rect };
export type PlacedGroup = { id: string; group: SceneGroup; rect: Rect };
export type PlacedWire = { key: string; wire: SceneWire; d: string };
/** A wire's SVG path and the rectangle that holds all of it. */
export type WirePath = { d: string; hull: Rect };

export type SceneLayout = {
  nodes: PlacedNode[];
  groups: PlacedGroup[];
  wires: PlacedWire[];
  /** Every node, group frame and wire together: the view `all`. */
  bounds: Rect;
  /** The rectangle of every node and group frame, by id. */
  rects: ReadonlyMap<string, Rect>;
};

/** One beat as the part draws it. */
export type BeatState = {
  /** The rectangle of the world the camera fits. */
  view: Rect;
  camera: Camera;
  /** Node ids, group ids and wire keys that are there at this beat. */
  present: ReadonlySet<string>;
  /** What is there and drawn wholly inside the box (a group with room for its label, a wire with both its ends). */
  visible: ReadonlySet<string>;
  /** Whether something stands out, so that the rest dims. */
  focus: boolean;
  /** Node ids, group ids and wire keys that stand out. */
  highlight: ReadonlySet<string>;
  /** The nodes of the loop, in order. */
  loop: readonly string[];
  /** The wires between neighbours of the loop, and from its last node back to its first. */
  loopWires: ReadonlySet<string>;
};

/** A wire's key: its `id`, or `from>to`. */
export function wireKey(wire: SceneWire): string {
  return wire.id ?? `${wire.from}>${wire.to}`;
}

/**
 * Where a node stands. On the grid, column `c` starts at `(c - 1) * 416` and row `r` at
 * `(r - 1) * 144`; a node of several columns or rows takes the gaps between them.
 *
 * @throws When the node has neither `col` and `row` nor `x` and `y`.
 */
export function nodeRect(node: SceneNode): Rect {
  if (node.x !== undefined && node.y !== undefined) {
    return { x: node.x, y: node.y, w: node.w ?? NODE_W, h: node.h ?? NODE_H };
  }
  if (node.col === undefined || node.row === undefined) {
    throw new Error(`Scene: node "${node.id}" needs \`col\` and \`row\`, or \`x\` and \`y\`.`);
  }
  const span = node.span ?? 1;
  const rows = node.rows ?? 1;
  return {
    x: (node.col - 1) * (NODE_W + COL_GAP),
    y: (node.row - 1) * (NODE_H + ROW_GAP),
    w: span * NODE_W + (span - 1) * COL_GAP,
    h: rows * NODE_H + (rows - 1) * ROW_GAP,
  };
}

/** The smallest rectangle around all of them; an empty one at 0 for none. */
export function unionRect(rects: readonly Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.w));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** The frame of a group: its nodes and 24 units around them. */
export function groupRect(nodeRects: readonly Rect[]): Rect {
  const cells = unionRect(nodeRects);
  return {
    x: cells.x - GROUP_PAD,
    y: cells.y - GROUP_PAD,
    w: cells.w + 2 * GROUP_PAD,
    h: cells.h + 2 * GROUP_PAD,
  };
}

// ---------- wires ----------

type Point = readonly [x: number, y: number];

const round = (value: number) => Number(value.toFixed(2));

function bezier(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** How far the S of a curve reaches out level before it turns. */
function reach(x1: number, x2: number): number {
  return Math.max(24, (x2 - x1) * 0.5);
}

/**
 * A path, with the points it is drawn from: its corners and the control points of its curves.
 * A curve stays inside the hull of its control points, so these bound the whole wire.
 */
type Drawn = { d: string; points: readonly Point[] };

const at = ([x, y]: Point) => `${round(x)} ${round(y)}`;

/** A path through the points with straight runs. */
function polylinePath(points: readonly Point[]): Drawn {
  return { d: `M${points.map(at).join("L")}`, points };
}

/** One cubic curve from `start` to `end`. */
function cubicPath(start: Point, first: Point, second: Point, end: Point): Drawn {
  return {
    d: `M${at(start)}C${at(first)},${at(second)},${at(end)}`,
    points: [start, first, second, end],
  };
}

/** The S from one point to another: out level, a smooth turn, in level (the reference's wire). */
function curvePath(x1: number, y1: number, x2: number, y2: number): Drawn {
  const dx = reach(x1, x2);
  return cubicPath([x1, y1], [x1 + dx, y1], [x2 - dx, y2], [x2, y2]);
}

/** Points along that S, the ends left out. */
function alongCurve(x1: number, y1: number, x2: number, y2: number): Point[] {
  const dx = reach(x1, x2);
  return Array.from({ length: 23 }, (_, index) => {
    const t = (index + 1) / 24;
    return [bezier(x1, x1 + dx, x2 - dx, x2, t), bezier(y1, y1, y2, y2, t)] as const;
  });
}

/** Out level, down or up halfway, in level; one straight run when both ends are level. */
function elbowPoints(x1: number, y1: number, x2: number, y2: number): Point[] {
  if (Math.abs(y1 - y2) < 0.5)
    return [
      [x1, y1],
      [x2, y1],
    ];
  const middle = (x1 + x2) / 2;
  return [
    [x1, y1],
    [middle, y1],
    [middle, y2],
    [x2, y2],
  ];
}

/** Points along a polyline, 11 to each run, the corners left out. */
function alongPolyline(points: readonly Point[]): Point[] {
  const samples: Point[] = [];
  points.forEach(([bx, by], index) => {
    const [ax, ay] = points[index - 1] ?? [bx, by];
    if (index === 0) return;
    for (let step = 1; step < 12; step++) {
      samples.push([ax + ((bx - ax) * step) / 12, ay + ((by - ay) * step) / 12]);
    }
  });
  return samples;
}

/** Whether a point is in a box, or within 2 units of its sides and 4 of its top and bottom. */
function hits(rect: Rect, [px, py]: Point): boolean {
  return px > rect.x - 2 && px < rect.x + rect.w + 2 && py > rect.y - 4 && py < rect.y + rect.h + 4;
}

type Lane = { y: number; from: number; to: number };

type Onwards = {
  index: number;
  fromId: string;
  toId: string;
  from: Rect;
  to: Rect;
  y1: number;
  y2: number;
};

const middleY = (rect: Rect) => rect.y + rect.h / 2;

/** The items by a key, in first-seen order. */
function groupBy<T>(items: readonly T[], key: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(key(item));
    if (list) list.push(item);
    else groups.set(key(item), [item]);
  }
  return [...groups.values()];
}

/**
 * Spreads the ends of the wires that share one edge: 12 units apart around the edge's middle
 * (closer on a low box), ordered by the middle of the box at each wire's other end.
 */
function spreadEnds(list: Onwards[], side: "from" | "to"): void {
  const end = side === "from" ? "y1" : "y2";
  const other = (item: Onwards) => middleY(side === "from" ? item.to : item.from);
  const sorted = [...list].sort((a, b) => other(a) - other(b) || a.index - b.index);
  const first = sorted[0];
  if (!first) return;
  const edge = first[side];
  const count = sorted.length;
  const step = count > 1 ? Math.min(SPREAD, (edge.h - 22) / (count - 1)) : 0;
  sorted.forEach((item, position) => {
    item[end] = middleY(edge) + (position - (count - 1) / 2) * step;
  });
}

/** An onwards wire: direct, or along a lane past the boxes in its way. */
function onwardsPath(
  item: Onwards,
  route: SceneRoute,
  obstacles: ReadonlyArray<readonly [string, Rect]>,
  lanes: Lane[],
): Drawn {
  const { from, to, y1, y2 } = item;
  const x1 = from.x + from.w;
  const x2 = to.x;
  const others = obstacles
    .filter(([id]) => id !== item.fromId && id !== item.toId)
    .map(([, rect]) => rect);
  const direct = route === "curve" ? null : elbowPoints(x1, y1, x2, y2);
  const samples = direct ? alongPolyline(direct) : alongCurve(x1, y1, x2, y2);
  const directPath = direct ? polylinePath(direct) : curvePath(x1, y1, x2, y2);
  if (!samples.some((point) => others.some((rect) => hits(rect, point)))) return directPath;

  const between = others.filter((rect) => rect.x + rect.w > x1 + 1 && rect.x < x2 - 1);
  let best: { y: number; cost: number; way: number } | undefined;
  for (const rect of between) {
    for (const [y, way] of [
      [rect.y - 8, -1],
      [rect.y + rect.h + 8, 1],
    ] as const) {
      if (between.some((other) => y > other.y - 6 && y < other.y + other.h + 6)) continue;
      const cost = Math.abs(y - y1) + Math.abs(y - y2);
      if (!best || cost < best.cost) best = { y, cost, way };
    }
  }
  if (!best) return directPath;

  const left = Math.min(...between.map((rect) => rect.x));
  const right = Math.max(...between.map((rect) => rect.x + rect.w));
  // The lane never starts before the wire's own start nor ends after its end.
  const xa = Math.max(x1 + 12, left - 8);
  const xb = Math.min(x2 - 12, right + 8);
  let lane = best.y;
  const way = best.way;
  while (
    lanes.some((other) => Math.abs(other.y - lane) < LANE_GAP && other.from < xb && xa < other.to)
  ) {
    lane += way * LANE_GAP;
  }
  lanes.push({ y: lane, from: xa, to: xb });

  if (route === "elbow") {
    const turnIn = (x1 + left) / 2;
    const turnOut = (right + x2) / 2;
    return polylinePath([
      [x1, y1],
      [turnIn, y1],
      [turnIn, lane],
      [turnOut, lane],
      [turnOut, y2],
      [x2, y2],
    ]);
  }
  const h1 = (xa - x1) * 0.5;
  const h2 = (x2 - xb) * 0.5;
  // Into the lane, along it, out of it.
  const into = cubicPath([x1, y1], [x1 + h1, y1], [xa - h1, lane], [xa, lane]);
  const out: Point[] = [
    [xb + h2, lane],
    [x2 - h2, y2],
    [x2, y2],
  ];
  return {
    d: `${into.d}H${round(xb)}C${out.map(at).join(",")}`,
    points: [...into.points, [xb, lane], ...out],
  };
}

/** A wire between boxes above each other. */
function upDownPath(from: Rect, to: Rect, shared: number, route: SceneRoute): Drawn {
  const down = middleY(to) >= middleY(from);
  const y1 = down ? from.y + from.h : from.y;
  const y2 = down ? to.y : to.y + to.h;
  if (shared >= MIN_FACING) {
    const x = (Math.max(from.x, to.x) + Math.min(from.x + from.w, to.x + to.w)) / 2;
    return polylinePath([
      [x, y1],
      [x, y2],
    ]);
  }
  const x1 = from.x + from.w / 2;
  const x2 = to.x + to.w / 2;
  const turn = (y1 + y2) / 2;
  if (route === "curve") return cubicPath([x1, y1], [x1, turn], [x2, turn], [x2, y2]);
  return polylinePath([
    [x1, y1],
    [x1, turn],
    [x2, turn],
    [x2, y2],
  ]);
}

/** A wire back: down (up), along a line clear of every box in its way, up (down) into the target. */
function backPath(
  wire: SceneWire,
  from: Rect,
  to: Rect,
  obstacles: ReadonlyArray<readonly [string, Rect]>,
  lanes: Lane[],
): Drawn {
  const below = wire.via !== "above";
  const x1 = from.x + from.w / 2;
  const x2 = to.x + to.w / 2;
  const low = Math.min(x1, x2);
  const high = Math.max(x1, x2);
  const inWay = obstacles
    .map(([, rect]) => rect)
    .filter((rect) => rect.x < high + 1 && rect.x + rect.w > low - 1);
  let lane = below ? Math.max(from.y + from.h, to.y + to.h) + DROP : Math.min(from.y, to.y) - DROP;
  // Clear of every box in the way and of the other wires back. Each push moves the lane one way
  // only, past one box or one lane, so this ends; the bound is a guard.
  for (let attempt = 0; attempt < 64; attempt++) {
    const box = inWay.find((rect) => lane > rect.y - DROP + 1 && lane < rect.y + rect.h + DROP - 1);
    const shared = lanes.find(
      (other) => Math.abs(other.y - lane) < 2 * LANE_GAP && other.from < high && low < other.to,
    );
    if (box) lane = below ? box.y + box.h + DROP : box.y - DROP;
    else if (shared) lane = shared.y + (below ? 2 * LANE_GAP : -2 * LANE_GAP);
    else break;
  }
  lanes.push({ y: lane, from: low, to: high });
  return polylinePath([
    [x1, below ? from.y + from.h : from.y],
    [x1, lane],
    [x2, lane],
    [x2, below ? to.y + to.h : to.y],
  ]);
}

/**
 * A wire back between neighbours of one row: straight from the first box's left edge to the
 * second's right edge, through the middle of the height they share. None when they share less
 * than 24 units of height, when a box stands on that line between them, or with `via`.
 */
function besideBack(
  wire: SceneWire,
  from: Rect,
  to: Rect,
  obstacles: ReadonlyArray<readonly [string, Rect]>,
): Drawn | undefined {
  const right = to.x + to.w;
  const sharedHeight = Math.min(from.y + from.h, to.y + to.h) - Math.max(from.y, to.y);
  if (wire.via !== undefined || right > from.x || sharedHeight < MIN_FACING) return undefined;
  const y = (Math.max(from.y, to.y) + Math.min(from.y + from.h, to.y + to.h)) / 2;
  const blocked = obstacles.some(
    ([id, rect]) =>
      id !== wire.from &&
      id !== wire.to &&
      rect.x < from.x &&
      rect.x + rect.w > right &&
      y > rect.y - 4 &&
      y < rect.y + rect.h + 4,
  );
  return blocked
    ? undefined
    : polylinePath([
        [from.x, y],
        [right, y],
      ]);
}

/**
 * The paths of the wires, in the wires' order. A wire runs by where its boxes stand:
 *
 * - **Onwards** (the second box starts right of the first): out of the first box's right edge,
 *   into the second box's left edge. The ends of several wires on one edge stand 12 units apart,
 *   ordered by where their other ends are, so they do not cross there. With `curve` the wire is
 *   the reference's S, with `elbow` it turns at right angles halfway. A wire that would run
 *   through a box in between takes a lane over or under the boxes in between instead, the one
 *   nearer to both ends; wires on one lane keep 6 units apart.
 * - **Back** (the second box ends left of the first), or any wire with `via`: out of the first
 *   box's bottom (top) middle, along a line 32 units under (over) every box in its way, into the
 *   second box's bottom (top) middle, at right angles in both styles. Back to a neighbour in the
 *   same row with nothing between them, the wire runs straight from edge to edge.
 * - **Up or down** (the boxes share width): straight through the middle of what they share, or,
 *   sharing less than 24 units, from bottom middle to top middle with a turn halfway.
 *
 * Each comes with its hull: the rectangle that holds the whole wire, lanes and curves included.
 *
 * @throws When a wire names a box that is not in `rects`, or starts where it ends.
 */
export function wirePaths(
  rects: ReadonlyMap<string, Rect>,
  wires: readonly SceneWire[],
  route: SceneRoute,
): WirePath[] {
  const boxOf = (id: string, index: number): Rect => {
    const rect = rects.get(id);
    if (!rect) throw new Error(`Scene: wire ${index} names "${id}", which is not a node.`);
    return rect;
  };
  const obstacles = [...rects.entries()];
  const paths: Array<Drawn | undefined> = wires.map(() => undefined);
  const onwards: Onwards[] = [];

  wires.forEach((wire, index) => {
    if (wire.from === wire.to) throw new Error(`Scene: wire ${index} starts where it ends.`);
    const from = boxOf(wire.from, index);
    const to = boxOf(wire.to, index);
    if (wire.via === undefined && to.x >= from.x + from.w) {
      onwards.push({
        index,
        fromId: wire.from,
        toId: wire.to,
        from,
        to,
        y1: middleY(from),
        y2: middleY(to),
      });
    }
  });
  for (const list of groupBy(onwards, (item) => item.fromId)) spreadEnds(list, "from");
  for (const list of groupBy(onwards, (item) => item.toId)) spreadEnds(list, "to");

  const lanes: Lane[] = [];
  for (const item of onwards) paths[item.index] = onwardsPath(item, route, obstacles, lanes);

  const backLanes: Lane[] = [];
  return wires.map((wire, index) => {
    let drawn = paths[index];
    if (!drawn) {
      const from = boxOf(wire.from, index);
      const to = boxOf(wire.to, index);
      const shared = Math.min(from.x + from.w, to.x + to.w) - Math.max(from.x, to.x);
      drawn =
        wire.via === undefined && shared > 0
          ? upDownPath(from, to, shared, route)
          : (besideBack(wire, from, to, obstacles) ??
            backPath(wire, from, to, obstacles, backLanes));
    }
    return {
      d: drawn.d,
      hull: unionRect(drawn.points.map(([x, y]) => ({ x, y, w: 0, h: 0 }))),
    };
  });
}

// ---------- the world laid out ----------

/**
 * Lays the world out: every node's rectangle, every group's frame, every wire's path.
 *
 * @throws When a node or group is called `all` (the view of the whole world), two nodes or groups
 *   share an id, two wires share a key, a group frames no node or
 *   a node that is not in the world, or a wire names a box that is not a node.
 */
export function layoutWorld(world: SceneWorld): SceneLayout {
  const rects = new Map<string, Rect>();
  const claim = (id: string, rect: Rect) => {
    if (id === "all") throw new Error('Scene: "all" names the whole world, not a node or group.');
    if (rects.has(id)) throw new Error(`Scene: two nodes or groups are called "${id}".`);
    rects.set(id, rect);
  };
  const nodes = world.nodes.map((node) => {
    const rect = nodeRect(node);
    claim(node.id, rect);
    return { id: node.id, node, rect };
  });
  const nodeRects: ReadonlyMap<string, Rect> = new Map(rects);
  const groups = (world.groups ?? []).map((group) => {
    if (group.nodes.length === 0) throw new Error(`Scene: group "${group.id}" frames no node.`);
    const members = group.nodes.map((id) => {
      const rect = nodeRects.get(id);
      if (!rect) throw new Error(`Scene: group "${group.id}" names "${id}", which is not a node.`);
      return rect;
    });
    const rect = groupRect(members);
    claim(group.id, rect);
    return { id: group.id, group, rect };
  });
  const wires = world.wires ?? [];
  const keys = new Set<string>();
  for (const wire of wires) {
    const key = wireKey(wire);
    if (keys.has(key) || rects.has(key)) {
      throw new Error(
        `Scene: two wires, or a wire and a node, are called "${key}": give one an id.`,
      );
    }
    keys.add(key);
  }
  const paths = wirePaths(nodeRects, wires, world.route ?? "curve");
  return {
    nodes,
    groups,
    wires: wires.map((wire, index) => ({ key: wireKey(wire), wire, d: paths[index]?.d ?? "" })),
    bounds: unionRect([...rects.values(), ...paths.map((path) => path.hull)]),
    rects,
  };
}

function rectOf(layout: SceneLayout, id: string, where: string): Rect {
  const rect = layout.rects.get(id);
  if (!rect)
    throw new Error(`Scene: ${where} looks at "${id}", which is neither a node nor a group.`);
  return rect;
}

/**
 * The rectangle of the world a view names: the bounds of every node and frame for `all`, a node's
 * or a group frame's own rectangle, the rectangle around several of them, or the rectangle given.
 *
 * @throws When an id is neither a node nor a group (`where` says whose view it was).
 */
export function viewRect(layout: SceneLayout, view: SceneView, where = "a view"): Rect {
  if (view === "all") return layout.bounds;
  if (typeof view === "string") return rectOf(layout, view, where);
  if ("w" in view) return view;
  return unionRect(view.map((id) => rectOf(layout, id, where)));
}

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Every beat as it is drawn in a box of `box` px. What a beat shows stays: a node, group or wire
 * named in a beat's `show` is there from that beat on, and one that no beat names is there from
 * the start. A group no beat names is there with its first node, a wire with both its ends.
 * A beat without `view` keeps the camera (and its `align`) where the beat before left it; the
 * first beat looks at `all`. A group in `highlight` stands out with all its nodes, the nodes of a
 * `loop` stand out too, and a wire stands out when both its ends do.
 *
 * No beats is read as one beat that shows the whole world.
 *
 * @throws When a beat names an id the world does not have (a view or highlight: a node or group;
 *   a loop: a node; show: a node, group or wire).
 */
export function sceneBeats(
  layout: SceneLayout,
  beats: readonly SceneBeatPlan[],
  box: Size,
): BeatState[] {
  const plans: readonly SceneBeatPlan[] = beats.length > 0 ? beats : [{}];
  const nodeIds = new Set(layout.nodes.map((placed) => placed.id));
  const groups = new Map(layout.groups.map((placed) => [placed.id, placed.group]));

  const introduced = new Map<string, number>();
  const known = new Set([...nodeIds, ...groups.keys(), ...layout.wires.map((wire) => wire.key)]);
  plans.forEach((plan, index) => {
    for (const id of plan.show ?? []) {
      if (!known.has(id))
        throw new Error(`Scene: beat ${index} shows "${id}", which is not in the world.`);
      if (!introduced.has(id)) introduced.set(id, index);
    }
  });
  const comesIn = (id: string, index: number) => (introduced.get(id) ?? 0) <= index;

  let view: SceneView = "all";
  let align: CameraAlign = "start";
  return plans.map((plan, index) => {
    if (plan.view !== undefined) {
      view = plan.view;
      align = plan.align ?? "start";
    } else if (plan.align !== undefined) {
      align = plan.align;
    }
    const rect = viewRect(layout, view, `beat ${index}`);
    const camera = fitView(rect, box, { align });

    const present = new Set<string>();
    for (const { id } of layout.nodes) if (comesIn(id, index)) present.add(id);
    for (const { id, group } of layout.groups) {
      const there = introduced.has(id)
        ? comesIn(id, index)
        : group.nodes.some((node) => present.has(node));
      if (there) present.add(id);
    }
    for (const { key, wire } of layout.wires) {
      if (present.has(wire.from) && present.has(wire.to) && comesIn(key, index)) present.add(key);
    }

    const visible = visibleAt(layout, present, camera, box);

    const loop = [...(plan.loop ?? [])];
    for (const id of loop) {
      if (!nodeIds.has(id))
        throw new Error(`Scene: beat ${index} loops through "${id}", which is not a node.`);
    }
    const highlight = new Set<string>();
    for (const id of plan.highlight ?? []) {
      const group = groups.get(id);
      if (group) for (const node of group.nodes) highlight.add(node);
      else if (!nodeIds.has(id)) {
        throw new Error(
          `Scene: beat ${index} highlights "${id}", which is neither a node nor a group.`,
        );
      }
      highlight.add(id);
    }
    for (const id of loop) highlight.add(id);
    for (const { key, wire } of layout.wires) {
      if (highlight.has(wire.from) && highlight.has(wire.to)) highlight.add(key);
    }

    const loopWires = new Set<string>();
    if (loop.length > 1) {
      loop.forEach((id, position) => {
        const next = loop[(position + 1) % loop.length];
        for (const { key, wire } of layout.wires) {
          if (wire.from === id && wire.to === next) loopWires.add(key);
        }
      });
    }

    return {
      view: rect,
      camera,
      present,
      visible,
      focus: highlight.size > 0,
      highlight,
      loop,
      loopWires,
    };
  });
}

/** What of `present` is drawn wholly inside the box at this camera. */
function visibleAt(
  layout: SceneLayout,
  present: ReadonlySet<string>,
  camera: Camera,
  box: Size,
): Set<string> {
  const visible = new Set<string>();
  for (const { id, rect } of layout.nodes) {
    if (present.has(id) && insideBox(rect, camera, box)) visible.add(id);
  }
  for (const { id, rect } of layout.groups) {
    if (present.has(id) && insideBox(rect, camera, box, 1, LABEL_ROOM)) visible.add(id);
  }
  for (const { key, wire } of layout.wires) {
    if (present.has(key) && visible.has(wire.from) && visible.has(wire.to)) visible.add(key);
  }
  return visible;
}

/**
 * The state a presented slide opens in, one frame before its first beat, so that the first
 * beat's arrivals and camera can move. Without `from`, nothing is there yet and the camera
 * already stands at the first beat's view: everything of the first beat arrives. With `from`,
 * the first beat's world is there and the camera stands at `from`: it travels on from where the
 * slide before left it, and nothing arrives.
 */
export function entryState(
  layout: SceneLayout,
  first: BeatState,
  from: SceneView | undefined,
  box: Size,
): BeatState {
  const calm = { focus: false, highlight: EMPTY, loop: [], loopWires: EMPTY };
  if (from === undefined) return { ...first, ...calm, present: EMPTY, visible: EMPTY };
  const view = viewRect(layout, from, "`from`");
  const camera = fitView(view, box);
  return {
    ...first,
    ...calm,
    view,
    camera,
    visible: visibleAt(layout, first.present, camera, box),
  };
}

/**
 * When each node, group and wire that is in `after` and not in `before` comes in, in ms after
 * the step (see `ARRIVAL`). The columns are the distinct left edges of the arriving nodes, from
 * the left. What leaves, or stays, has no delay.
 */
export function arrivalDelays(
  layout: SceneLayout,
  before: ReadonlySet<string>,
  after: ReadonlySet<string>,
): Map<string, number> {
  const arriving = (id: string) => after.has(id) && !before.has(id);
  const nodes = layout.nodes.filter((placed) => arriving(placed.id));
  const columns = [...new Set(nodes.map((placed) => Math.round(placed.rect.x)))].sort(
    (a, b) => a - b,
  );
  const step =
    columns.length > 1 ? Math.min(ARRIVAL.column, ARRIVAL.columns / (columns.length - 1)) : 0;
  const delays = new Map<string, number>();
  const nodeDelay = new Map<string, number>();
  for (const placed of nodes) {
    const delay = Math.round(ARRIVAL.node + columns.indexOf(Math.round(placed.rect.x)) * step);
    nodeDelay.set(placed.id, delay);
    delays.set(placed.id, delay);
  }
  for (const { id, group } of layout.groups) {
    if (!arriving(id)) continue;
    const own = group.nodes.flatMap((node) => nodeDelay.get(node) ?? []);
    const first = own.length > 0 ? Math.min(...own) : ARRIVAL.node;
    delays.set(id, Math.max(0, first - ARRIVAL.frameLead));
  }
  for (const { key, wire } of layout.wires) {
    if (!arriving(key)) continue;
    const end = nodeDelay.get(wire.to) ?? nodeDelay.get(wire.from) ?? ARRIVAL.node;
    delays.set(key, end - ARRIVAL.node + ARRIVAL.wire);
  }
  return delays;
}
