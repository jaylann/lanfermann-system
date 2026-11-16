import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "z. B. Schreinerei Huber", className: "w-64" },
  parameters: { visual: { viewport: { width: 340, height: 120 } } },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty: the placeholder is an example in italics, never a label. */
export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: "Schreinerei Mustermann" } };

/** The edge and the halo turn to danger. The reason is said in words by `FieldError`. */
export const Invalid: Story = { args: { defaultValue: "max@", "aria-invalid": true } };

export const Disabled: Story = { args: { defaultValue: "Schreinerei Mustermann", disabled: true } };

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 340, height: 220 } } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Input {...args} size="sm" />
      <Input {...args} size="md" />
      <Input {...args} size="lg" />
    </div>
  ),
};
