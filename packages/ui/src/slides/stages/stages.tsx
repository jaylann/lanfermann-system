import type { ReactNode } from "react";

import { DiagramCanvas } from "@/slides/diagram/diagram-canvas";
import { arrowHead, DASH, GATE_RADIUS } from "@/slides/diagram/geometry";
import type { IconGlyph } from "@/slides/icon/icons";
import { stagesLayout } from "@/slides/stages/layout";

export type StagesProps = {
  /** The stages in order. `icon` sets one of `ICONS` before the title. The label counts them unless you name it. `highlight` gives one stage the accent edge. `lines` is how many lines the text takes, 2 by default. */
  items: Array<{
    title: ReactNode;
    text?: ReactNode;
    label?: ReactNode;
    icon?: IconGlyph;
    highlight?: boolean;
    marker?: number;
    lines?: number;
  }>;
  /** One entry per gap between two stages: `true` draws a checkpoint on the connector, a name of two or three characters („G1“) writes it above; `null` leaves the connector plain. */
  gates?: Array<string | boolean | null>;
  /** Paths back to an earlier stage, counted from 1, drawn dashed in the accent under the row. Paths from the same stage share one line. */
  returns?: Array<{ from: number; to: number; label?: ReactNode }>;
  /** What a checkpoint means, as the legend's first entry. */
  gateNote?: ReactNode;
  /** What a return path means, as the legend's second entry. */
  returnNote?: ReactNode;
  /** Height of the stage boxes in px, when the default does not fit the text. */
  height?: number;
};

// The legend draws a short piece of connector, 48 by 32, with the sign on it.
const SAMPLE = 48;

/**
 * Three to six stages in a row, with the checkpoints between them and the paths that lead back.
 *
 * For a process whose order matters and whose checkpoints or loops are the point; a process
 * without them is `Steps`. Stages are equal boxes across the twelve columns. A checkpoint is a
 * small open disc in the accent on the connector, with its name above when it has one. Return
 * paths run under the row, dashed, and each says in two words why it is taken. With six stages
 * keep every text to two lines of 18 characters. The legend explains the disc and the dashed line
 * once; do not explain them in the title.
 */
export function Stages({
  items,
  gates = [],
  returns = [],
  gateNote,
  returnNote,
  height,
}: StagesProps) {
  const { dense, nodes, edges } = stagesLayout(items, gates, returns, height);
  return (
    <DiagramCanvas
      slot="slide-stages"
      dense={dense}
      nodes={nodes}
      edges={edges}
      alt={`Ablauf in ${items.length} Stufen`}
    >
      {gateNote != null || returnNote != null ? (
        <div className="flex gap-16 pt-4">
          {gateNote != null ? (
            <div className="flex items-center gap-4">
              <svg
                role="img"
                aria-label="Freigabe"
                width={SAMPLE}
                height="32"
                viewBox={`0 0 ${SAMPLE} 32`}
                fill="none"
                strokeWidth={2}
              >
                <path d={`M0 16H${SAMPLE}`} className="stroke-line" />
                <circle
                  cx={SAMPLE / 2}
                  cy="16"
                  r={GATE_RADIUS}
                  className="fill-ground stroke-accent"
                />
              </svg>
              <p className="text-slide-meta text-fg-body">{gateNote}</p>
            </div>
          ) : null}
          {returnNote != null ? (
            <div className="flex items-center gap-4">
              <svg
                role="img"
                aria-label="Rücksprung"
                width={SAMPLE}
                height="32"
                viewBox={`0 0 ${SAMPLE} 32`}
                fill="none"
                strokeWidth={2}
                className="stroke-accent"
              >
                <path d={`M0 16H${SAMPLE}`} strokeDasharray={DASH} />
                <path d={arrowHead([0, 16], [SAMPLE, 16])} />
              </svg>
              <p className="text-slide-meta text-fg-body">{returnNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </DiagramCanvas>
  );
}
