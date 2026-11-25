import type { Meta, StoryObj } from "@storybook/react-vite";

import { Body } from "@/slides/body/body";
import { Forms } from "@/slides/forms/forms";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Wordmark } from "./wordmark";
import { WordmarkExample } from "./wordmark.example";

const meta = {
  title: "Slides/Wordmark",
  component: Wordmark,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof Wordmark>;

/** Drawn at 32px on a cover: light letters with a lavender dot on Ink. */
export const Default: Story = {
  render: () => <WordmarkExample />,
};

/** Drawn at 32px on the closing slide: on Indigo the accent is white, so the whole word is. */
export const Closing: Story = {
  render: () => (
    <Slide ground="indigo" footer={false} gap={48}>
      <Forms name="drop" />
      <Wordmark size={32} style={{ position: "absolute", left: 128, top: 128 }} />
      <Spacer />
      <Title size="cover">
        20 Minuten,
        <br />
        ein Befund.
      </Title>
      <Lead>
        Ich zeige Ihnen am Bildschirm, wo Ihnen Anfragen entgehen.
        <br />
        Danach entscheiden Sie.
      </Lead>
    </Slide>
  ),
};

/** Live text at 24px in the footer row of a content slide, where `Slide` draws it. */
export const FooterRow: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={2}>
      <Title>Kunden sehen online nach, bevor sie anrufen.</Title>
      <Spacer />
      <Body>96&#8239;% recherchieren lokale Betriebe online, bevor sie Kontakt aufnehmen.</Body>
      <Source>Quelle: BrightLocal, Local Consumer Review Survey 2024</Source>
    </Slide>
  ),
};
