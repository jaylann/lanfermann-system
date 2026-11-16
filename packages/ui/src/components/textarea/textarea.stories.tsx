import type { Meta, StoryObj } from "@storybook/react-vite";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";

import { Textarea } from "./textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  args: { placeholder: "z. B. Wir brauchen die Website bis zur Messe im März.", className: "w-80" },
  parameters: { visual: { viewport: { width: 400, height: 170 } } },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With `autoGrow` it grows with the text instead of scrolling. */
export const Filled: Story = {
  args: {
    autoGrow: true,
    defaultValue:
      "Wir sind eine Schreinerei mit acht Leuten in Rosenheim. Die alte Website ist von 2014 und auf dem Handy kaum zu lesen. Wichtig sind uns Anfragen für Küchen und Einbauschränke.",
  },
  parameters: { visual: { viewport: { width: 400, height: 220 } } },
};

/** In a field it takes the label, the description and the error like an input. */
export const InField: Story = {
  parameters: { visual: { viewport: { width: 400, height: 260 } } },
  render: (args) => (
    <Field invalid className="w-80">
      <FieldLabel>Ihr Anliegen</FieldLabel>
      <Textarea {...args} className={undefined} defaultValue="Website" />
      <FieldError match>Bitte beschreiben Sie Ihr Anliegen in ein, zwei Sätzen.</FieldError>
      <FieldDescription>Je genauer, desto passender unser Angebot.</FieldDescription>
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Wird von uns ausgefüllt." },
};
