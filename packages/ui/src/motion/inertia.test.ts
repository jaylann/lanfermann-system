import { describe, expect, it } from "vitest";

import {
  type Give,
  leanShape,
  leanToward,
  type Motion,
  pillGive,
  restingMotion,
  trackMotion,
  travelStretch,
  withinRoom,
} from "./inertia";

const SIZE = 14;

/**
 * Moves the part at `speed` px/s for `ms`, one move every `every` ms; returns the last state.
 * Without `size` and `give` it is a slider's thumb.
 */
function travel(from: Motion, speed: number, ms: number, every = 16, size = SIZE, give?: Give) {
  let motion = from;
  for (let elapsed = every; elapsed <= ms; elapsed += every) {
    motion = trackMotion(
      motion,
      motion.x + (speed * every) / 1000,
      motion.time + every,
      size,
      give,
    );
  }
  return motion;
}

describe("inertia", () => {
  it("stretches with speed", () => {
    const moving = travel(restingMotion(0, 0), 300, 400);
    // 300px/s at 0.012px per px/s is 3.6px on a 14px part.
    expect(moving.stretch).toBeCloseTo(1 + 3.6 / SIZE, 2);
    expect(moving.direction).toBe(1);
  });

  it("barely shows on a slow, careful move", () => {
    expect(travel(restingMotion(0, 0), 30, 400).stretch).toBeLessThan(1.04);
    expect(travel(restingMotion(0, 0), 10, 400).stretch).toBe(1);
  });

  it("never stretches beyond its limit, however fast", () => {
    expect(travel(restingMotion(0, 0), 5000, 300).stretch).toBeCloseTo(1 + 6 / SIZE);
  });

  it("knows which way it travels, so the trailing side can lag", () => {
    const right = travel(restingMotion(0, 0), 300, 200);
    expect(right.direction).toBe(1);
    const left = travel(right, -300, 200);
    expect(left.direction).toBe(-1);
    expect(left.stretch).toBeGreaterThan(1.2);
  });

  it("evens out the steps of a coarse value", () => {
    // 300px/s on average, but arriving as 0, 10, 0, 10 … px per move.
    let motion = restingMotion(0, 0);
    const seen: number[] = [];
    for (let move = 1; move <= 20; move++) {
      const step = move % 2 === 0 ? 9.6 : 0;
      motion = trackMotion(motion, motion.x + step, motion.time + 16, SIZE);
      if (move > 6) seen.push(motion.stretch);
    }
    expect(Math.min(...seen)).toBeGreaterThan(1.15);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1 + 6 / SIZE);
  });

  it("starts from rest after a pause: a single step is not a flick", () => {
    const flicked = travel(restingMotion(0, 0), 600, 200);
    // Half a second later one step of 6px: 12px/s, not the 600 from before.
    const later = trackMotion(flicked, flicked.x + 6, flicked.time + 500, SIZE);
    expect(later.stretch).toBe(1);
  });

  it("ignores a move without distance or without time", () => {
    const moving = travel(restingMotion(0, 0), 300, 200);
    expect(trackMotion(moving, moving.x, moving.time + 16, SIZE).stretch).toBe(moving.stretch);
    expect(trackMotion(moving, moving.x + 5, moving.time, SIZE).stretch).toBe(moving.stretch);
  });
});

describe("a pill", () => {
  // The thumb of a segmented control: 74px for a short label, 110px for a long one.
  const pull = (size: number, speed: number) =>
    travel(restingMotion(0, 0), speed, 400, 16, size, pillGive(size)).stretch;

  it("gives by a share of its length: 15% at a normal pull, whatever its size", () => {
    expect(pull(74, 400)).toBeCloseTo(1.15, 2);
    expect(pull(110, 400)).toBeCloseTo(1.15, 2);
  });

  it("shows a pull that the slider's 6px would hide on it", () => {
    // With the thumb's give, 400px/s add 4.8px: 6.5% of 74px. As a pill it gets 11px.
    const asThumb = travel(restingMotion(0, 0), 400, 400, 16, 74).stretch;
    expect(asThumb).toBeLessThan(1.07);
    expect((pull(74, 400) - 1) * 74).toBeCloseTo(11.1, 1);
  });

  it("stretches by a fifth at the most, however hard it is flicked", () => {
    expect(pull(74, 5000)).toBeCloseTo(1.2);
    expect(pull(110, 5000)).toBeCloseTo(1.2);
  });

  it("barely shows on a careful move, and its tail knows the way", () => {
    expect(pull(74, 40)).toBeLessThan(1.02);
    expect(pull(74, 10)).toBe(1);
    const left = travel(restingMotion(0, 0), -400, 300, 16, 74, pillGive(74));
    expect(left.direction).toBe(-1);
    expect(left.stretch).toBeCloseTo(1.15, 2);
  });

  it("leaves the slider's thumb as it was", () => {
    expect(travel(restingMotion(0, 0), 300, 400).stretch).toBeCloseTo(1 + 3.6 / SIZE, 2);
  });
});

describe("a wall behind", () => {
  it("cuts the stretch to the room the tail has", () => {
    // 100px long, stretched by 15px: with 40px behind it nothing is cut, with 6px it is.
    expect(withinRoom(1.15, 40, 100)).toBe(1.15);
    expect(withinRoom(1.15, 6, 100)).toBeCloseTo(1.06);
  });

  it("is rigid at the wall itself, and never shorter than at rest", () => {
    expect(withinRoom(1.15, 0, 100)).toBe(1);
    expect(withinRoom(1.15, -2, 100)).toBe(1);
    expect(withinRoom(1, 0, 100)).toBe(1);
  });
});

describe("travelling", () => {
  it("stretches with the way, within its limit", () => {
    expect(travelStretch(0, 100)).toBe(1);
    expect(travelStretch(100, 100)).toBeCloseTo(1.18);
    expect(travelStretch(-100, 100)).toBeCloseTo(1.18);
    expect(travelStretch(1000, 100)).toBeCloseTo(1.3);
  });

  it("stretches a short hop less than a long trip", () => {
    expect(travelStretch(40, 80)).toBeLessThan(travelStretch(90, 80));
    expect(travelStretch(90, 80)).toBeLessThan(travelStretch(300, 80));
  });
});

describe("leaning", () => {
  it("stands still under the pointer and leans a little towards it elsewhere", () => {
    expect(leanToward(0)).toBe(0);
    expect(leanToward(10)).toBeCloseTo(2.2);
    expect(leanToward(-10)).toBeCloseTo(-2.2);
    expect(leanToward(500)).toBe(5);
  });

  it("reaches: the near edge goes the whole lean, the far edge half of it", () => {
    // 500px away the lean is 5px: the part shifts 2.5px and gets 2.5px longer.
    const right = leanShape(500, 100);
    expect(right.shift).toBeCloseTo(2.5);
    expect((right.stretch - 1) * 100).toBeCloseTo(2.5);
    // Its left edge only shifts, so the right one moves the full 5px.
    expect(right.hold).toBe(-1);

    const left = leanShape(-500, 100);
    expect(left.shift).toBeCloseTo(-2.5);
    expect(left.stretch).toBeCloseTo(right.stretch);
    expect(left.hold).toBe(1);
  });

  it("stands still under the pointer", () => {
    expect(leanShape(0, 100)).toEqual({ shift: 0, stretch: 1, hold: 1 });
  });

  it("does not lean into a wall", () => {
    expect(leanShape(-2, 100, 0)).toEqual({ shift: 0, stretch: 1, hold: 1 });
    // With 3px of room it leans 3px, not the 5px it would.
    const cramped = leanShape(500, 100, 3);
    expect(cramped.shift + (cramped.stretch - 1) * 100).toBeCloseTo(3);
  });
});
