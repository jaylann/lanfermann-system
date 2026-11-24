import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { CoverSlide } from "./cover-slide";
import { CoverSlideExample } from "./cover-slide.example";

const meta = {
  title: "Slides/CoverSlide",
  component: CoverSlide,
  decorators: [onStage],
  parameters: slideParameters,
  args: { title: "Der digitale Handschlag." },
} satisfies Meta<typeof CoverSlide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The cover on Ink with the rising forms. */
export const Default: Story = {
  render: () => <CoverSlideExample />,
};

/** For one client: the wordmark becomes a lockup with the client's name. */
export const ForOneClient: Story = {
  render: () => (
    <CoverSlide
      partner="Schreinerei Mustermann"
      title={
        <>
          Ihre Website,
          <br />
          neu gedacht.
        </>
      }
      lead={
        <>
          Analyse, Vorschlag und Festpreis
          <br />
          für die Schreinerei Mustermann.
        </>
      }
      audience="Für Max Mustermann"
      byline="Justin Lanfermann, 11.11.2026"
    />
  ),
};

/** A title line longer than 16 characters takes the `drop` forms, which leave the lower half free. */
export const LongTitle: Story = {
  render: () => (
    <CoverSlide
      forms="drop"
      title={
        <>
          Was kleine Modelle
          <br />
          wirklich können.
        </>
      }
      lead={
        <>
          Wie ein kleines Sprachmodell lernt,
          <br />
          auf dem Gerät zuverlässig Aktionen auszuführen.
        </>
      }
      audience="Projektvorstellung, November 2026"
      byline="Justin Lanfermann"
    />
  ),
};
