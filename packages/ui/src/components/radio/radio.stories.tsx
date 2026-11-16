import type { Meta, StoryObj } from "@storybook/react-vite";

import { Radio, RadioGroup } from "./radio";

const meta = {
  title: "Components/Radio",
  component: RadioGroup,
  parameters: { visual: { viewport: { width: 320, height: 200 } } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One choice out of a few. The disc seats into the ring; the previous one shrinks away. */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="radio"]:not([data-checked])',
      motion: [{ name: "choose", click: 'label:nth-of-type(2) [data-slot="radio"]', frames: 8 }],
    },
  },
  render: () => (
    <RadioGroup defaultValue="festpreis" aria-label="Abrechnung">
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Radio value="festpreis" />
        Festpreis
      </label>
      <label className="flex items-center gap-2.5 text-control text-fg-body">
        <Radio value="aufwand" />
        Nach Aufwand
      </label>
      <label className="flex items-center gap-2.5 text-control text-on-disabled">
        <Radio value="abo" disabled />
        Im Abo (bald)
      </label>
    </RadioGroup>
  ),
};

/** With a second line: the label says what, the line below says what it means. */
export const WithDescriptions: Story = {
  parameters: { visual: { viewport: { width: 460, height: 220 } } },
  render: () => (
    <RadioGroup defaultValue="jahr" aria-label="Zahlungsweise" className="gap-4">
      <label className="flex items-start gap-2.5">
        <Radio value="jahr" className="mt-0.5" />
        <span className="flex flex-col">
          <span className="text-control font-medium text-fg">Jährlich</span>
          <span className="text-sm text-fg-muted">
            Zwei Monate geschenkt, eine Rechnung im Jahr.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2.5">
        <Radio value="monat" className="mt-0.5" />
        <span className="flex flex-col">
          <span className="text-control font-medium text-fg">Monatlich</span>
          <span className="text-sm text-fg-muted">Jederzeit zum Monatsende kündbar.</span>
        </span>
      </label>
    </RadioGroup>
  ),
};
