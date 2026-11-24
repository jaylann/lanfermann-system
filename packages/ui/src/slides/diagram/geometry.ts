/**
 * The geometry of a diagram on the slide grid, in px: where a box stands, how a connector runs
 * between two boxes, where its arrowhead, its label and its checkpoint sit. No React and no DOM,
 * only numbers and SVG paths, as the Lanfermann Freelance artifact works them out.
 */
import { SLIDE_COLUMN, SLIDE_GUTTER, span } from "@/slides/lib/grid";

/** How far an arrowhead's two strokes reach back along the line and out to its sides. */
export const ARROW_HEAD = 9;
/** Radius of the open disc that marks a checkpoint on a connector. */
export const GATE_RADIUS = 10;
/** Width of the name written above a checkpoint, centred on the disc. */
export const GATE_LABEL_WIDTH = 64;
/** A connector that is taken only sometimes: 8px drawn, 8px open. */
export const DASH = "8 8";
/** Width of a connector's label when the edge names none. */
export const LABEL_WIDTH = 240;
/** A marker stands this far above its box, so a diagram with markers starts this much lower. */
export const MARKER_RISE = 16;

/** From the left edge of one grid column to the left edge of the next. */
const COLUMN_PITCH = SLIDE_COLUMN + SLIDE_GUTTER;
/** Two boxes face each other when their sides share at least this much. */
const MIN_FACING = 24;
/** How far a return path runs under (or over) the row before it turns. */
const DROP = 64;

/** A place on the grid: `col` and `row` count from 1, `span` is 3 columns and `rows` 1 by default. */
export type GridPlacement = { col: number; row: number; span?: number; rows?: number };
/** A place in px from the diagram's top left corner, for the parts that lay out their own row. */
export type PixelPlacement = { x: number; y: number; w: number; h: number };
export type Placement = GridPlacement | PixelPlacement;

/** A rectangle with its centre (`cx`, `cy`), its right edge (`r`) and its bottom edge (`b`). */
export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  r: number;
  b: number;
};

export type Point = readonly [x: number, y: number];

/** What steers a connector's route besides the two boxes. */
export type EdgeRouting = {
  /** A return path that leaves and enters on the boxes' bottom (or top) edges. */
  via?: "below" | "above";
  /** How far the return path runs from the boxes, 64 by default. */
  drop?: number;
  /** Where the return path leaves its box, from the box's left edge; the middle by default. */
  fromX?: number;
  /** Where the return path enters its box, from the box's left edge; 32 by default. */
  toX?: number;
  /** `bus` sets the label on the horizontal run instead of beside the entry. */
  labelAt?: "bus";
};

/** Where a connector's label starts: its left edge, or its middle when `align` is `center`. */
export type EdgeLabel = { x: number; y: number; align: "left" | "center" };

export type EdgeRoute = {
  /** The corners of the line, from the first box to the second. */
  points: readonly Point[];
  /** The line as an SVG path. */
  path: string;
  /** The open arrowhead at the line's end, as an SVG path. */
  head: string;
  /** The centre of a checkpoint's disc, on the line's first run. */
  gate: { x: number; y: number };
  label: EdgeLabel;
  /** How far down the route reaches, when it leaves the boxes' own height. */
  extent?: number;
};

/** A positioned block: the inline style of an absolutely placed element. */
export type Rect = { left: number; top: number; width: number; height: number };

function boxOf(x: number, y: number, w: number, h: number): Box {
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
}

/**
 * The rectangle of a box. On the grid a column starts every 144px and a row every
 * `rowHeight + rowGap`; a box of several rows takes the gaps between them. `offsetY` moves the
 * whole diagram down (the room for markers).
 */
export function nodeBox(place: Placement, rowHeight: number, rowGap: number, offsetY = 0): Box {
  if ("x" in place) return boxOf(place.x, offsetY + place.y, place.w, place.h);
  const rows = place.rows ?? 1;
  return boxOf(
    (place.col - 1) * COLUMN_PITCH,
    offsetY + (place.row - 1) * (rowHeight + rowGap),
    span(place.span ?? 3),
    rows * rowHeight + (rows - 1) * rowGap,
  );
}

/** How much two ranges share; negative when they stand apart. */
export function overlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

/** The middle of what two ranges share. */
export function sharedMiddle(a0: number, a1: number, b0: number, b1: number): number {
  return (Math.max(a0, b0) + Math.min(a1, b1)) / 2;
}

/** A line through the points as an SVG path: `M368 68L432 68`. */
export function polyline(points: readonly Point[]): string {
  return `M${points.map((point) => point.join(" ")).join("L")}`;
}

/**
 * An open arrowhead at `to`, for a line that arrives from `from`: two strokes of 9px back along
 * the line and 9px out to each side, a right angle whose tip is the line's end.
 */
export function arrowHead([fromX, fromY]: Point, [toX, toY]: Point): string {
  const length = Math.hypot(toX - fromX, toY - fromY) || 1;
  const ux = (toX - fromX) / length;
  const uy = (toY - fromY) / length;
  const backX = toX - ux * ARROW_HEAD;
  const backY = toY - uy * ARROW_HEAD;
  return (
    `M${backX - uy * ARROW_HEAD} ${backY + ux * ARROW_HEAD}` +
    `L${toX} ${toY}` +
    `L${backX + uy * ARROW_HEAD} ${backY - ux * ARROW_HEAD}`
  );
}

function routed(
  points: readonly [Point, Point, ...Point[]],
  label: EdgeLabel,
  extent?: number,
): EdgeRoute {
  const [start, second] = points;
  const end = points[points.length - 1] ?? second;
  const beforeEnd = points[points.length - 2] ?? start;
  return {
    points,
    path: polyline(points),
    head: arrowHead(beforeEnd, end),
    // The disc sits in the middle of the first run, 4px back from it: the arrowhead takes room.
    gate: { x: (start[0] + second[0]) / 2 - 4, y: start[1] },
    label,
    extent,
  };
}

/**
 * The route of a connector from one box to another, found from where they stand:
 *
 * - with `via`, a return path: out of the first box's bottom (or top) edge, along a line 64px
 *   below (above) both boxes, into the second box 32px from its left edge;
 * - between boxes that stand side by side and share at least 24px of height, a straight line
 *   through the middle of what they share;
 * - between boxes that stand above each other and share at least 24px of width, the same,
 *   upright;
 * - otherwise one right angle: out of the first box's side at its middle, then down or up into
 *   the second box at its middle.
 *
 * The label of a level line is centred 40px above it; every other label starts 16px right of
 * the line.
 */
export function edgeRoute(edge: EdgeRouting, from: Box, to: Box): EdgeRoute {
  if (edge.via === "below" || edge.via === "above") {
    const below = edge.via === "below";
    const drop = edge.drop ?? DROP;
    const bus = below ? Math.max(from.b, to.b) + drop : Math.min(from.y, to.y) - drop;
    const startX = from.x + (edge.fromX ?? from.w / 2);
    const endX = to.x + (edge.toX ?? 32);
    const onBus = edge.labelAt === "bus";
    return routed(
      [
        [startX, below ? from.b : from.y],
        [startX, bus],
        [endX, bus],
        [endX, below ? to.b : to.y],
      ],
      onBus
        ? { x: Math.min(startX, endX) + 16, y: bus + (below ? 12 : -44), align: "left" }
        : { x: endX + 16, y: below ? to.b + 14 : to.y - 46, align: "left" },
      bus + (onBus && below ? 48 : 8),
    );
  }

  const besideEachOther = to.x >= from.r || from.x >= to.r;
  if (overlap(from.y, from.b, to.y, to.b) >= MIN_FACING && besideEachOther) {
    const y = sharedMiddle(from.y, from.b, to.y, to.b);
    const rightwards = to.x >= from.r;
    const startX = rightwards ? from.r : from.x;
    const endX = rightwards ? to.x : to.r;
    return routed(
      [
        [startX, y],
        [endX, y],
      ],
      { x: (startX + endX) / 2, y: y - 40, align: "center" },
    );
  }

  if (overlap(from.x, from.r, to.x, to.r) >= MIN_FACING) {
    const x = sharedMiddle(from.x, from.r, to.x, to.r);
    const downwards = to.y >= from.b;
    const startY = downwards ? from.b : from.y;
    const endY = downwards ? to.y : to.b;
    return routed(
      [
        [x, startY],
        [x, endY],
      ],
      { x: x + 16, y: (startY + endY) / 2 - 16, align: "left" },
    );
  }

  const startX = to.cx > from.cx ? from.r : from.x;
  const endY = to.cy > from.cy ? to.y : to.b;
  return routed(
    [
      [startX, from.cy],
      [to.cx, from.cy],
      [to.cx, endY],
    ],
    { x: to.cx + 16, y: (from.cy + endY) / 2 - 16, align: "left" },
  );
}

/** The left edge of a label's box of the given width. */
export function labelLeft(label: EdgeLabel, width: number): number {
  return label.align === "center" ? label.x - width / 2 : label.x;
}

/** The quiet field behind a group of boxes: its cells, and `pad` px (16 by default) around them. */
export function bandRect(
  band: Placement & { pad?: number },
  rowHeight: number,
  rowGap: number,
  offsetY = 0,
): Rect {
  const cells = nodeBox(band, rowHeight, rowGap, offsetY);
  const pad = band.pad ?? 16;
  return {
    left: cells.x - pad,
    top: cells.y - pad,
    width: cells.w + 2 * pad,
    height: cells.h + 2 * pad,
  };
}

/** Where a box's marker is pinned: 32px in from its right edge, 16px above its top. */
export function markerPosition(box: Box): { left: number; top: number } {
  return { left: box.r - 32, top: box.y - MARKER_RISE };
}

/** A box under 70% of four columns (358px) is narrow: its title is set at 24px. */
export function isNarrow(width: number): boolean {
  return width < span(4) * 0.7;
}

export type DiagramLayout = {
  /** One box per node, in the nodes' order. */
  boxes: Box[];
  /** One route per edge, in the edges' order. */
  routes: EdgeRoute[];
  /** One field per band, in the bands' order. */
  bands: Rect[];
  /** The height that holds every box, band and return path. */
  height: number;
};

/**
 * Lays a whole diagram out. An edge finds its boxes by node `id` (a node without one answers
 * to its index). When a node carries a marker, everything stands 16px lower, so the disc does
 * not leave the diagram's top edge.
 *
 * @throws When an edge names a node that is not among `nodes`.
 */
export function diagramLayout(
  nodes: ReadonlyArray<Placement & { id?: string; marker?: number }>,
  edges: ReadonlyArray<EdgeRouting & { from: string; to: string }>,
  bands: ReadonlyArray<Placement & { pad?: number }>,
  rowHeight: number,
  rowGap: number,
): DiagramLayout {
  const offsetY = nodes.some((node) => Boolean(node.marker)) ? MARKER_RISE : 0;

  const boxes: Box[] = [];
  const byId = new Map<string, Box>();
  nodes.forEach((node, index) => {
    const box = nodeBox(node, rowHeight, rowGap, offsetY);
    boxes.push(box);
    byId.set(node.id ?? String(index), box);
  });

  const routes = edges.map((edge, index) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      throw new Error(`Diagram: edge ${index} names a node that is not in \`nodes\`.`);
    }
    return edgeRoute(edge, from, to);
  });

  const bandRects = bands.map((band) => bandRect(band, rowHeight, rowGap, offsetY));

  const height = Math.max(
    0,
    ...boxes.map((box) => box.b),
    ...bandRects.map((rect) => rect.top + rect.height),
    ...routes.map((route) => route.extent ?? 0),
  );

  return { boxes, routes, bands: bandRects, height };
}
