import type { Meta, StoryObj } from "@storybook/react-vite";

import { ICONS } from "@/slides/icon/icons";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

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

/** At step 1 on Indigo: the mail address stands from the start, the website has appeared with its rule, the visit keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide ground="indigo" footer={false} gap={48}>
      <Spacer />
      <Title size="cover">
        Eine kostenlose
        <br />
        Analyse.
      </Title>
      <Lead>
        Ich schaue mir an, was Sie haben, was die Konkurrenz macht
        <br />
        und wo die Lücken sind. Unverbindlich.
      </Lead>
      <Contacts
        items={[
          ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
          ["Web", "lanfermann.dev", ICONS.globe, 1],
          ["Vor Ort", "München, direkt bei Ihnen", ICONS.pin, 2],
        ]}
      />
    </Slide>
  ),
};
