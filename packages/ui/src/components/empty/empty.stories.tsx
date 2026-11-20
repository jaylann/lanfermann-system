import { NoteEditIcon, Search01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";
import { Card } from "@/components/card/card";
import { Icon } from "@/components/icon/icon";

import { Empty, EmptyActions, EmptyMedia, EmptyText, EmptyTitle } from "./empty";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 560, height: 360 } },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A page with nothing in it yet: the fact, what will appear, and the first step. */
export const Default: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyMedia>
        <Icon icon={NoteEditIcon} size={20} />
      </EmptyMedia>
      <EmptyTitle>Sie haben noch kein Angebot geschrieben.</EmptyTitle>
      <EmptyText>Sobald Sie ein Angebot geschrieben haben, erscheint es in dieser Liste.</EmptyText>
      <EmptyActions>
        <Button variant="primary">Erstes Angebot schreiben</Button>
      </EmptyActions>
    </Empty>
  ),
};

/**
 * `size="inline"`, inside a card. A search that found nothing: one sentence that names what
 * was looked for, and no button.
 */
export const Inline: Story = {
  parameters: { visual: { viewport: { width: 560, height: 240 } } },
  render: (args) => (
    <Card className="mx-auto max-w-md">
      <Empty {...args} size="inline">
        <EmptyMedia>
          <Icon icon={Search01Icon} size={18} />
        </EmptyMedia>
        <EmptyTitle level={3}>Zu dieser Suche wurde kein Angebot gefunden.</EmptyTitle>
      </Empty>
    </Card>
  ),
};

/** `EmptyMedia variant="bare"`: the symbol alone, where its tile would be one box too many. */
export const Bare: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyMedia variant="bare">
        <Icon icon={NoteEditIcon} size={24} />
      </EmptyMedia>
      <EmptyTitle>Sie haben noch kein Angebot geschrieben.</EmptyTitle>
      <EmptyText>Sobald Sie ein Angebot geschrieben haben, erscheint es in dieser Liste.</EmptyText>
      <EmptyActions>
        <Button variant="primary">Erstes Angebot schreiben</Button>
      </EmptyActions>
    </Empty>
  ),
};
