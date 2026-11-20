import { describe, expect, it, vi } from "vitest";

import { entryId, siteOf, sourceAt } from "./source-list";

const sources = [
  { title: "Preisliste 2026", url: "https://www.lanfermann.dev/preise" },
  { title: "Mail vom 12. November", url: "https://mail.lanfermann.dev/m/1", site: "Mail" },
];

describe("siteOf", () => {
  it("names the site by its own name, or by the host without www", () => {
    expect(siteOf(sources[0]!)).toBe("lanfermann.dev");
    expect(siteOf(sources[1]!)).toBe("Mail");
  });

  it("keeps an address it cannot read", () => {
    expect(siteOf({ url: "angebote/2026-0421" })).toBe("angebote/2026-0421");
  });
});

describe("sourceAt", () => {
  it("counts from one", () => {
    expect(sourceAt(sources, 1)?.title).toBe("Preisliste 2026");
    expect(sourceAt(sources, 2)?.site).toBe("Mail");
  });

  it("says so loudly when a number has no source, and gives nothing", () => {
    const said = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(sourceAt(sources, 3)).toBeUndefined();
      expect(said).toHaveBeenCalledWith(expect.stringMatching(/SourceReference 3 has no source/));
      expect(sourceAt(sources, 0)).toBeUndefined();
    } finally {
      said.mockRestore();
    }
  });
});

describe("entryId", () => {
  it("joins the base and the number", () => {
    expect(entryId("antwort-7", 2)).toBe("antwort-7-quelle-2");
  });
});
