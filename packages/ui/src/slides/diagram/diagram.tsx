import type { ReactNode } from "react";

import { DiagramCanvas } from "@/slides/diagram/diagram-canvas";
import { diagramStepCount } from "@/slides/diagram/steps";
import type { IconGlyph } from "@/slides/icon/icons";
import type { StepCounter } from "@/slides/step/steps";

export type DiagramProps = {
  /** The boxes. `col` and `row` count from 1 on the grid; `span` is the width in grid columns (3 by default), `rows` the height in rows. `items` splits one box into sections under hairlines (with a `title`, the box gets a head above them). `icon` (an `Icon` is `{ name: string; color: string | null; path: string; box?: number }`) sets a small picture before the title: a technology's mark from `MARKS` (`MARKS.postgresql`, `MARKS.python`, …) or a pictogram from `ICONS` (`ICONS.lock`, `ICONS.database`, …). `tone`: `accent` gives the one box the title talks about a 2px accent edge, `quiet` fills a box that stands apart (a person, an external service), `none` sets text without a box. `marker` puts a numbered disc on the corner. `step` is the click at which the box arrives, with its marker; without one it is there from the start. */
  nodes: Array<{
    id: string;
    col: number;
    row: number;
    span?: number;
    rows?: number;
    title?: ReactNode;
    text?: ReactNode;
    label?: ReactNode;
    code?: string;
    icon?: IconGlyph;
    items?: Array<{ title?: ReactNode; text?: ReactNode; code?: string; icon?: IconGlyph }>;
    tone?: "plain" | "accent" | "quiet" | "none";
    marker?: number;
    center?: boolean;
    step?: number;
  }>;
  /** The connectors, by node id. The route is found from where the boxes stand: a straight line between boxes that face each other, otherwise one right angle. `dashed` for what happens only sometimes, `accent` for the one path the title talks about, `plain` for a line without arrowhead, `via` for a return path that runs under or over the row. `step` is the click at which the connector draws itself, with its label; without one it comes with the later of its two boxes, and it never comes before them. */
  edges?: Array<{
    from: string;
    to: string;
    label?: ReactNode;
    dashed?: boolean;
    accent?: boolean;
    plain?: boolean;
    via?: "below" | "above";
    step?: number;
  }>;
  /** Quiet fields behind a group of boxes that belong together (a zone, a machine, a trust boundary). A band reaches `pad` px (16 by default) past its cells; it must not start in the first column or the first row with a pad, because a deck cannot place anything at a negative offset. `step` is the click at which the band arrives; without one it is there from the start. */
  bands?: Array<{
    col: number;
    row: number;
    span: number;
    rows?: number;
    pad?: number;
    step?: number;
  }>;
  /** A line of column heads above the diagram; the spans add up to `cols`. */
  heads?: Array<{ span: number; text: ReactNode }>;
  /** Width of the diagram in grid columns, 12 by default; 7 or 8 inside a Split. */
  cols?: number;
  /** Height of a row in px: 136 by default (104 when `dense`), room for a title and one line of text. */
  rowHeight?: number;
  /** Space between rows in px, 48 by default. */
  rowGap?: number;
  /** Titles at 24px instead of 32px. Chosen for you when a box is narrower than three columns. */
  dense?: boolean;
  /** What the diagram shows, in one sentence, for screen readers and exports. */
  alt?: string;
};

/**
 * Boxes and connectors on the slide's 12-column grid: an architecture, a data flow, any structure
 * that is not a plain row.
 *
 * The look every diagram of the kit follows. Boxes stand on the slide grid, on `surface` with a
 * 1px `line` edge and a 4px radius; a title at 32px strong (24px in a narrow box) and one muted
 * line. All boxes of a kind have the same size. Connectors are 2px lines in `line` with an open
 * arrowhead, straight or with one right angle, never curved, never crossing a box; draw only the
 * paths the slide talks about. One box may take the 2px `accent` edge and one path the accent
 * colour. Kinds of box differ by a label or by the quiet fill, not by colour or shape.
 *
 * Icons. Give the boxes an `icon` before their titles: a box that names a product takes that
 * product's mark in its own colour, from `MARKS` (Postgres, Python, Claude); any other box takes
 * a pictogram in the accent, from `ICONS` (a lock, a gear, a database). Every box of a diagram
 * carries one, or only the products do. The same thing gets the same icon across a deck.
 *
 * What needs a sentence stands beside the diagram: put a `marker` on the box and the sentence in
 * `Findings` with the same number, in a `Split`, instead of a callout with an arrow. At most
 * twelve boxes; a diagram with more is two slides. No forms on a slide with a diagram.
 *
 * Built up by steps, a diagram is told in the order its path is walked: give the boxes a `step`
 * as you would say them, and no more steps than there are things to say.
 */
export function Diagram(props: DiagramProps) {
  return <DiagramCanvas slot="slide-diagram" {...props} />;
}

Diagram.slideSteps = ((props) => diagramStepCount(props)) satisfies StepCounter<DiagramProps>;
