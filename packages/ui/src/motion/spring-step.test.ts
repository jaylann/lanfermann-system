import { describe, expect, it } from "vitest";

import { atRest, type Moving, springForce, stepSpring } from "./spring-step";
import { springs } from "./springs";

/** Runs a spring from 0 towards 1 at 60 frames a second and returns every value it passed. */
function run(spring: Parameters<typeof springForce>[0], seconds: number, frame = 1 / 60) {
  const force = springForce(spring);
  let moving: Moving = { value: 0, velocity: 0 };
  const seen: number[] = [];
  for (let time = 0; time < seconds; time += frame) {
    moving = stepSpring(moving, 1, force, frame);
    seen.push(moving.value);
  }
  return { seen, moving };
}

describe("a spring stepped by hand", () => {
  it("arrives", () => {
    const { moving } = run(springs.seat, 1.2);
    expect(moving.value).toBeCloseTo(1, 3);
    expect(atRest(moving, 1)).toBe(true);
  });

  it("is mostly there after its visual duration", () => {
    const { seen } = run(springs.seat, springs.seat.visualDuration);
    expect(seen.at(-1)).toBeGreaterThan(0.85);
  });

  it("swings past its target when it has bounce, and not without", () => {
    expect(Math.max(...run(springs.seat, 1).seen)).toBeGreaterThan(1.005);
    expect(Math.max(...run(springs.seat, 1).seen)).toBeLessThan(1.1);
    expect(Math.max(...run(springs.glide, 1.5).seen)).toBeLessThanOrEqual(1.0001);
  });

  it("moves the same at 60 and at 120 frames a second", () => {
    const slow = run(springs.seat, 0.2, 1 / 60).moving.value;
    const fast = run(springs.seat, 0.2, 1 / 120).moving.value;
    expect(Math.abs(slow - fast)).toBeLessThan(0.01);
  });

  it("does not leap after a long pause between frames", () => {
    const force = springForce(springs.seat);
    const after = stepSpring({ value: 0, velocity: 0 }, 1, force, 5);
    expect(after.value).toBeLessThan(0.4);
  });

  it("takes a new target on the way and keeps its speed", () => {
    const force = springForce(springs.seat);
    let moving: Moving = { value: 0, velocity: 0 };
    for (let frame = 0; frame < 6; frame++) moving = stepSpring(moving, 1, force, 1 / 60);
    const speed = moving.velocity;
    expect(speed).toBeGreaterThan(0);
    // Turned back: it still moves forward for a moment, then returns.
    const next = stepSpring(moving, 0, force, 1 / 240);
    expect(next.velocity).toBeLessThan(speed);
    expect(next.value).toBeGreaterThan(moving.value);
    expect(atRest(moving, 1)).toBe(false);
  });
});
