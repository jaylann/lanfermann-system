import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { visual: { viewport: { width: 240, height: 110 } } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An empty socket. Click it: the plug seats and the tick draws itself. */
export const Default: Story = {
  args: { "aria-label": "Angemeldet bleiben" },
  parameters: {
    visual: { motion: [{ name: "check", click: '[data-slot="checkbox"]', frames: 8 }] },
  },
};

export const Checked: Story = {
  args: { defaultChecked: true, "aria-label": "Angemeldet bleiben" },
};

/** Some, not all, of the rows it stands for are selected. */
export const Indeterminate: Story = {
  args: { indeterminate: true, "aria-label": "Alle auswählen" },
};

/** Wrap the box and its text in one `<label>`: the whole row is the target. */
export const WithLabel: Story = {
  parameters: { visual: { viewport: { width: 320, height: 200 } } },
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Checkbox defaultChecked />
        Website
      </label>
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Checkbox />
        Google-Profil
      </label>
      <label className="flex items-center gap-2.5 text-control text-on-disabled">
        <Checkbox disabled />
        Automatisierung (bald)
      </label>
      <label className="flex items-center gap-2.5 text-control text-on-disabled">
        <Checkbox disabled defaultChecked />
        Hosting (enthalten)
      </label>
    </div>
  ),
};
