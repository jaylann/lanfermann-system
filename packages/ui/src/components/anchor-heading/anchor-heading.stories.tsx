import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { AnchorHeading } from "./anchor-heading";

const meta = {
  title: "Components/AnchorHeading",
  component: AnchorHeading,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 640, height: 260 },
      target: '[data-slot="anchor-heading"]',
    },
  },
} satisfies Meta<typeof AnchorHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The three levels a long page uses. The link symbol shows when a heading is pointed at. */
export const Levels: Story = {
  args: { id: "fernzugriff", children: "Fernzugriff" },
  render: () => (
    <div className="flex flex-col gap-6">
      <AnchorHeading id="fernzugriff">Fernzugriff</AnchorHeading>
      <AnchorHeading id="bereitstellung" level={3}>
        Bereitstellung mit Docker
      </AnchorHeading>
      <AnchorHeading id="variablen" level={4}>
        HTTP-Variablen
      </AnchorHeading>
    </div>
  ),
};

/** A heading long enough to break: the symbol stays with the last word. */
export const Long: Story = {
  args: {
    id: "schnellstart-oauth",
    children: "Schnellstart: OAuth mit einem benutzerdefinierten Connector in claude.ai",
  },
  parameters: { visual: { viewport: { width: 420, height: 180 } } },
};

/**
 * The keyboard path, as a test: the link is reached with Tab, shows itself while it has the
 * focus, and leads to the section.
 */
export const Keyboard: Story = {
  args: { id: "token", children: "Das Token sicher aufbewahren" },
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole("link", { name: "Link zu diesem Abschnitt" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute("href", "#token");
    // It fades in on `snap`: wait for the fade, not for the first frame.
    await waitFor(() => expect(Number(getComputedStyle(link).opacity)).toBeGreaterThan(0.9));
  },
};
