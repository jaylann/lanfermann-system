import type { Meta, StoryObj } from "@storybook/react-vite";

import { Pager, PagerLink } from "./pager";

const meta = {
  title: "Components/Pager",
  component: Pager,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 720, height: 160 }, target: '[data-slot="pager-link"]' },
  },
} satisfies Meta<typeof Pager>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The way on at the end of a page: the page before on the left, the page after on the right. */
export const Default: Story = {
  render: () => (
    <Pager>
      <PagerLink direction="previous" href="#" title="Schnellstart" />
      <PagerLink direction="next" href="#" title="Berechtigungen" />
    </Pager>
  ),
};

/** The first page of the sequence: the next one keeps its side. */
export const First: Story = {
  render: () => (
    <Pager>
      <PagerLink direction="next" href="#" title="Schnellstart" />
    </Pager>
  ),
};

/** On a phone the two stand one over the other. */
export const Phone: Story = {
  ...Default,
  parameters: { visual: { viewport: { width: 390, height: 240 } } },
};
