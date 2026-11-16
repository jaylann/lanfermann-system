import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@/components/spinner/spinner";

import { Shimmer } from "./shimmer";

const meta = {
  title: "Components/Shimmer",
  component: Shimmer,
  parameters: {
    visual: { viewport: { width: 440, height: 120 } },
  },
} satisfies Meta<typeof Shimmer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A line that names what is going on: the light passes through it and rests before the next. */
export const Default: Story = {
  render: () => <Shimmer className="text-control">Zahlungen werden abgeglichen</Shimmer>,
};

/** Beside the spinner, as a step that is being worked on. */
export const WithSpinner: Story = {
  render: () => (
    <p role="status" className="flex items-center gap-2 text-control text-fg-muted">
      <Spinner size={14} />
      <Shimmer>Antwort wird geschrieben</Shimmer>
    </p>
  ),
};

/** At the size of a lead, the band of light grows with the type. */
export const Large: Story = {
  parameters: { visual: { viewport: { width: 560, height: 140 } } },
  render: () => (
    <Shimmer className="text-lg font-medium">Dein Angebot wird zusammengestellt</Shimmer>
  ),
};

/** Done: the same element, as plain text in the colour around it. */
export const Done: Story = {
  render: () => (
    <p className="text-control text-fg-body">
      <Shimmer active={false}>Zahlungen abgeglichen</Shimmer>
    </p>
  ),
};
