import type { Meta, StoryObj } from "@storybook/react-vite";

import { Heading } from "./heading";

const meta = {
  title: "Components/Heading",
  component: Heading,
  parameters: { layout: "padded", visual: { viewport: { width: 820, height: 420 } } },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Titles are sentences with a full stop. `level` sets the tag, `size` the look. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Heading level={1} size="display">
        Mehr Anfragen. Weniger Büro.
      </Heading>
      <Heading level={1}>Ihre Angebote.</Heading>
      <Heading level={2}>Offene Rechnungen.</Heading>
      <Heading level={3}>Bei Lanfermann anmelden.</Heading>
      <Heading level={4}>Zahlungsart</Heading>
    </div>
  ),
};
