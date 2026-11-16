import type { Meta, StoryObj } from "@storybook/react-vite";

import { Field, FieldLabel } from "@/components/field/field";
import { Input } from "@/components/input/input";

import { Fieldset, FieldsetLegend } from "./fieldset";

const meta = {
  title: "Components/Fieldset",
  component: Fieldset,
  parameters: { visual: { viewport: { width: 440, height: 300 } } },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One name over several fields that belong together. */
export const Default: Story = {
  render: () => (
    <Fieldset className="w-96">
      <FieldsetLegend>Rechnungsadresse</FieldsetLegend>
      <Field>
        <FieldLabel>Straße und Hausnummer</FieldLabel>
        <Input defaultValue="Werkstattweg 12" />
      </Field>
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Field>
          <FieldLabel>PLZ</FieldLabel>
          <Input defaultValue="83022" inputMode="numeric" />
        </Field>
        <Field>
          <FieldLabel>Ort</FieldLabel>
          <Input defaultValue="Rosenheim" />
        </Field>
      </div>
    </Fieldset>
  ),
};
