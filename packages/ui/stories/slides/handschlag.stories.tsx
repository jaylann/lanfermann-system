import type { Meta, StoryObj } from "@storybook/react-vite";

import { flattenSlides } from "@/slides";
import { DeckProvider, SlidePositionProvider } from "@/slides/deck/deck-context";
import { onStage, slideParameters } from "@/slides/story-slide";

import { handschlag } from "./story-handschlag";

// The sample deck, one slide per story, as its `Deck` would show them: the footer row takes the
// deck's title and counts the pages. (No doc comment here: see .claude/rules/slides.md.)
const meta = {
  title: "Slides/Sample deck",
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const slides = flattenSlides(handschlag.props.children);

function slide(id: string): Story {
  const index = slides.findIndex((entry) => entry.id === id);
  return {
    render: () => (
      <DeckProvider title={handschlag.props.title} count={slides.length}>
        <SlidePositionProvider index={index}>{slides[index]?.element}</SlidePositionProvider>
      </DeckProvider>
    ),
  };
}

/** The cover on Ink. */
export const Cover: Story = slide("cover");

/** One figure with its source, set on the right. */
export const Recherche: Story = slide("recherche");

/** Three figures in a row, one of them in the accent. */
export const ErsterEindruck: Story = slide("erster-eindruck");

/** The claim on Ink. */
export const Vertrauen: Story = slide("vertrauen");

/** A screenshot's frame beside its numbered findings. */
export const Befunde: Story = slide("befunde");

/** Someone else's words on Tint, each beside its answer. */
export const Einwaende: Story = slide("einwaende");

/** Three parallel items under rules. */
export const Leistungen: Story = slide("leistungen");

/** Four steps in time. */
export const Ablauf: Story = slide("ablauf");

/** Three offers, the recommended price in the accent. */
export const Angebote: Story = slide("angebote");

/** The ask on Indigo. */
export const Analyse: Story = slide("analyse");
