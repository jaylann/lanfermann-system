import type { TrackerItem } from "./tracker";

/**
 * Sample strips for the tracker stories: the uptime of the quote service over ninety days, and
 * the last runs of the nightly invoice export. Fixed, so every capture draws the same strip.
 */

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Ninety days that end on 20 November 2026, with two disturbed days and one outage. */
export function uptimeDays(count = 90): TrackerItem[] {
  const last = new Date(2026, 10, 20);
  const events: Record<number, Pick<TrackerItem, "status" | "detail">> = {
    [count - 71]: { status: "warning", detail: "18 Minuten gestört" },
    [count - 38]: { status: "danger", detail: "2 Stunden 10 Minuten ausgefallen" },
    [count - 37]: { status: "warning", detail: "35 Minuten gestört" },
    [count - 9]: { status: "warning", detail: "6 Minuten gestört" },
  };
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(last);
    date.setDate(date.getDate() - (count - 1 - index));
    const event = events[index];
    return {
      date: iso(date),
      status: event?.status ?? "success",
      detail: event?.detail ?? "Keine Störung",
    };
  });
}

/** The last thirty runs of a nightly job; the first ones before it was set up. */
export function exportRuns(): TrackerItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const run = 389 + index;
    if (index < 3) return { key: `run-${run}`, label: `Lauf ${run}`, status: "none" };
    if (index === 17)
      return {
        key: `run-${run}`,
        label: `Lauf ${run}`,
        status: "danger",
        detail: "Abgebrochen: keine Verbindung zum Speicher",
      };
    if (index === 24 || index === 25)
      return {
        key: `run-${run}`,
        label: `Lauf ${run}`,
        status: "warning",
        detail: `${index === 24 ? 3 : 1} von 412 Rechnungen nicht exportiert`,
      };
    return {
      key: `run-${run}`,
      label: `Lauf ${run}`,
      status: "success",
      detail: "412 Rechnungen exportiert",
    };
  });
}
