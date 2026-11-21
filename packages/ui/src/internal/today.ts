"use client";

import { useSyncExternalStore } from "react";

import { toIsoDate } from "@/internal/iso-date";

/** Today is today for as long as a calendar is open: there is nothing to listen for. */
const neverChanges = () => () => {};
const readToday = () => toIsoDate(new Date());
const unknown = () => "";

/**
 * The day that counts as today, as an ISO date: the one given, else the reader's.
 *
 * The clock is read in the browser only. A page that is rendered ahead of time has no "now"
 * (Next refuses to prerender a component that asks for one), and a server's day is not
 * necessarily the reader's. So on the server, and in the browser's first render, it is `""`
 * unless given: pass `today` where the day has to be right from the first paint.
 */
export function useToday(today?: string): string {
  const real = useSyncExternalStore(neverChanges, readToday, unknown);
  return today ?? real;
}
