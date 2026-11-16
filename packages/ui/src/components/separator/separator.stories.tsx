import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "padded", visual: { viewport: { width: 560, height: 300 } } },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A rule opens the block, lines divide its rows. No box needed. */
export const Structure: Story = {
  render: () => (
    <div className="flex max-w-md flex-col">
      <Separator variant="rule" />
      <p className="py-3 text-lg font-semibold text-fg">Leistungen.</p>
      <Separator variant="line" />
      <div className="flex justify-between py-3 text-fg-body">
        <span>Website</span>
        <span className="tabular-nums">2.400,00 €</span>
      </div>
      <Separator />
      <div className="flex justify-between py-3 text-fg-body">
        <span>Google-Profil</span>
        <span className="tabular-nums">380,00 €</span>
      </div>
      <Separator />
      <div className="flex h-11 items-center gap-3 text-sm text-fg-muted">
        Entwurf
        <Separator orientation="vertical" className="my-3.5" />
        Zuletzt geändert heute
      </div>
    </div>
  ),
};
