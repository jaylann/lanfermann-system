/*
 * What a consent is made of: the services a site asks about, and the record of the answer that
 * is kept in a first-party cookie. Pure functions without React or the browser, so a Server
 * Component or a route handler can read the same cookie (`parseConsent`).
 *
 * The record holds no ID of the person (DSK, OH Digitale Dienste, Rn. 84): the revision the
 * answer was given under, a fingerprint of what was asked, when, and the services granted.
 */

/** Where a service keeps something on the device. */
export type ConsentStorageKind = "cookie" | "local" | "session";

/** One thing a service stores in the browser: a cookie, or a key in local or session storage. */
export type ConsentStorage = {
  /** Its name. A trailing `*` stands for any ending: `_ga_*`. */
  name: string;
  /** Where it is kept. A cookie unless said otherwise. */
  kind?: ConsentStorageKind;
  /** How long it is kept, as people read it: „2 Jahre“, „Sitzung“. */
  duration: string;
  /** What it is for, where the service's purpose does not already say it. */
  purpose?: string;
};

/** A service that needs consent, or (under `essential`) one that runs without it. */
export type ConsentService = {
  /** Unique across all services and categories. It is what the cookie stores. */
  id: string;
  /** The service as people know it: „YouTube“, „Plausible“. */
  name: string;
  /** Who runs it, with the seat: „Google Ireland Limited, Irland“. */
  provider: string;
  /** What it does on this site, concretely: „Zeigt eingebettete Videos.“ */
  purpose: string;
  /**
   * Whether the provider joins what it learns here with data from other sites into profiles.
   * The first layer has to say so (Rn. 119), so it is never left out.
   */
  profiling: boolean;
  /** Where data is processed outside the EEA, as a country: „USA“. Absent when it stays inside. */
  thirdCountry?: string;
  /** What it stores in the browser. Revoking deletes the first-party entries named here. */
  storage?: ConsentStorage[];
  /** The provider's privacy policy. */
  privacyUrl?: string;
};

/** A purpose: the services that serve it, switched on and off together or one by one. */
export type ConsentCategory = {
  /** Unique across all services and categories. */
  id: string;
  /** The purpose as one or two words: „Statistik“, „Externe Medien“. */
  name: string;
  /** One sentence on what it does for the reader or the site. */
  description: string;
  services: ConsentService[];
};

/** Everything a site asks consent for. */
export type ConsentConfig = {
  /**
   * The version of what is shown, as a date („2026-11-18“). Change it when the wording changes in
   * substance: everyone is asked again. Keep the config of each revision (git history does), so a
   * stored answer can be matched to the text it was given to (Rn. 85).
   */
  revision: string;
  /** The purposes that need consent. */
  categories: ConsentCategory[];
  /** Services that run without consent (strictly necessary). The consent cookie is added itself. */
  essential?: ConsentService[];
  /** The name of the consent cookie. „lf-consent“ unless set. */
  cookieName?: string;
  /** How long an answer counts before it is asked for again. 365 days unless set. */
  maxAgeDays?: number;
  /** A domain to share the answer across subdomains („example.com“). The host only, unless set. */
  cookieDomain?: string;
};

/** The answer, as it is kept. */
export type ConsentRecord = {
  /** The `revision` of the config it was given under. */
  revision: string;
  /** When it was given, in milliseconds since the epoch. */
  decidedAt: number;
  /** The ids of the services that were granted. */
  granted: readonly string[];
};

export const defaultCookieName = "lf-consent";
export const defaultMaxAgeDays = 365;

/** FNV-1a over a string, in base 36: short, stable, and enough to tell two configs apart. */
function hash(text: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0).toString(36);
}

/**
 * What was asked, in a few characters: the revision, and every service with its purpose, its
 * provider and where its data goes. A new service, a new recipient or a new country asks again
 * (Rn. 63); a reworded description does not, until the revision changes.
 */
export function consentFingerprint(config: ConsentConfig): string {
  const services = config.categories
    .flatMap((category) =>
      category.services.map(
        (service) =>
          `${category.id}/${service.id}/${service.provider}/${service.thirdCountry ?? ""}`,
      ),
    )
    .sort();
  return hash([config.revision, ...services].join("|"));
}

/** The record as the cookie's value. */
export function encodeConsent(record: ConsentRecord, config: ConsentConfig): string {
  return encodeURIComponent(
    JSON.stringify({
      v: 1,
      r: record.revision,
      f: consentFingerprint(config),
      t: Math.round(record.decidedAt / 1000),
      s: record.granted,
    }),
  );
}

/** Every service that needs consent, by id. */
export function consentServices(config: ConsentConfig): Map<string, ConsentService> {
  return new Map(
    config.categories.flatMap((category) =>
      category.services.map((service) => [service.id, service] as const),
    ),
  );
}

/**
 * Reads the cookie's value. Returns the record only if it still counts: written by this format,
 * for what is asked now (the fingerprint), and not older than `maxAgeDays`. Ids of services that
 * are no longer configured are dropped. Pass `now` from the request on a server.
 */
export function parseConsent(
  raw: string | undefined | null,
  config: ConsentConfig,
  now: number = Date.now(),
): ConsentRecord | undefined {
  if (!raw) return undefined;
  let data: unknown;
  // A server that sets the cookie may encode the value once more; at most two layers are read.
  for (let text = raw, layer = 0; layer < 2 && data === undefined; layer++) {
    try {
      text = decodeURIComponent(text);
      data = JSON.parse(text);
    } catch {
      // Not JSON yet: try the next layer.
    }
  }
  if (typeof data !== "object" || data === null) return undefined;
  const { v, r, f, t, s } = data as Record<string, unknown>;
  if (v !== 1 || typeof r !== "string" || typeof f !== "string") return undefined;
  if (typeof t !== "number" || !Number.isFinite(t)) return undefined;
  if (!Array.isArray(s) || !s.every((id) => typeof id === "string")) return undefined;
  if (f !== consentFingerprint(config)) return undefined;
  const decidedAt = t * 1000;
  const maxAge = (config.maxAgeDays ?? defaultMaxAgeDays) * 86_400_000;
  if (now - decidedAt > maxAge || decidedAt - now > 86_400_000) return undefined;
  const known = consentServices(config);
  return { revision: r, decidedAt, granted: s.filter((id) => known.has(id)) };
}

/**
 * Whether an id is allowed: a service that was granted, or a category all of whose services
 * were. Essential services are always allowed; anything unknown never is.
 */
export function consentAllows(
  record: Pick<ConsentRecord, "granted"> | undefined,
  id: string,
  config: ConsentConfig,
): boolean {
  if (config.essential?.some((service) => service.id === id)) return true;
  const granted = new Set(record?.granted);
  const category = config.categories.find((entry) => entry.id === id);
  if (category) {
    return (
      category.services.length > 0 && category.services.every((service) => granted.has(service.id))
    );
  }
  return granted.has(id) && consentServices(config).has(id);
}

/** Whether a stored name is the one a `ConsentStorage` names (a trailing `*` is a prefix). */
export function storageMatches(pattern: string, name: string): boolean {
  return pattern.endsWith("*") ? name.startsWith(pattern.slice(0, -1)) : name === pattern;
}

/** What the first layer has to say about the services as a whole (Rn. 119). */
export type ConsentSummary = {
  /** The purposes, by name. */
  purposes: string[];
  /** Every provider once, in the order they appear. */
  providers: string[];
  /** Every country outside the EEA once. */
  thirdCountries: string[];
  /** The providers that build profiles across sites. */
  profilers: string[];
};

/** The provider's name without its seat: „Google Ireland Limited, Irland“ → „Google Ireland Limited“. */
function providerName(provider: string) {
  return provider.split(",")[0]?.trim() ?? provider;
}

export function consentSummary(config: ConsentConfig): ConsentSummary {
  const unique = (values: string[]) => [...new Set(values)];
  const services = config.categories.flatMap((category) => category.services);
  return {
    purposes: config.categories.filter((category) => category.services.length).map((c) => c.name),
    providers: unique(services.map((service) => providerName(service.provider))),
    thirdCountries: unique(services.flatMap((service) => service.thirdCountry ?? [])),
    profilers: unique(
      services.filter((service) => service.profiling).map((s) => providerName(s.provider)),
    ),
  };
}

/**
 * What is wrong with a config, as sentences for the console: ids that repeat (`allows` takes a
 * service or a category id, so they must not collide), and categories without services.
 */
export function consentConfigProblems(config: ConsentConfig): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const ids = [
    ...config.categories.map((category) => category.id),
    ...config.categories.flatMap((category) => category.services.map((service) => service.id)),
    ...(config.essential ?? []).map((service) => service.id),
  ];
  for (const id of ids) {
    if (seen.has(id)) problems.push(`The consent id "${id}" is used more than once.`);
    seen.add(id);
  }
  for (const category of config.categories) {
    if (!category.services.length) {
      problems.push(`The consent category "${category.id}" has no services.`);
    }
  }
  if (!config.revision) problems.push("The consent config has no revision.");
  return problems;
}
