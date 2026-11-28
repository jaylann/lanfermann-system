import { describe, expect, it } from "vitest";

import { consentLabels, joinGerman } from "./consent-labels";
import { consentSummary } from "./consent-record";
import { sampleConsentConfig } from "./consent-sample";

const summary = (providers: string[], profilers: string[], thirdCountries: string[] = []) => ({
  purposes: ["Statistik"],
  providers,
  profilers,
  thirdCountries,
});

describe("the facts of the first layer", () => {
  it("states purposes, recipients with the country outside the EU, and profiles", () => {
    expect(consentLabels.facts(consentSummary(sampleConsentConfig))).toEqual([
      { term: "Zwecke", value: "Statistik, Marketing und Externe Medien" },
      { term: "Empfänger", value: "3 Anbieter, auch außerhalb der EU (USA)" },
      { term: "Profile", value: "Von 2 Anbietern, über Websites hinweg" },
    ]);
  });

  it("counts who builds profiles exactly", () => {
    const profiles = (providers: string[], profilers: string[]) =>
      consentLabels.facts(summary(providers, profilers)).at(-1)?.value;
    expect(profiles(["Google"], ["Google"])).toBe("Vom Anbieter, über Websites hinweg");
    expect(profiles(["Google", "Meta"], ["Google", "Meta"])).toBe(
      "Von allen Anbietern, über Websites hinweg",
    );
    expect(profiles(["Google", "Meta", "Matomo"], ["Google"])).toBe(
      "Von einem Anbieter, über Websites hinweg",
    );
  });

  it("leaves out profiles and the country when there are none", () => {
    expect(consentLabels.facts(summary(["Matomo"], []))).toEqual([
      { term: "Zwecke", value: "Statistik" },
      { term: "Empfänger", value: "1 Anbieter" },
    ]);
  });

  it("says how long the consent cookie is kept, one of a unit in the singular", () => {
    const said = [1, 7, 30, 180, 365, 730].map((days) => consentLabels.duration(days));
    expect(said).toEqual(["1 Tag", "7 Tage", "1 Monat", "6 Monate", "1 Jahr", "2 Jahre"]);
  });

  it("joins lists the German way", () => {
    expect(joinGerman(["a"])).toBe("a");
    expect(joinGerman(["a", "b"])).toBe("a und b");
    expect(joinGerman(["a", "b", "c"])).toBe("a, b und c");
  });
});
