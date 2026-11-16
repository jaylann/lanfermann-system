import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "./container";

const meta = {
  title: "Components/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 260 }, clip: "viewport" },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const shown = "border-x border-line py-6 text-fg-body";

/**
 * The two widths. The lines mark the container's own edge; the text starts one gutter inside it.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 py-6">
      <Container className={shown}>
        <p>Eine Seite: 72rem, mit Platz für eine breite Abbildung neben ihrem Text.</p>
      </Container>
      <Container size="text" className={shown}>
        <p>
          Fließtext: 48rem. So bleibt eine Zeile bei höchstens etwa 80 Zeichen, und ein Absatz lässt
          sich lesen, ohne dass das Auge den Anfang der nächsten Zeile sucht.
        </p>
      </Container>
    </div>
  ),
};

/** On a phone the gutter is narrower, and the content takes what is left. */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 300 }, clip: "viewport" } },
  render: Sizes.render,
};
