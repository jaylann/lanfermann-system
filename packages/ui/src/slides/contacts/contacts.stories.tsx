import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Contacts } from "./contacts";
import { ContactsExample } from "./contacts.example";

const meta = {
  title: "Slides/Contacts",
  component: Contacts,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Contacts>;

export default meta;
type Story = StoryObj;

/** Three contact routes under the closing ask on Indigo, each on four columns with its icon. */
export const Default: Story = {
  render: () => <ContactsExample />,
};
