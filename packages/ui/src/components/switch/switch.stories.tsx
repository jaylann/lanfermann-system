import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  args: { "aria-label": "Jährlich abrechnen" },
  parameters: { visual: { viewport: { width: 240, height: 110 } } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Off. Click it: the thumb travels and seats, the track fills. */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "switch-on", click: '[data-slot="switch"]', frames: 8 }] },
  },
};

export const On: Story = { args: { defaultChecked: true } };

/** For a setting that applies at once. If it needs a Save button, use a checkbox. */
export const WithLabel: Story = {
  parameters: { visual: { viewport: { width: 320, height: 180 } } },
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Switch defaultChecked />
        Jährlich abrechnen
      </label>
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Switch />
        Newsletter
      </label>
      <label className="flex items-center gap-2.5 text-control text-on-disabled">
        <Switch disabled />
        Rechnung per Post
      </label>
      <label className="flex items-center gap-2.5 text-control text-on-disabled">
        <Switch disabled defaultChecked />
        Rechnung per E-Mail
      </label>
    </div>
  ),
};
