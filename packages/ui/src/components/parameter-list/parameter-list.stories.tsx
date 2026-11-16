import type { Meta, StoryObj } from "@storybook/react-vite";

import { Code } from "@/components/code/code";

import { Parameter, ParameterList } from "./parameter-list";

const meta = {
  title: "Components/ParameterList",
  component: ParameterList,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 420 } },
  },
} satisfies Meta<typeof ParameterList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a tool takes: its name and type on the left, what it means on the right. The union in
 * the second row breaks after its bars, never inside a value.
 */
export const Default: Story = {
  render: () => (
    <ParameterList aria-label="Argumente">
      <Parameter name="id" type="integer" required>
        Die Id der Rechnung, nicht ihre Nummer, zum Beispiel aus der Liste der Rechnungen.
      </Parameter>
      <Parameter
        name="status"
        type={`"draft" | "open" | "paid" | "partially_paid" | "cancelled" | "overdue"`}
        required={false}
      >
        Nur Rechnungen in diesem Zustand.
      </Parameter>
      <Parameter name="dryRun" type="boolean" required={false} defaultValue={<Code>false</Code>}>
        Nur eine Vorschau: prüft den Aufruf und gibt zurück, was er täte, ohne in sevDesk etwas zu
        ändern.
      </Parameter>
    </ParameterList>
  ),
};

/** On a phone the description goes under the name. */
export const Phone: Story = {
  ...Default,
  parameters: { visual: { viewport: { width: 390, height: 560 } } },
};
