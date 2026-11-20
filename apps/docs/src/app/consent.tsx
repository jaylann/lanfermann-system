"use client";

import { type ConsentConfig, ConsentProvider } from "@lanfermann/ui";
import type { ReactNode } from "react";

import { persistConsent } from "./actions";

/** What this app would ask about if it embedded a video. */
const config: ConsentConfig = {
  revision: "2026-11-18",
  categories: [
    {
      id: "medien",
      name: "Externe Medien",
      description: "Zeigt Videos von anderen Anbietern direkt auf der Seite.",
      services: [
        {
          id: "youtube",
          name: "YouTube",
          provider: "Google Ireland Limited, Irland",
          purpose: "Zeigt eingebettete Videos.",
          profiling: true,
          thirdCountry: "USA",
          privacyUrl: "https://policies.google.com/privacy",
        },
      ],
    },
  ],
};

/**
 * The consent provider of this app. A client component of its own, because `persist` is a
 * function and cannot be handed down from the Server Component layout.
 */
export function Consent({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider
      config={config}
      privacyHref="#datenschutz"
      imprintHref="#impressum"
      // Safari keeps a cookie written by script for at most seven days; this one lasts the year.
      persist={(value, maxAge) => persistConsent(value, maxAge)}
    >
      {children}
    </ConsentProvider>
  );
}
