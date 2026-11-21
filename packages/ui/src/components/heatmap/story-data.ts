import type { HeatmapDay } from "./heatmap";

/**
 * Sample days for the heatmap stories: the quotes a small workshop wrote, a year that ends on 20
 * November 2026. Made from a seeded generator, so every capture draws the same grid: quiet at
 * weekends, a holiday in August, busier towards the end of the year.
 */

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** `count` days of written quotes that end on `last`. */
export function quoteDays(count = 365, last = new Date(2026, 10, 20), seed = 13): HeatmapDay[] {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(last);
    date.setDate(date.getDate() - (count - 1 - index));
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const holiday = date.getMonth() === 7 && date.getDate() >= 3 && date.getDate() <= 21;
    const season = 1 + 0.6 * (index / count);
    const roll = random();
    const value =
      holiday || (weekend && roll < 0.8) || roll < 0.08
        ? 0
        : Math.round((weekend ? 1 : 2 + roll * 7) * season + (roll > 0.97 ? 9 : 0));
    return { date: iso(date), value };
  });
}
