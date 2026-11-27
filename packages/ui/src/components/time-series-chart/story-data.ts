/**
 * Sample series for the chart stories: a small workshop's revenue and its website's visits.
 * Made from a seeded generator, so every capture draws the same lines.
 */

import type { SeriesColor } from "@/internal/chart/series-color";

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

/** `count` days that end on `last`, oldest first. */
function daysUntil(last: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(last);
    date.setDate(date.getDate() - (count - 1 - index));
    return date;
  });
}

export type RevenueDay = { tag: string; umsatz: number; vormonat: number };

/** Revenue per day: quieter at weekends, rising over the month. */
export function revenueDays(count = 30, last = new Date(2026, 10, 20), seed = 7): RevenueDay[] {
  const random = seeded(seed);
  return daysUntil(last, count).map((date, index) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const trend = 1 + (index / count) * 0.35;
    const umsatz = Math.round(((weekend ? 900 : 3200) + random() * 1800) * trend);
    const vormonat = Math.round(((weekend ? 800 : 2900) + random() * 1500) * 1.05);
    return { tag: iso(date), umsatz, vormonat };
  });
}

export type VisitsDay = {
  tag: string;
  direkt: number;
  suche: number;
  empfehlung: number;
  newsletter: number;
};

/** Visits per day by where they came from. */
export function visitDays(count = 30, last = new Date(2026, 10, 20), seed = 11): VisitsDay[] {
  const random = seeded(seed);
  return daysUntil(last, count).map((date, index) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const lift = weekend ? 0.7 : 1;
    const wave = 1 + 0.15 * Math.sin(index / 3);
    return {
      tag: iso(date),
      direkt: Math.round((820 + random() * 160) * lift * wave),
      suche: Math.round((1240 + random() * 260 + index * 14) * lift),
      empfehlung: Math.round((410 + random() * 120) * lift),
      // The newsletter goes out on Tuesdays.
      newsletter: Math.round(date.getDay() === 2 ? 900 + random() * 200 : 120 + random() * 60),
    };
  });
}

export type CostDay = { tag: string; kosten: number };

/**
 * What a hosted service costs per day, in dollars. `most` is about the dearest day: under a
 * dollar for a month in which almost nothing ran, so the axis has to count in cents.
 */
export function costDays(
  most = 0.95,
  count = 30,
  last = new Date(2026, 10, 30),
  seed = 13,
): CostDay[] {
  const random = seeded(seed);
  return daysUntil(last, count).map((date, index) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const wave = 0.55 + 0.3 * Math.sin(index / 4);
    const share = (weekend ? 0.25 : 1) * (wave + random() * 0.25);
    return { tag: iso(date), kosten: Math.round(Math.min(1, share) * most * 100) / 100 };
  });
}

export type ServiceCostDay = {
  tag: string;
  claude: number;
  supabase: number;
  cloudfront: number;
  sonstige: number;
};

/**
 * The paid services of the cost stories, dearest first, each with the series colour nearest
 * its own (Claude's clay is the amber, Supabase's green the green, CloudFront's purple the
 * indigo), and the remainder in the grey. The colour is the service's, not its place's.
 */
export const costServices = [
  { key: "claude", label: "Claude", color: 3 },
  { key: "supabase", label: "Supabase", color: 5 },
  { key: "cloudfront", label: "CloudFront", color: 1 },
  { key: "sonstige", label: "Sonstige", color: "muted" },
] as const satisfies readonly { key: keyof ServiceCostDay; label: string; color: SeriesColor }[];

/** What each service cost per day, in dollars: Claude on working days, the rest evenly. */
export function serviceCostDays(
  count = 14,
  last = new Date(2026, 10, 30),
  seed = 23,
): ServiceCostDay[] {
  const random = seeded(seed);
  const cents = (amount: number) => Math.round(amount * 100) / 100;
  return daysUntil(last, count).map((date, index) => {
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    return {
      tag: iso(date),
      claude: cents((weekend ? 1.5 : 7) + random() * (weekend ? 2 : 6) + index * 0.2),
      supabase: cents(1.8 + random() * 0.5),
      cloudfront: cents(1.1 + random() * 2.2 + (index === 9 ? 3.5 : 0)),
      sonstige: cents(0.5 + random() * 0.9),
    };
  });
}

export type RevenueMonth = { monat: string; umsatz: number; vorjahr: number };

/** Revenue per month over a year. */
export function revenueMonths(seed = 3): RevenueMonth[] {
  const random = seeded(seed);
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2025, 11 + index, 1);
    const season = 1 + 0.25 * Math.sin(((date.getMonth() - 2) / 12) * 2 * Math.PI);
    return {
      monat: iso(date),
      umsatz: Math.round((62_000 + index * 2600 + random() * 9000) * season),
      vorjahr: Math.round((58_000 + random() * 8000) * season),
    };
  });
}

export type RequestHour = { stunde: number; anfragen: number; fehler: number };

/** API requests per hour over two days. */
export function requestHours(seed = 5): RequestHour[] {
  const random = seeded(seed);
  const start = new Date(2026, 10, 19, 0).getTime();
  return Array.from({ length: 48 }, (_, index) => {
    const hour = index % 24;
    const day = Math.max(0, Math.sin(((hour - 6) / 24) * 2 * Math.PI));
    return {
      stunde: start + index * 3_600_000,
      anfragen: Math.round(1200 + day * 5200 + random() * 600),
      fehler: Math.round(10 + day * 40 + random() * 25 + (index === 31 ? 260 : 0)),
    };
  });
}
