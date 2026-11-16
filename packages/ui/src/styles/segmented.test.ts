import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TRAVEL_RELEASE_MS, travelStretch } from "@/motion/inertia";

const read = (file: string) => readFileSync(join(import.meta.dirname, file), "utf8");

/** The value of a `linear()` easing with evenly spaced points at time `t`. */
function linear(points: number[], t: number) {
  if (t >= 1) return points.at(-1)!;
  const last = points.length - 1;
  const index = Math.min(Math.floor(t * last), last - 1);
  const from = points[index]!;
  return from + (points[index + 1]! - from) * (t * last - index);
}

const numbers = (css: string, pattern: RegExp) =>
  pattern
    .exec(css)![1]!
    .split(",")
    .map((part) => Number(part.trim()));

const css = read("segmented.css");
const motion = read("motion.generated.css");
const spring = (name: string) => ({
  points: numbers(motion, new RegExp(`--ease-spring-${name}:\\s*linear\\(([^)]+)\\)`)),
  ms: Number(new RegExp(`--transition-duration-spring-${name}:\\s*(\\d+)ms`).exec(motion)![1]),
});

describe("segmented control", () => {
  const chase = numbers(css, /--segment-chase:\s*cubic-bezier\(([^)]+)\)/);

  it("follows a pointer on the slider's chase", () => {
    expect(chase).toEqual(numbers(read("slider.css"), /--slider-chase:\s*cubic-bezier\(([^)]+)\)/));
  });

  it("moves its thumb with lengths in px, never in percent of a box", () => {
    // A `translate` in percent depends on the box, and such a transition runs on the main
    // thread: the lens's labels would then lag a frame behind the rider they undo.
    const moves = [...css.matchAll(/^\s*(?:translate|scale):([^;]+);/gm)].map((match) => match[1]!);
    expect(moves.length).toBeGreaterThan(4);
    for (const move of moves) expect(move).not.toContain("%");
  });

  /*
   * The face's shape and the lens's undoing of it come from the same numbers in the same frame.
   * Eased apart, a scale and its inverse do not cancel on the way: the copied labels drifted up
   * to 4px and wiggled as the thumb passed over them.
   */
  it("eases the numbers the face and the lens are worked out from, not their shapes", () => {
    const shape = ["--thumb-s", "--thumb-hold", "--thumb-press", "--thumb-width"];
    for (const name of shape) {
      // Registered, or a custom property could not be eased at all.
      expect(css).toMatch(new RegExp(`@property ${name} \\{`));
      expect(css).toMatch(new RegExp(`\\[data-placed\\] \\{\\s*transition:[^;]*${name} var`));
    }
    // Neither the face nor the lens eases its own scale or translate.
    const transitions = (slot: string) =>
      [...css.matchAll(new RegExp(`${slot}"\\][^{]*\\{\\s*transition:([^;]+);`, "g"))].map(
        (match) => match[1]!,
      );
    expect(transitions("segment-thumb-face").length).toBeGreaterThan(0);
    for (const slot of ["segment-thumb-face", "segment-lens"]) {
      for (const list of transitions(slot)) expect(list).not.toMatch(/\b(?:scale|translate)\b/);
    }
  });

  /*
   * A thumb that sets off from a wall must not push its tail back through it. Its leading edge
   * is on the pace curve, and its tail behind by what the stretch has grown to: on the same
   * curve, a frame later (`data-travelling`). The stretch is a share of the way, so the tail
   * only ever goes forward, also when the trip itself starts a frame late (an iPhone may start
   * the two a frame apart; on the chase, from the same frame, the tail showed past the wall).
   */
  const FRAME = 1000 / 60;

  it("sets the stretch off a frame after the trip, on its pace", () => {
    expect(css).toMatch(
      /\[data-travelling\] \{\s*--segment-shape-pace: var\(--segment-pace\) var\(--segment-stretch-wait\);/,
    );
    expect(css).toMatch(/--segment-stretch-wait:\s*calc\(1s \/ 60\)/);
  });

  for (const pace of ["settle", "glide"]) {
    it(`never sends the tail back through the wall on a trip paced by ${pace}`, () => {
      const { points, ms } = spring(pace);
      const at = (t: number) => linear(points, Math.max(0, t) / ms);
      for (const size of [48, 74, 110, 160]) {
        for (const way of [30, 60, 110, 270, 600]) {
          const longer = (travelStretch(way, size) - 1) * size;
          for (let t = 1; t <= TRAVEL_RELEASE_MS; t++) {
            const lag = longer * at(t - FRAME);
            for (const late of [0, FRAME]) {
              const moved = way * at(t - late);
              expect(
                lag,
                `${way}px, ${size}px long, ${late}ms late, at ${t}ms`,
              ).toBeLessThanOrEqual(moved);
            }
          }
        }
      }
    });
  }
});
