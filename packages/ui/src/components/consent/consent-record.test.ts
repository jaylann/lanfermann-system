import { describe, expect, it } from "vitest";

import {
  consentAllows,
  type ConsentConfig,
  consentConfigProblems,
  consentFingerprint,
  consentSummary,
  encodeConsent,
  parseConsent,
  storageMatches,
} from "./consent-record";
import { sampleConsentConfig as config } from "./consent-sample";

const day = 86_400_000;
const decidedAt = Date.UTC(2026, 10, 18, 12);

const withService = (
  change: (service: ConsentConfig["categories"][number]["services"][number]) => void,
) => {
  const copy: ConsentConfig = structuredClone(config);
  change(copy.categories[0]!.services[0]!);
  return copy;
};

describe("the consent record", () => {
  it("reads back what it wrote", () => {
    const raw = encodeConsent(
      { revision: config.revision, decidedAt, granted: ["matomo"] },
      config,
    );
    expect(parseConsent(raw, config, decidedAt + day)).toEqual({
      revision: "2026-11-18",
      decidedAt,
      granted: ["matomo"],
    });
  });

  it("holds no id of the person, only what was decided", () => {
    const raw = encodeConsent({ revision: config.revision, decidedAt, granted: [] }, config);
    expect(Object.keys(JSON.parse(decodeURIComponent(raw)) as object).sort()).toEqual([
      "f",
      "r",
      "s",
      "t",
      "v",
    ]);
  });

  it("reads a value that a server encoded once more", () => {
    const raw = encodeConsent(
      { revision: config.revision, decidedAt, granted: ["youtube"] },
      config,
    );
    expect(parseConsent(encodeURIComponent(raw), config, decidedAt)?.granted).toEqual(["youtube"]);
  });

  it("asks again when a service, a provider, a country or the revision changes", () => {
    const base = consentFingerprint(config);
    const added: ConsentConfig = structuredClone(config);
    added.categories[0]!.services.push({ ...added.categories[0]!.services[0]!, id: "hotjar" });
    expect(consentFingerprint(added)).not.toBe(base);
    expect(consentFingerprint(withService((s) => (s.provider = "Matomo Cloud")))).not.toBe(base);
    expect(consentFingerprint(withService((s) => (s.thirdCountry = "USA")))).not.toBe(base);
    expect(consentFingerprint({ ...config, revision: "2027-01-01" })).not.toBe(base);
  });

  it("does not ask again when only the wording changes", () => {
    const base = consentFingerprint(config);
    expect(consentFingerprint(withService((s) => (s.purpose = "Zählt Besuche.")))).toBe(base);
    expect(consentFingerprint(withService((s) => (s.name = "Matomo Analytics")))).toBe(base);
  });

  it("drops an answer given for a different set of services", () => {
    const raw = encodeConsent(
      { revision: config.revision, decidedAt, granted: ["matomo"] },
      config,
    );
    const changed = withService((s) => (s.thirdCountry = "USA"));
    expect(parseConsent(raw, changed, decidedAt)).toBeUndefined();
  });

  it("drops an answer older than the configured age, or from the future", () => {
    const raw = encodeConsent({ revision: config.revision, decidedAt, granted: [] }, config);
    expect(parseConsent(raw, config, decidedAt + 364 * day)).toBeDefined();
    expect(parseConsent(raw, config, decidedAt + 366 * day)).toBeUndefined();
    expect(
      parseConsent(raw, { ...config, maxAgeDays: 180 }, decidedAt + 181 * day),
    ).toBeUndefined();
    expect(parseConsent(raw, config, decidedAt - 2 * day)).toBeUndefined();
  });

  it("ignores what it cannot read", () => {
    for (const raw of [undefined, "", "%", "nope", "%7B%7D", encodeURIComponent('{"v":2}')]) {
      expect(parseConsent(raw, config, decidedAt)).toBeUndefined();
    }
  });

  it("forgets services that are no longer configured", () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        v: 1,
        r: config.revision,
        f: consentFingerprint(config),
        t: decidedAt / 1000,
        s: ["matomo", "gone"],
      }),
    );
    expect(parseConsent(raw, config, decidedAt)?.granted).toEqual(["matomo"]);
  });
});

describe("what a record allows", () => {
  const record = { granted: ["matomo", "meta-pixel"] };

  it("allows a granted service and nothing unknown", () => {
    expect(consentAllows(record, "matomo", config)).toBe(true);
    expect(consentAllows(record, "youtube", config)).toBe(false);
    expect(consentAllows(record, "unknown", config)).toBe(false);
    expect(consentAllows(undefined, "matomo", config)).toBe(false);
  });

  it("allows a category only when all of its services are granted", () => {
    expect(consentAllows(record, "statistik", config)).toBe(true);
    expect(consentAllows(record, "marketing", config)).toBe(false);
  });

  it("always allows an essential service", () => {
    const essential = {
      ...config,
      essential: [{ ...config.categories[0]!.services[0]!, id: "login" }],
    };
    expect(consentAllows(undefined, "login", essential)).toBe(true);
  });
});

describe("the parts of a config", () => {
  it("matches stored names, with a trailing star as a prefix", () => {
    expect(storageMatches("_fbp", "_fbp")).toBe(true);
    expect(storageMatches("_fbp", "_fbp2")).toBe(false);
    expect(storageMatches("_pk_id.*", "_pk_id.1.a2f3")).toBe(true);
    expect(storageMatches("_pk_id.*", "_pk_ses.1")).toBe(false);
  });

  it("sums up purposes, providers, countries and profiles for the first layer", () => {
    expect(consentSummary(config)).toEqual({
      purposes: ["Statistik", "Marketing", "Externe Medien"],
      providers: [
        "Schreinerei Mustermann",
        "Meta Platforms Ireland Limited",
        "Google Ireland Limited",
      ],
      thirdCountries: ["USA"],
      profilers: ["Meta Platforms Ireland Limited", "Google Ireland Limited"],
    });
  });

  it("names ids that collide and categories without services", () => {
    expect(consentConfigProblems(config)).toEqual([]);
    const broken: ConsentConfig = structuredClone(config);
    broken.categories[0]!.services[0]!.id = "marketing";
    broken.categories.push({ id: "leer", name: "Leer", description: "", services: [] });
    expect(consentConfigProblems(broken)).toEqual([
      'The consent id "marketing" is used more than once.',
      'The consent category "leer" has no services.',
    ]);
  });
});
