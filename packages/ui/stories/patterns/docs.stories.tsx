import type { Meta, StoryObj } from "@storybook/react-vite";

import { AnchorHeading } from "@/components/anchor-heading/anchor-heading";
import { BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Callout } from "@/components/callout/callout";
import { Code } from "@/components/code/code";
import { CodeBlock } from "@/components/code-block/code-block";
import {
  DocsLayout,
  DocsLayoutAside,
  DocsLayoutMain,
  DocsLayoutNav,
} from "@/components/docs-layout/docs-layout";
import {
  type DocsNav,
  docsPageState,
  findDocsPage,
  sameDocsPage,
} from "@/components/docs-layout/docs-nav";
import { Heading } from "@/components/heading/heading";
import { Link } from "@/components/link/link";
import { Pager, PagerLink } from "@/components/pager/pager";
import { Prose } from "@/components/prose/prose";
import { Quote } from "@/components/quote/quote";
import { SideNav, SideNavGroup, SideNavLink, SideNavSubLink } from "@/components/side-nav/side-nav";
import {
  SiteHeader,
  SiteHeaderActions,
  SiteHeaderBrand,
  SiteHeaderMenu,
  SiteHeaderMenuGroup,
  SiteHeaderMenuLink,
} from "@/components/site-header/site-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { TableOfContents, type TocItem } from "@/components/table-of-contents/table-of-contents";

/**
 * A page of documentation built from the library's parts alone: the site's bar, the pages of
 * the set beside the text, the text in prose with an anchored heading per section, a callout,
 * an example prompt, code and a table that stacks on a phone, the way on, and the page's
 * sections beside it. The board to judge the docs parts on.
 *
 * It is also how a product builds its docs. What belongs to the product is data: its name, the
 * pages of its set (`nav`) and the sections of the page. Where the page stands is worked out
 * from the set (`findDocsPage`), so the navigation, the menu on a phone, the trail above the
 * title and the way on at the page's end are four views of one description and cannot disagree.
 */
const meta = {
  title: "Patterns/Docs",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 1500 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Whose docs these are. */
const product = { name: "sevDesk MCP", docs: "Doku", home: "/doku" };

/** The pages of the set, in the order they are read. */
const nav: DocsNav = [
  {
    title: "Erste Schritte",
    pages: [
      { title: "Überblick", href: "/doku" },
      { title: "Schnellstart", href: "/doku/schnellstart" },
      { title: "Clients", href: "/doku/clients" },
    ],
  },
  {
    title: "Anleitungen",
    pages: [
      { title: "Berechtigungen", href: "/doku/berechtigungen" },
      { title: "Fernzugriff", href: "/doku/fernzugriff" },
      { title: "Deployment-Vorlagen", href: "/doku/deployment-vorlagen" },
    ],
  },
  {
    title: "Referenz",
    pages: [
      { title: "Konfiguration", href: "/doku/konfiguration" },
      { title: "Werkzeuge", href: "/doku/werkzeuge" },
      { title: "Häufige Fragen", href: "/doku/fragen" },
    ],
  },
  {
    title: "Projekt",
    pages: [
      { title: "Datenschutz", href: "/doku/datenschutz" },
      { title: "Architektur", href: "/doku/architektur" },
      { title: "Entscheidungen (ADR)", href: "/doku/entscheidungen" },
      { title: "Mitwirken", href: "/doku/mitwirken" },
      { title: "Änderungen", href: "/doku/aenderungen" },
    ],
  },
];

/** The page this story shows, and its sections. */
const here = "/doku/schnellstart";
const sections: TocItem[] = [
  { id: "bevor-du-beginnst", label: "Bevor du beginnst" },
  { id: "eintragen", label: "1. Den Server im Client eintragen" },
  { id: "frage", label: "2. Eine erste Frage stellen" },
  { id: "stufen", label: "3. Die Stufen" },
];

function Page() {
  const place = findDocsPage(nav, here);
  if (!place) throw new Error(`The set has no page at ${here}.`);
  const brand = (
    <SiteHeaderBrand href={product.home} className="gap-3">
      {product.name}
      <span className="text-base font-medium text-fg-muted">{product.docs}</span>
    </SiteHeaderBrand>
  );
  return (
    <div
      className="isolate min-h-dvh bg-ground"
      // The pages of the set exist only as data here: a link to one stays on this board.
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a[href^="/"]'))
          event.preventDefault();
      }}
    >
      <SiteHeader>
        {brand}
        <SiteHeaderActions>
          <SiteHeaderMenu
            label="Navigation öffnen"
            title="Alle Seiten."
            closeLabel="Schließen"
            brand={brand}
          >
            {nav.map((group) => (
              <SiteHeaderMenuGroup key={group.title} title={group.title}>
                {group.pages.map((page) => (
                  <SiteHeaderMenuLink
                    key={page.href}
                    href={page.href}
                    current={sameDocsPage(page.href, here)}
                  >
                    {page.title}
                  </SiteHeaderMenuLink>
                ))}
              </SiteHeaderMenuGroup>
            ))}
          </SiteHeaderMenu>
        </SiteHeaderActions>
      </SiteHeader>
      <DocsLayout>
        <DocsLayoutNav>
          <SideNav aria-label="Dokumentation">
            {nav.map((group) => (
              <SideNavGroup key={group.title} title={group.title}>
                {group.pages.map((page) => (
                  <SideNavLink
                    key={page.href}
                    href={page.href}
                    {...docsPageState(page, here)}
                    sub={page.pages?.map((sub) => (
                      <SideNavSubLink
                        key={sub.href}
                        href={sub.href}
                        current={sameDocsPage(sub.href, here)}
                      >
                        {sub.title}
                      </SideNavSubLink>
                    ))}
                  >
                    {page.title}
                  </SideNavLink>
                ))}
              </SideNavGroup>
            ))}
          </SideNav>
        </DocsLayoutNav>
        <DocsLayoutMain className="max-w-[44rem]">
          <div className="flex flex-col items-start gap-5 pb-8">
            <Breadcrumbs>
              <BreadcrumbItem>
                <BreadcrumbLink href={product.home}>{product.docs}</BreadcrumbLink>
              </BreadcrumbItem>
              {place.trail.map((crumb) => (
                <BreadcrumbItem key={crumb.title}>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                  ) : (
                    crumb.title
                  )}
                </BreadcrumbItem>
              ))}
            </Breadcrumbs>
            <Heading level={1}>{place.page.title}</Heading>
            <TableOfContents
              items={sections}
              collapsible
              className="self-stretch border-y border-hairline py-1 xl:hidden"
            />
          </div>
          <Prose>
            <p>
              Diese Seite führt dich in etwa zehn Minuten von einem sevDesk-Konto zur ersten
              Antwort. Für ein Team auf einem Server lies{" "}
              <Link href="/doku/fernzugriff">Fernzugriff</Link>.
            </p>
            <AnchorHeading id="bevor-du-beginnst">Bevor du beginnst</AnchorHeading>
            <ul>
              <li>
                <strong>sevDesk mit API-Zugang.</strong> Die API gehört zum Tarif Buchhaltung Pro.
              </li>
              <li>
                <strong>Ein eigener Benutzer</strong> nur für den Assistenten.
              </li>
            </ul>
            <Callout tone="warning">
              <p>Ein API-Token hat vollen Zugriff auf das ganze Konto. Es läuft nicht ab.</p>
            </Callout>
            <AnchorHeading id="eintragen">1. Den Server im Client eintragen</AnchorHeading>
            <p>
              Dein Client startet den Server mit <Code>npx -y mcp-server-sevdesk</Code>:
            </p>
            <CodeBlock language="sh" code="claude mcp add sevdesk -- npx -y mcp-server-sevdesk" />
            <AnchorHeading id="frage">2. Eine erste Frage stellen</AnchorHeading>
            <p>Frag etwa:</p>
            <Quote copy="Wie ist mein sevDesk-Konto eingerichtet?" copyLabel="Prompt kopieren">
              <p>Wie ist mein sevDesk-Konto eingerichtet?</p>
            </Quote>
            <AnchorHeading id="stufen">3. Die Stufen</AnchorHeading>
            <Table aria-label="Die Stufen" content="text" stack>
              <TableHeader>
                <TableRow>
                  <TableHead>Stufe</TableHead>
                  <TableHead>Erlaubt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell nowrap>
                    <Code>read</Code>
                  </TableCell>
                  <TableCell label="Erlaubt">
                    Listen, Abrufen, Suchen, Auswertungen und PDF-Vorschauen.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell nowrap>
                    <Code>commit</Code>
                  </TableCell>
                  <TableCell label="Erlaubt">
                    Fertigstellen, Zahlungen buchen und stornieren. Fragt vor jedem Aufruf.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Prose>
          <Pager className="mt-16">
            {place.previous && (
              <PagerLink
                direction="previous"
                href={place.previous.href}
                title={place.previous.title}
              />
            )}
            {place.next && (
              <PagerLink direction="next" href={place.next.href} title={place.next.title} />
            )}
          </Pager>
        </DocsLayoutMain>
        <DocsLayoutAside>
          <TableOfContents items={sections} current="eintragen" />
        </DocsLayoutAside>
      </DocsLayout>
    </div>
  );
}

export const Desktop: Story = { render: () => <Page /> };

/**
 * A window lower than the pages of the set: the column scrolls inside itself and fades at its
 * foot, where more pages wait.
 */
export const ShortWindow: Story = {
  render: () => <Page />,
  parameters: { visual: { viewport: { width: 1290, height: 720 } } },
};

/** On a phone the pages move into the bar's menu and the sections fold above the text. */
export const Phone: Story = {
  render: () => <Page />,
  parameters: { visual: { viewport: { width: 390, height: 1700 } } },
};
