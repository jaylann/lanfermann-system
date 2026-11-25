import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Table } from "./table";
import { TableExample } from "./table.example";

const meta = {
  title: "Slides/Table",
  component: Table,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj;

/** A measured table across twelve columns: a numeric column, a mono column, one cell in the accent. */
export const Default: Story = {
  render: () => <TableExample />,
};
