/*
 * The pages of a documentation set, as data. One description of the set feeds every part that
 * shows it: the `SideNav` beside the page, the same groups in the site's menu on a phone, the
 * `Breadcrumbs` above the title and the `Pager` at the page's end. A product writes its set
 * down once; where a page stands, and what comes before and after it, is worked out here.
 *
 * Plain functions over plain data, with no React in them: they run wherever the page renders.
 */

/** One page of the set. A page may have subpages, which are read after it. */
export type DocsPage = {
  /** The page's name, as it stands in the navigation and above the page. */
  title: string;
  /** Where it is, as the site's router knows it ("/doku/schnellstart"). */
  href: string;
  /** Pages under this one. They show in the navigation while the reader is on it or on them. */
  pages?: readonly DocsPage[];
};

/** A part of the set: a noun ("Anleitungen") and the pages under it. */
export type DocsGroup = {
  title: string;
  pages: readonly DocsPage[];
};

/** The whole set, in the order it is read. */
export type DocsNav = readonly DocsGroup[];

/** A step of the trail above a page's title. A group is no page and has no `href`. */
export type DocsCrumb = { title: string; href?: string };

/** Where a page stands in its set. */
export type DocsPlace = {
  page: DocsPage;
  /** The part of the set it belongs to. */
  group: DocsGroup;
  /** The page it lies under, if it is a subpage. */
  parent?: DocsPage;
  /** The page read before it and the one read after it, across groups. None at either end. */
  previous?: DocsPage;
  next?: DocsPage;
  /** What stands above it, from the outside in: its group, then its parent. Not the page. */
  trail: DocsCrumb[];
};

/** An address without what does not name a page: its query, its fragment, a closing slash. */
function pathOf(href: string) {
  const path = href.replace(/[?#].*$/, "");
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Whether two addresses lead to the same page ("/doku/start/" and "/doku/start#bevor"). */
export function sameDocsPage(a: string, b: string) {
  return pathOf(a) === pathOf(b);
}

/** Every page of the set in reading order: each page, then its subpages, group after group. */
export function docsPages(nav: DocsNav): DocsPage[] {
  const walk = (pages: readonly DocsPage[]): DocsPage[] =>
    pages.flatMap((page) => [page, ...walk(page.pages ?? [])]);
  return nav.flatMap((group) => walk(group.pages));
}

/**
 * Where the page at `href` stands: its group, its parent, the trail above it and the pages
 * before and after it. `undefined` when the set has no such page.
 */
export function findDocsPage(nav: DocsNav, href: string): DocsPlace | undefined {
  const order = docsPages(nav);
  const at = order.findIndex((page) => sameDocsPage(page.href, href));
  const page = order[at];
  if (!page) return undefined;

  const within = (pages: readonly DocsPage[], above: DocsPage[]): DocsPage[] | undefined => {
    for (const candidate of pages) {
      if (candidate === page) return above;
      const deeper = within(candidate.pages ?? [], [...above, candidate]);
      if (deeper) return deeper;
    }
    return undefined;
  };

  for (const group of nav) {
    const above = within(group.pages, []);
    if (!above) continue;
    return {
      page,
      group,
      parent: above[above.length - 1],
      previous: order[at - 1],
      next: order[at + 1],
      trail: [
        { title: group.title },
        ...above.map((parent) => ({ title: parent.title, href: parent.href })),
      ],
    };
  }
  return undefined;
}

/**
 * Whether a page of the navigation is the one being read, or lies above it: the first wears
 * `current`, the second is `open` so its subpages show.
 */
export function docsPageState(page: DocsPage, href: string) {
  const current = sameDocsPage(page.href, href);
  const holds = (pages: readonly DocsPage[]): boolean =>
    pages.some((sub) => sameDocsPage(sub.href, href) || holds(sub.pages ?? []));
  return { current, open: !current && holds(page.pages ?? []) };
}
