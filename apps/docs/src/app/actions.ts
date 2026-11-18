"use server";

import { cookies } from "next/headers";

/**
 * Sets the consent cookie from the server, so it lasts as long as the banner asked for: Safari
 * keeps a cookie written by script for at most seven days. The value is what the banner wrote;
 * it holds no ID. Script must still read it, so it is not `httpOnly`.
 */
export async function persistConsent(value: string, maxAge: number) {
  // Only the shape the banner writes, and never longer than a year and a bit.
  if (value.length > 2048 || !/^[\w%.~-]*$/.test(value)) return;
  (await cookies()).set("lf-consent", decodeURIComponent(value), {
    path: "/",
    maxAge: Math.min(maxAge, 400 * 86_400),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}

export type QuoteState = {
  /** What the server rejected, keyed by field name: `Form` shows each under its field. */
  errors: Record<string, string>;
  /** What was saved, once nothing was rejected. */
  saved?: { kunde: string; betrag: string; gueltig: string; zeitraum: string; beginn: string };
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Saves a quote, or says what is wrong with it. The form posts what its fields submit: the date
 * as `2026-11-30`, the range as an ISO interval `2026-11-16/2026-11-27`, the time as `07:30`.
 * A server checks again whatever a browser has checked: the rules here are the ones only it
 * knows.
 */
export async function saveQuote(_previous: QuoteState, formData: FormData): Promise<QuoteState> {
  // A field posts text; a file under one of these names is not an answer.
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const kunde = text("kunde");
  const betrag = text("betrag");
  const gueltig = text("gueltig");
  const zeitraum = text("zeitraum");
  const beginn = text("beginn");

  const errors: Record<string, string> = {};
  if (kunde.length < 2) errors.kunde = "Bitte geben Sie den Namen des Kunden ein.";
  if (kunde.toLowerCase() === "mustermann") {
    errors.kunde = "Für diesen Kunden gibt es schon ein offenes Angebot.";
  }
  if (!ISO_DATE.test(gueltig)) errors.gueltig = "Bitte geben Sie an, bis wann das Angebot gilt.";
  const [from = "", to = ""] = zeitraum.split("/");
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    errors.zeitraum = "Bitte geben Sie den Leistungszeitraum ein.";
  } else if (ISO_DATE.test(gueltig) && from < gueltig) {
    errors.zeitraum = "Die Leistung kann erst beginnen, wenn das Angebot angenommen ist.";
  }
  if (beginn !== "" && (beginn < "07:00" || beginn > "18:00")) {
    errors.beginn = "Wir beginnen zwischen 07:00 und 18:00.";
  }

  // Stands in for the write to a database.
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (Object.keys(errors).length > 0) return { errors };
  return { errors: {}, saved: { kunde, betrag, gueltig, zeitraum, beginn } };
}
