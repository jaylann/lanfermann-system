import type { ConsentConfig } from "./consent-record";

/**
 * The services of a sample site (a joinery), for the stories and the tests. Not exported from
 * the library: a site writes its own, with the facts of the services it really uses.
 */
export const sampleConsentConfig: ConsentConfig = {
  revision: "2026-11-18",
  categories: [
    {
      id: "statistik",
      name: "Statistik",
      description: "Zählt, welche Seiten gelesen werden, damit die Website besser wird.",
      services: [
        {
          id: "matomo",
          name: "Matomo",
          provider: "Schreinerei Mustermann, Augsburg",
          purpose: "Misst Besuche und gelesene Seiten auf dem eigenen Server.",
          profiling: false,
          storage: [
            { name: "_pk_id.*", duration: "13 Monate" },
            { name: "_pk_ses.*", duration: "30 Minuten" },
          ],
          privacyUrl: "/datenschutz#matomo",
        },
      ],
    },
    {
      id: "marketing",
      name: "Marketing",
      description: "Misst, welche Anzeigen zu einer Anfrage geführt haben.",
      services: [
        {
          id: "meta-pixel",
          name: "Meta-Pixel",
          provider: "Meta Platforms Ireland Limited, Irland",
          purpose:
            "Misst, ob eine Anzeige auf Facebook oder Instagram zu einem Besuch geführt hat.",
          profiling: true,
          thirdCountry: "USA",
          storage: [{ name: "_fbp", duration: "3 Monate" }],
          privacyUrl: "https://www.facebook.com/privacy/policy/",
        },
        {
          id: "google-ads",
          name: "Google Ads",
          provider: "Google Ireland Limited, Irland",
          purpose: "Misst, ob eine Anzeige bei Google zu einer Anfrage geführt hat.",
          profiling: true,
          thirdCountry: "USA",
          storage: [{ name: "_gcl_au", duration: "3 Monate" }],
          privacyUrl: "https://policies.google.com/privacy",
        },
      ],
    },
    {
      id: "medien",
      name: "Externe Medien",
      description: "Zeigt Videos und Karten von anderen Anbietern direkt auf der Seite.",
      services: [
        {
          id: "youtube",
          name: "YouTube",
          provider: "Google Ireland Limited, Irland",
          purpose: "Zeigt eingebettete Videos aus der Werkstatt.",
          profiling: true,
          thirdCountry: "USA",
          privacyUrl: "https://policies.google.com/privacy",
        },
        {
          id: "google-maps",
          name: "Google Maps",
          provider: "Google Ireland Limited, Irland",
          purpose: "Zeigt die Anfahrt zur Werkstatt auf einer Karte.",
          profiling: true,
          thirdCountry: "USA",
          privacyUrl: "https://policies.google.com/privacy",
        },
      ],
    },
  ],
};
