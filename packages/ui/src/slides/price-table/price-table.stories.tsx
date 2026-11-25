import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { PriceTable } from "./price-table";
import { PriceTableExample } from "./price-table.example";

const meta = {
  title: "Slides/PriceTable",
  component: PriceTable,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof PriceTable>;

export default meta;
type Story = StoryObj;

/** An offer with VAT: two positions on 7, 2 and 3 columns, the totals on the five under the price. */
export const Default: Story = {
  render: () => <PriceTableExample />,
};
