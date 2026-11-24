import { type CSSProperties, Fragment, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  DASH,
  diagramLayout,
  type EdgeRouting,
  GATE_LABEL_WIDTH,
  GATE_RADIUS,
  isNarrow,
  LABEL_WIDTH,
  labelLeft,
  markerPosition,
  type Placement,
} from "@/slides/diagram/geometry";
import { drawOrder, edgeSteps } from "@/slides/diagram/steps";
import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";
import { SLIDE_COLUMN, span } from "@/slides/lib/grid";
import { Marker } from "@/slides/marker/marker";
import { stepAttributes } from "@/slides/step/steps";

/** What a box, or one section of a box, says. */
type NodeContent = {
  title?: ReactNode;
  text?: ReactNode;
  /** A muted line above the title. */
  label?: ReactNode;
  /** A literal string in the mono face, on one line. */
  code?: string;
  icon?: IconGlyph;
  /** Sets the title in the accent. */
  accent?: boolean;
};

type Tone = "plain" | "accent" | "quiet" | "none";

/**
 * A box as `Diagram` takes it, or as `Stages` and `Loop` build it: placed in px instead of on
 * the grid, with its own `dense` and an accent title.
 */
export type DiagramCanvasNode = Placement &
  NodeContent & {
    id?: string;
    items?: NodeContent[];
    tone?: Tone;
    marker?: number;
    center?: boolean;
    /** Overrides the diagram's `dense` and the choice by width. */
    dense?: boolean;
    /** The step the box (and its marker) appears at; there from the start without one. */
    step?: number;
  };

/** A connector as `Diagram` takes it, with what `Stages` adds: a checkpoint and a steered return. */
export type DiagramCanvasEdge = EdgeRouting & {
  from: string;
  to: string;
  label?: ReactNode;
  dashed?: boolean;
  accent?: boolean;
  plain?: boolean;
  /** `true` draws a checkpoint's disc on the connector, a string also writes its name above. */
  gate?: string | boolean;
  /** Width of the label in px, 240 by default. */
  labelWidth?: number;
  /**
   * The step the connector appears at. Without one it comes with the later of its two boxes, and
   * it never comes before them (`edgeStep` in `steps.ts`).
   */
  step?: number;
};

export type DiagramCanvasProps = {
  /** The root's `data-slot`. */
  slot: string;
  nodes: DiagramCanvasNode[];
  edges?: DiagramCanvasEdge[];
  bands?: Array<Placement & { pad?: number; step?: number }>;
  heads?: Array<{ span: number; text: ReactNode }>;
  cols?: number;
  rowHeight?: number;
  rowGap?: number;
  dense?: boolean;
  alt?: string;
  /** A block under the drawing, 16px below it: the legend of `Stages`. */
  children?: ReactNode;
};

// The edge and fill of a box. `quiet` takes an edge in its own fill, so that every box has the
// same inner size; `none` is text alone.
const TONES: Record<Tone, string> = {
  plain: "rounded-[4px] border border-line bg-surface",
  accent: "rounded-[4px] border-2 border-accent bg-surface",
  quiet: "rounded-[4px] border border-surface-quiet bg-surface-quiet",
  none: "",
};

/** Each item with the one at its index in the other list. */
function paired<A, B>(first: readonly A[], second: readonly B[]): Array<[A, B]> {
  return first.flatMap((item, index) => {
    const other = second[index];
    return other === undefined ? [] : [[item, other]];
  });
}

/**
 * The style of a connector's group: its step's, and `--draw-order` from the second connector
 * of a step on, which `slides.css` turns into a later start. Nothing for a connector without a
 * step.
 */
function edgeStyle(
  step: CSSProperties | undefined,
  order: number,
): (CSSProperties & { "--draw-order"?: number }) | undefined {
  if (step === undefined) return undefined;
  return order > 0 ? { ...step, "--draw-order": order } : step;
}

type NodeBodyProps = {
  content: NodeContent;
  dense: boolean;
  centered?: boolean;
  /** The title of a box is a heading under the slide's title; the title of a section in it is not. */
  heading: boolean;
};

/** A label, a title (or a line of code) with its icon, and one muted line. */
function NodeBody({ content, dense, centered = false, heading }: NodeBodyProps) {
  const Title = heading ? "h3" : "p";
  const hasTitle = content.title != null;
  const titleClass = cn(
    dense ? "text-slide-meta font-semibold" : "text-slide-body leading-[1.3] font-semibold",
    content.accent ? "text-accent" : "text-fg",
  );
  const code = content.code ? (
    <p className="font-mono text-slide-code leading-[1.3] whitespace-nowrap text-fg">
      {content.code}
    </p>
  ) : null;
  // An icon stands before the title, or before the code when there is no title.
  const icon = hasTitle || code != null ? content.icon : undefined;
  const mutedLine = cn("text-slide-meta text-fg-muted", centered && "text-center");
  return (
    <>
      {content.label != null ? <p className={mutedLine}>{content.label}</p> : null}
      {icon ? (
        <div className={cn("flex items-center gap-3", centered && "justify-center")}>
          <Icon icon={icon} size={dense ? 28 : 32} />
          {hasTitle ? <Title className={titleClass}>{content.title}</Title> : code}
        </div>
      ) : hasTitle ? (
        <Title className={cn(titleClass, centered && "text-center")}>{content.title}</Title>
      ) : null}
      {icon && !hasTitle ? null : code}
      {content.text != null ? <p className={mutedLine}>{content.text}</p> : null}
    </>
  );
}

/**
 * The drawing that `Diagram`, `Stages` and `Loop` share: boxes placed absolutely on a canvas of
 * `cols` grid columns, their connectors in one SVG under them, then the connectors' labels and
 * the markers. The numbers come from `geometry.ts`.
 *
 * The boxes are real text. The SVG holds only the lines and carries `alt` as its name.
 *
 * Built up by steps, every box, band and marker is marked with `stepAttributes` and arrives as
 * any plain markup does. A connector is marked too (`slide-diagram-edge`), with its labels; a
 * solid one also carries `data-draw` and a line of `pathLength="1"`, so that `slides.css` can
 * draw it from its start to its end while the slide is presented, its arrowhead last, and
 * `--draw-order` when several connectors draw at one step. A dashed connector fades: its dashes
 * are the dash array the drawing would need. Without steps nothing is marked and nothing is
 * split: the drawing is the still picture it always was.
 */
export function DiagramCanvas({
  slot,
  nodes,
  edges = [],
  bands = [],
  heads = [],
  cols = 12,
  rowHeight,
  rowGap = 48,
  dense,
  alt = "Diagramm",
  children,
}: DiagramCanvasProps) {
  const width = span(cols);
  const layout = diagramLayout(nodes, edges, bands, rowHeight ?? (dense ? 104 : 136), rowGap);
  const { height } = layout;
  const boxes = paired(nodes, layout.boxes);
  const steps = edgeSteps(nodes, edges);
  const orders = drawOrder(steps);
  const routes = paired(edges, layout.routes).map(([edge, route], index) => ({
    edge,
    route,
    at: steps[index] ?? 0,
    order: orders[index] ?? 0,
  }));

  return (
    <div data-slot={slot} className="flex flex-none flex-col gap-4" style={{ width }}>
      {heads.length > 0 ? (
        <div
          className="grid gap-16"
          style={{ gridTemplateColumns: `repeat(${cols}, ${SLIDE_COLUMN}px)` }}
        >
          {heads.map((head, index) => (
            <p
              key={index}
              className="text-slide-meta text-fg-muted"
              style={{ gridColumn: `span ${head.span}` }}
            >
              {head.text}
            </p>
          ))}
        </div>
      ) : null}
      <div className="relative flex-none" style={{ width, height }}>
        {layout.bands.map((rect, index) => {
          const step = stepAttributes(bands[index]?.step);
          return (
            <div
              key={`b${index}`}
              data-slot="slide-diagram-band"
              {...step}
              className="absolute rounded-[4px] bg-surface-quiet"
              style={{ ...step.style, ...rect }}
            />
          );
        })}
        <svg
          role="img"
          aria-label={alt}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          className="absolute top-0 left-0"
        >
          {routes.map(({ edge, route, at, order }, index) => {
            const step = stepAttributes(at);
            const draws = at > 0 && !edge.dashed;
            return (
              <g
                key={index}
                data-slot="slide-diagram-edge"
                data-draw={draws ? "" : undefined}
                {...step}
                style={edgeStyle(step.style, order)}
                className={edge.accent ? "stroke-accent" : "stroke-line"}
                strokeWidth={2}
              >
                <path
                  data-slot="slide-diagram-line"
                  d={route.path}
                  strokeDasharray={edge.dashed ? DASH : undefined}
                  pathLength={draws ? 1 : undefined}
                />
                {edge.plain ? null : <path data-slot="slide-diagram-head" d={route.head} />}
                {edge.gate ? (
                  <circle
                    data-slot="slide-diagram-gate"
                    cx={route.gate.x}
                    cy={route.gate.y}
                    r={GATE_RADIUS}
                    className="fill-ground stroke-accent"
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        {boxes.map(([node, box], index) => {
          const denseBox = node.dense ?? dense ?? isNarrow(box.w);
          const tone = node.tone ?? "plain";
          const step = stepAttributes(node.step);
          return (
            <div
              key={`n${index}`}
              data-slot="slide-diagram-node"
              {...step}
              className={cn(
                "absolute flex flex-col gap-2",
                tone !== "none" && (denseBox ? "p-4" : "p-6"),
                node.center && "items-center justify-center",
                TONES[tone],
              )}
              style={{ ...step.style, left: box.x, top: box.y, width: box.w, height: box.h }}
            >
              {node.items ? (
                <>
                  {node.title != null ? (
                    <NodeBody
                      content={{ title: node.title, icon: node.icon }}
                      dense={denseBox}
                      heading
                    />
                  ) : null}
                  {node.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={cn(
                        "flex flex-1 flex-col gap-2",
                        (itemIndex > 0 || node.title != null) && "border-t border-line pt-2",
                      )}
                    >
                      <NodeBody content={item} dense={denseBox} heading={false} />
                    </div>
                  ))}
                </>
              ) : (
                <NodeBody content={node} dense={denseBox} centered={node.center} heading />
              )}
            </div>
          );
        })}
        {routes.map(({ edge, route, at }, index) => {
          const labelWidth = edge.labelWidth ?? LABEL_WIDTH;
          const step = stepAttributes(at);
          return (
            <Fragment key={`l${index}`}>
              {edge.label != null ? (
                <p
                  data-slot="slide-diagram-label"
                  {...step}
                  className={cn(
                    "absolute text-slide-meta",
                    route.label.align === "center" ? "text-center" : "text-left",
                    edge.accent ? "text-accent" : "text-fg-muted",
                  )}
                  style={{
                    ...step.style,
                    left: labelLeft(route.label, labelWidth),
                    top: route.label.y,
                    width: labelWidth,
                  }}
                >
                  {edge.label}
                </p>
              ) : null}
              {typeof edge.gate === "string" && edge.gate !== "" ? (
                <p
                  data-slot="slide-diagram-gate-label"
                  {...step}
                  className="absolute text-center text-slide-meta font-semibold text-accent"
                  style={{
                    ...step.style,
                    left: route.gate.x - GATE_LABEL_WIDTH / 2,
                    top: route.gate.y - 52,
                    width: GATE_LABEL_WIDTH,
                  }}
                >
                  {edge.gate}
                </p>
              ) : null}
            </Fragment>
          );
        })}
        {boxes.map(([node, box], index) => {
          if (!node.marker) return null;
          const step = stepAttributes(node.step);
          // A marker of a box that comes at a step is held by a box that carries the step: the
          // disc itself takes no attributes but its place.
          return step["data-step"] === undefined ? (
            <Marker
              key={`m${index}`}
              n={node.marker}
              style={{ position: "absolute", ...markerPosition(box) }}
            />
          ) : (
            <div
              key={`m${index}`}
              data-slot="slide-diagram-marker"
              {...step}
              className="absolute"
              style={{ ...step.style, ...markerPosition(box) }}
            >
              <Marker n={node.marker} />
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
