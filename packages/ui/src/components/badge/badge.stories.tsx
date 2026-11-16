import { Clock01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "@/components/icon/icon";

import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Entwurf" },
  parameters: { visual: { viewport: { width: 520, height: 110 } } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The word carries the state; the colour only supports it. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Entwurf</Badge>
      <Badge tone="info">Gesendet</Badge>
      <Badge tone="success">Bezahlt</Badge>
      <Badge tone="warning">
        <Icon icon={Clock01Icon} size={12} />
        Fällig in 3 Tagen
      </Badge>
      <Badge tone="danger">Überfällig</Badge>
    </div>
  ),
};
