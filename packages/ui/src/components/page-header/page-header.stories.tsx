import { Add01Icon, Download04Icon, SentIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AvatarGroup } from "@/components/avatar-group/avatar-group";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
} from "./page-header";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 880, height: 150 },
      target: '[data-slot="page-header-actions"] [data-slot="button"]',
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A list page: what is there, how things stand, and the one thing to do from here. */
export const Default: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>Angebote.</PageHeaderTitle>
      <PageHeaderDescription>
        Zwölf Angebote sind offen, drei davon laufen diese Woche ab.
      </PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="primary">
          <Icon icon={Add01Icon} />
          Angebot schreiben
        </Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** A record's page: its state after the title, a quieter action beside the committed one. */
export const WithBadge: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle badge={<Badge tone="info">Offen</Badge>}>
        Angebot A-2026-0418.
      </PageHeaderTitle>
      <PageHeaderDescription>
        Gärtnerei Weiß · Pflanzbeete im Innenhof · gültig bis 5. Dezember
      </PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="secondary">
          <Icon icon={Download04Icon} />
          Als PDF
        </Button>
        <Button variant="primary">
          <Icon icon={SentIcon} />
          Angebot senden
        </Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** `as="div"`: the description carries the people before the words. */
export const WithPeople: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>Team.</PageHeaderTitle>
      <PageHeaderDescription as="div" className="flex items-center gap-3">
        <AvatarGroup
          label="Im Team"
          people={[
            { name: "Anna Weber", presence: "online" },
            { name: "Jonas Brandt", presence: "online" },
            { name: "Lena Hoffmann", presence: "away" },
            { name: "Murat Yilmaz" },
          ]}
        />
        <span>4 Personen, 2 gerade online</span>
      </PageHeaderDescription>
      <PageHeaderActions>
        <Button variant="primary">
          <Icon icon={Add01Icon} />
          Einladen
        </Button>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** A page that only shows: the title and its line, nothing at the right. */
export const NoActions: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderTitle>Auswertung.</PageHeaderTitle>
      <PageHeaderDescription>
        Wie die Werkstatt im November läuft, mit den Wochen davor.
      </PageHeaderDescription>
    </PageHeader>
  ),
};

/**
 * Narrower than 36rem (a phone, or beside an open sidebar), the actions go under the words. It
 * goes by the header's own width, not the window's.
 */
export const Narrow: Story = {
  parameters: { visual: { viewport: { width: 390, height: 230 } } },
  render: WithBadge.render,
};

/** `size="title"` for a page that stands without the app's frame: settings, a setup. */
export const Standalone: Story = {
  parameters: { visual: { viewport: { width: 880, height: 170 } } },
  render: () => (
    <PageHeader>
      <PageHeaderTitle size="title" badge={<Badge tone="success">Tarif Werkstatt</Badge>}>
        Einstellungen.
      </PageHeaderTitle>
      <PageHeaderDescription>Schreinerei Mustermann, Rosenheim</PageHeaderDescription>
    </PageHeader>
  ),
};
