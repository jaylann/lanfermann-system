import type { ReactNode } from "react";

import { BrowserFrame } from "@/slides/browser-frame/browser-frame";
import { span } from "@/slides/lib/grid";
import { Meta } from "@/slides/meta/meta";
import { Split } from "@/slides/split/split";

export type BeforeAfterProps = {
  /** The old state, with the same props as BrowserFrame. */
  before: {
    url: ReactNode;
    src?: string;
    alt?: string;
    markers?: Array<{ n: number; x: number; y: number }>;
  };
  /** The new state. */
  after: {
    url: ReactNode;
    src?: string;
    alt?: string;
    markers?: Array<{ n: number; x: number; y: number }>;
  };
  /** The two labels. „Vorher“ and „Nachher“ by default. */
  labels?: [ReactNode, ReactNode];
  /** Height of both frames in px, 440 by default. */
  height?: number;
};

/**
 * Two browser frames of the same page: before and after.
 *
 * Same page, same viewport, same scroll position on both sides, so the eye compares like with
 * like. Old on the left, new on the right. Markers on the right side only, where they point at
 * what changed.
 */
export function BeforeAfter({
  before,
  after,
  labels = ["Vorher", "Nachher"],
  height = 440,
}: BeforeAfterProps) {
  // The root is the `Split`'s: two sides of six columns, each a label over its frame.
  return (
    <Split ratio="6|6" align="start">
      {[before, after].map((side, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Meta>{labels[index]}</Meta>
          <BrowserFrame width={span(6)} height={height} {...side} />
        </div>
      ))}
    </Split>
  );
}
