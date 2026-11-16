import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";
import { Field, FieldLabel } from "@/components/field/field";
import { Input } from "@/components/input/input";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 400, height: 340 }, clip: "viewport" },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

function RenamePopover(props: { defaultOpen?: boolean }) {
  return (
    <Popover {...props}>
      <PopoverTrigger render={<Button />}>Umbenennen</PopoverTrigger>
      <PopoverContent align="start">
        <div className="flex flex-col gap-1">
          <PopoverTitle>Angebot umbenennen.</PopoverTitle>
          <PopoverDescription>Der Name steht auch auf dem PDF.</PopoverDescription>
        </div>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input defaultValue="Website Schreinerei Mustermann" />
        </Field>
        <div className="flex justify-end gap-2">
          <PopoverClose render={<Button variant="quiet" />}>Abbrechen</PopoverClose>
          <PopoverClose render={<Button variant="primary" />}>Speichern</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A few fields next to what they change. It grows out of its trigger. */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "open", click: '[data-slot="popover-trigger"]', frames: 8 }] },
  },
  render: () => <RenamePopover />,
};

export const Open: Story = { render: () => <RenamePopover defaultOpen /> };
