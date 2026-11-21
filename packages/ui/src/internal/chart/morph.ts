"use client";

import { type RefObject, useLayoutEffect, useRef } from "react";

import { useReducedMotion } from "@/internal/reduced-motion";
import { atRest, type Moving, springForce, stepSpring } from "@/motion/spring-step";
import { springs } from "@/motion/springs";

import { areaPath, type Curve, linePath, type MaybePoint, resample } from "./path";

/** One series as it should end up: its points and the baseline its area closes on. */
export type Shape = {
  key: string;
  points: readonly MaybePoint[];
  /** Where zero stands, as a share of the height from the top. */
  base: number;
  curve: Curve;
};

type Drawn = {
  xs: number[];
  ys: Moving[];
  /** Which points are gaps; a gap does not move. */
  gaps: boolean[];
  base: Moving;
  target: Shape;
};

const force = springForce(springs.settle);

function pointsOf(drawn: Drawn): MaybePoint[] {
  return drawn.xs.map((x, index) => (drawn.gaps[index] ? null : { x, y: drawn.ys[index]!.value }));
}

/** Writes a shape straight onto its elements: `[data-series][data-shape]` inside the box. */
function paint(
  box: SVGSVGElement,
  key: string,
  points: readonly MaybePoint[],
  base: number,
  curve: Curve,
) {
  const line = linePath(points, curve);
  const area = areaPath(points, base, curve);
  for (const element of box.querySelectorAll<SVGPathElement>(
    `[data-series="${CSS.escape(key)}"]`,
  )) {
    element.setAttribute("d", element.dataset.shape === "area" ? area : line);
  }
}

/**
 * Lines that go to their new values instead of jumping: a series that changes (other data, a
 * new range, a series hidden beside it so the axis rescales) is moved point by point on the
 * `settle` spring, the spring the axis lines take in CSS. Where the number of points changes
 * (seven days become thirty), the old line is first read off at the new points, so it re-forms
 * rather than being swapped.
 *
 * React renders every path in its final shape, so the server and the first frame are right and
 * nothing here runs on load; the motion writes `d` straight onto the elements, frame by frame,
 * and React is not rendered while it runs. A path's `d` stays what React rendered whenever React
 * renders it again with the same value, so hovering during a morph is harmless.
 *
 * The motion is the one a stylesheet cannot run (a path's `d` does not transition in Safari),
 * so it is stepped by hand, as the calendar's selection is (`src/motion/spring-step.ts`).
 * Under reduced motion the lines change at once.
 */
export function useMorph(box: RefObject<SVGSVGElement | null>, shapes: readonly Shape[]) {
  const drawn = useRef(new Map<string, Drawn>());
  const frame = useRef(0);
  const still = useReducedMotion();

  useLayoutEffect(() => {
    const svg = box.current;
    if (!svg) return;
    const before = drawn.current;
    const next = new Map<string, Drawn>();
    let moving = false;

    for (const shape of shapes) {
      const xs = shape.points.map((point, index) =>
        point ? point.x : shape.points.length > 1 ? index / (shape.points.length - 1) : 0,
      );
      const gaps = shape.points.map((point) => point === null);
      const old = before.get(shape.key);
      if (!old || still) {
        next.set(shape.key, {
          xs,
          gaps,
          ys: shape.points.map((point) => ({ value: point?.y ?? 0, velocity: 0 })),
          base: { value: shape.base, velocity: 0 },
          target: shape,
        });
        continue;
      }
      const same = old.xs.length === xs.length && old.xs.every((x, index) => x === xs[index]);
      // The line as it stands now, read off at the new points; speed carries over where the
      // points are the same.
      const from = same ? old.ys.map((moving) => moving.value) : resample(pointsOf(old), xs);
      next.set(shape.key, {
        xs,
        gaps,
        ys: from.map((value, index) => ({
          value: value ?? shape.points[index]?.y ?? 0,
          velocity: same ? (old.ys[index]?.velocity ?? 0) : 0,
        })),
        base: old.base,
        target: shape,
      });
      moving = true;
    }
    drawn.current = next;
    cancelAnimationFrame(frame.current);
    if (!moving) return;

    // The first picture before the browser paints: the old line, where React drew the new one.
    for (const [key, state] of next)
      paint(svg, key, pointsOf(state), state.base.value, state.target.curve);

    let last = performance.now();
    const step = (now: number) => {
      const seconds = (now - last) / 1000;
      last = now;
      let resting = true;
      for (const [key, state] of drawn.current) {
        const { target } = state;
        state.ys = state.ys.map((moving, index) => {
          const goal = target.points[index]?.y;
          if (goal === undefined || state.gaps[index]) return moving;
          const stepped = stepSpring(moving, goal, force, seconds);
          if (!atRest(stepped, goal, 0.0005)) resting = false;
          return stepped;
        });
        state.base = stepSpring(state.base, target.base, force, seconds);
        if (!atRest(state.base, target.base, 0.0005)) resting = false;
        paint(svg, key, pointsOf(state), state.base.value, target.curve);
      }
      if (resting) {
        for (const [key, state] of drawn.current) {
          state.ys = state.target.points.map((point) => ({ value: point?.y ?? 0, velocity: 0 }));
          state.base = { value: state.target.base, velocity: 0 };
          paint(svg, key, state.target.points, state.target.base, state.target.curve);
        }
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [box, shapes, still]);

  useLayoutEffect(() => () => cancelAnimationFrame(frame.current), []);
}
