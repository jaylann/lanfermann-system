import { describe, expect, it } from "vitest";

import { type DocsNav, docsPages, docsPageState, findDocsPage, sameDocsPage } from "./docs-nav";

const nav: DocsNav = [
  {
    title: "Erste Schritte",
    pages: [
      { title: "Überblick", href: "/doku" },
      { title: "Schnellstart", href: "/doku/schnellstart" },
    ],
  },
  {
    title: "Anleitungen",
    pages: [
      {
        title: "Fernzugriff",
        href: "/doku/fernzugriff",
        pages: [
          { title: "Anmeldung", href: "/doku/fernzugriff/anmeldung" },
          { title: "Protokoll", href: "/doku/fernzugriff/protokoll" },
        ],
      },
      { title: "Berechtigungen", href: "/doku/berechtigungen" },
    ],
  },
];

describe("docs navigation", () => {
  it("reads the set in order: a page, then its subpages, group after group", () => {
    expect(docsPages(nav).map((page) => page.title)).toEqual([
      "Überblick",
      "Schnellstart",
      "Fernzugriff",
      "Anmeldung",
      "Protokoll",
      "Berechtigungen",
    ]);
  });

  it("finds a page with its group, its trail and its neighbours", () => {
    const place = findDocsPage(nav, "/doku/schnellstart");
    expect(place?.page.title).toBe("Schnellstart");
    expect(place?.group.title).toBe("Erste Schritte");
    expect(place?.parent).toBeUndefined();
    expect(place?.trail).toEqual([{ title: "Erste Schritte" }]);
    expect(place?.previous?.title).toBe("Überblick");
    // The way on crosses into the next group.
    expect(place?.next?.title).toBe("Fernzugriff");
  });

  it("puts a subpage under its parent, which is a step of the trail", () => {
    const place = findDocsPage(nav, "/doku/fernzugriff/protokoll");
    expect(place?.parent?.title).toBe("Fernzugriff");
    expect(place?.trail).toEqual([
      { title: "Anleitungen" },
      { title: "Fernzugriff", href: "/doku/fernzugriff" },
    ]);
    expect(place?.previous?.title).toBe("Anmeldung");
    expect(place?.next?.title).toBe("Berechtigungen");
  });

  it("has no page before the first and none after the last", () => {
    expect(findDocsPage(nav, "/doku")?.previous).toBeUndefined();
    expect(findDocsPage(nav, "/doku/berechtigungen")?.next).toBeUndefined();
  });

  it("knows no page that is not in the set", () => {
    expect(findDocsPage(nav, "/preise")).toBeUndefined();
  });

  it("takes an address with a closing slash, a query or a fragment for the same page", () => {
    expect(sameDocsPage("/doku/schnellstart/", "/doku/schnellstart")).toBe(true);
    expect(sameDocsPage("/doku/schnellstart#bevor", "/doku/schnellstart?x=1")).toBe(true);
    expect(sameDocsPage("/", "/")).toBe(true);
    expect(sameDocsPage("/doku", "/doku/schnellstart")).toBe(false);
    expect(findDocsPage(nav, "/doku/schnellstart/#eintragen")?.page.title).toBe("Schnellstart");
  });

  it("says which page is current and which is open above the current one", () => {
    const remote = nav[1]!.pages[0]!;
    expect(docsPageState(remote, "/doku/fernzugriff")).toEqual({ current: true, open: false });
    expect(docsPageState(remote, "/doku/fernzugriff/anmeldung")).toEqual({
      current: false,
      open: true,
    });
    expect(docsPageState(remote, "/doku/berechtigungen")).toEqual({ current: false, open: false });
  });
});
