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
import { Link } from "@/components/link/link";
import { PageHeader, PageHeaderTitle } from "@/components/page-header/page-header";
import { Pager, PagerLink } from "@/components/pager/pager";
import { Prose } from "@/components/prose/prose";
import { Quote } from "@/components/quote/quote";
import { SideNav, SideNavGroup, SideNavLink } from "@/components/side-nav/side-nav";
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

const groups = [
  { title: "Erste Schritte", pages: ["Überblick", "Schnellstart", "Clients"] },
  { title: "Anleitungen", pages: ["Berechtigungen", "Fernzugriff", "Deployment-Vorlagen"] },
  { title: "Referenz", pages: ["Konfiguration", "Werkzeuge", "Häufige Fragen"] },
];

const sections: TocItem[] = [
  { id: "bevor-du-beginnst", label: "Bevor du beginnst" },
  { id: "eintragen", label: "1. Den Server im Client eintragen" },
  { id: "frage", label: "2. Eine erste Frage stellen" },
  { id: "stufen", label: "3. Die Stufen" },
];

function Page() {
  const brand = (
    <SiteHeaderBrand href="#" className="gap-3">
      sevDesk MCP
      <span className="text-base font-medium text-fg-muted">Doku</span>
    </SiteHeaderBrand>
  );
  return (
    <div className="isolate min-h-dvh bg-ground">
      <SiteHeader>
        {brand}
        <SiteHeaderActions>
          <SiteHeaderMenu
            label="Navigation öffnen"
            title="Alle Seiten."
            closeLabel="Schließen"
            brand={brand}
          >
            {groups.map((group) => (
              <SiteHeaderMenuGroup key={group.title} title={group.title}>
                {group.pages.map((page) => (
                  <SiteHeaderMenuLink key={page} href="#" current={page === "Schnellstart"}>
                    {page}
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
            {groups.map((group) => (
              <SideNavGroup key={group.title} title={group.title}>
                {group.pages.map((page) => (
                  <SideNavLink key={page} href="#" current={page === "Schnellstart"}>
                    {page}
                  </SideNavLink>
                ))}
              </SideNavGroup>
            ))}
          </SideNav>
        </DocsLayoutNav>
        <DocsLayoutMain className="max-w-[44rem]">
          <PageHeader className="gap-5 pb-8">
            <Breadcrumbs>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Doku</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>Erste Schritte</BreadcrumbItem>
            </Breadcrumbs>
            <PageHeaderTitle level={1}>Schnellstart</PageHeaderTitle>
            <TableOfContents
              items={sections}
              collapsible
              className="self-stretch border-y border-hairline py-1 xl:hidden"
            />
          </PageHeader>
          <Prose>
            <p>
              Diese Seite führt dich in etwa zehn Minuten von einem sevDesk-Konto zur ersten
              Antwort. Für ein Team auf einem Server lies <Link href="#">Fernzugriff</Link>.
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
            <PagerLink direction="previous" href="#" title="Überblick" />
            <PagerLink direction="next" href="#" title="Clients" />
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

/** On a phone the pages move into the bar's menu and the sections fold above the text. */
export const Phone: Story = {
  render: () => <Page />,
  parameters: { visual: { viewport: { width: 390, height: 1700 } } },
};
