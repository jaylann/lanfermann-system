import type { ConsentService, ConsentStorageKind, ConsentSummary } from "./consent-record";

/**
 * Every string the consent banner, its settings and the embed placeholder show. A cookie notice
 * addresses nobody (no „Sie“, no „wir“): it states what happens, the way the footer and the
 * imprint do. A site that speaks to its customers may pass its own wording.
 *
 * Some entries are functions, because they are built from the config: the line about providers
 * and countries on the first layer has to name them (DSK, OH Digitale Dienste, Rn. 119).
 */
export type ConsentLabels = {
  /** The banner's title, a sentence with a full stop. */
  title: string;
  /** What the services do, when the site passes no `intro` of its own. */
  intro: string;
  /**
   * What the first layer must state (Rn. 119): the purposes, how many providers receive data,
   * whether it leaves the EU, and whether profiles are built across sites. Built from the config
   * as short facts, a term and its value each.
   */
  facts: (summary: ConsentSummary) => { term: string; value: string }[];
  /** That consent is voluntary and where it is changed. */
  withdraw: string;
  /** That a withdrawal counts from then on (Art. 7 (3) GDPR; Rn. 37). Shown in the settings. */
  withdrawEffect: string;
  privacy: string;
  imprint: string;
  rejectAll: string;
  acceptAll: string;
  /** Opens the settings from the first layer. */
  settings: string;
  /** Stores what the switches show. */
  save: string;
  /** The title of the settings view. */
  settingsTitle: string;
  back: string;
  close: string;
  essentialName: string;
  essentialDescription: string;
  /** Beside the essential category, in place of a switch. */
  alwaysOn: string;
  /** The trigger that unfolds a category's services. */
  services: (count: number) => string;
  /** Beside a category whose services are partly on. */
  mixed: (on: number, total: number) => string;
  provider: string;
  purpose: string;
  stored: string;
  storageKind: Record<ConsentStorageKind, string>;
  thirdCountry: string;
  profiling: string;
  /** The link to a provider's privacy policy. */
  privacyPolicy: string;
  /** How long the consent cookie is kept, from `maxAgeDays`. */
  duration: (days: number) => string;
  /** The consent cookie itself, listed under the essential category. */
  consentServiceName: string;
  consentServiceProvider: string;
  consentServicePurpose: string;
  /** The footer link, and the name of the floating button that opens the settings. */
  trigger: string;
  /** The embed placeholder. */
  embedTitle: (service: ConsentService) => string;
  embedText: (service: ConsentService) => string;
  embedLoadOnce: string;
  embedAlways: (service: ConsentService) => string;
};

/** „a“, „a und b“, „a, b und c“. */
export function joinGerman(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} und ${items.at(-1)}`;
}

export const consentLabels: ConsentLabels = {
  title: "Cookies auf dieser Website.",
  intro:
    "Einige Dienste dieser Website speichern Daten im Browser oder lesen sie dort aus. Sie werden erst geladen, wenn eine Einwilligung vorliegt.",
  facts: ({ purposes, providers, thirdCountries, profilers }) => [
    { term: "Zwecke", value: joinGerman(purposes) },
    {
      term: "Empfänger",
      value: `${providers.length} Anbieter${
        thirdCountries.length ? `, auch außerhalb der EU (${joinGerman(thirdCountries)})` : ""
      }`,
    },
    ...(profilers.length
      ? [
          {
            term: "Profile",
            value: `${
              profilers.length === providers.length
                ? providers.length === 1
                  ? "Vom Anbieter"
                  : "Von allen Anbietern"
                : profilers.length === 1
                  ? "Von einem Anbieter"
                  : `Von ${profilers.length} Anbietern`
            }, über Websites hinweg`,
          },
        ]
      : []),
  ],
  withdraw:
    "Die Einwilligung ist freiwillig und lässt sich jederzeit unter „Cookie-Einstellungen“ am Ende jeder Seite ändern.",
  withdrawEffect:
    "Ein Widerruf gilt ab diesem Moment. Was bis dahin mit Einwilligung geschehen ist, bleibt davon unberührt.",
  privacy: "Datenschutzerklärung",
  imprint: "Impressum",
  rejectAll: "Alle ablehnen",
  acceptAll: "Alle akzeptieren",
  settings: "Einstellungen",
  save: "Auswahl speichern",
  settingsTitle: "Cookie-Einstellungen.",
  back: "Zurück",
  close: "Schließen",
  essentialName: "Notwendig",
  essentialDescription:
    "Hält die Website am Laufen und merkt sich diese Auswahl. Dafür ist keine Einwilligung nötig.",
  alwaysOn: "Immer aktiv",
  services: (count) => (count === 1 ? "1 Dienst" : `${count} Dienste`),
  mixed: (on, total) => `${on} von ${total} aktiv`,
  provider: "Anbieter",
  purpose: "Zweck",
  stored: "Speichert",
  storageKind: { cookie: "Cookie", local: "Lokaler Speicher", session: "Sitzungsspeicher" },
  thirdCountry: "Außerhalb der EU",
  profiling: "Bildet Profile über Websites hinweg.",
  privacyPolicy: "Datenschutzerklärung des Anbieters",
  duration: (days) =>
    days % 365 === 0
      ? days === 365
        ? "1 Jahr"
        : `${days / 365} Jahre`
      : days % 30 === 0
        ? `${days / 30} Monate`
        : `${days} Tage`,
  consentServiceName: "Einwilligung",
  consentServiceProvider: "Diese Website",
  consentServicePurpose: "Speichert diese Auswahl, damit sie nicht bei jedem Besuch erscheint.",
  trigger: "Cookie-Einstellungen",
  embedTitle: (service) => `Hier steht ein Inhalt von ${service.name}.`,
  embedText: (service) =>
    `Beim Laden erhält ${service.provider.split(",")[0]} Daten wie die IP-Adresse${
      service.thirdCountry ? `, auch außerhalb der EU (${service.thirdCountry})` : ""
    }.`,
  embedLoadOnce: "Inhalt laden",
  embedAlways: (service) => `${service.name} immer laden`,
};
