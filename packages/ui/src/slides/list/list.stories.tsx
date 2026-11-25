import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { List } from "./list";
import { ListExample } from "./list.example";

const meta = {
  title: "Slides/List",
  component: List,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj;

/** Four plain rows under one rule, each opened by a few bold words. */
export const Default: Story = {
  render: () => <ListExample />,
};

/** At step 1: the first row stands from the start under the rule, the second has appeared with its line, the last two keep their places unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>Was eine gute Handwerker-Seite leistet.</Title>
      <Spacer />
      <List
        items={[
          <>
            <b>Sie sagt sofort, was Sie tun und wo.</b> Ohne Scrollen, ohne Slogan.
          </>,
          {
            text: (
              <>
                <b>Sie macht den Anruf leicht.</b> Die Nummer steht oben und lässt sich antippen.
              </>
            ),
            step: 1,
          },
          {
            text: (
              <>
                <b>Sie zeigt Ihre Arbeit.</b> Echte Fotos von echten Projekten, keine Agenturbilder.
              </>
            ),
            step: 2,
          },
          {
            text: (
              <>
                <b>Sie lädt schnell.</b> Auch im Mobilfunknetz auf der Baustelle.
              </>
            ),
            step: 3,
          },
        ]}
      />
    </Slide>
  ),
};
