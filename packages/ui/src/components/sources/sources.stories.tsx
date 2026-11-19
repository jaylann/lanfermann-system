import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Message, MessageContent } from "@/components/message/message";

import { SourceList, Sources } from "./sources";
import { SourcedAnswer, SOURCES } from "./story-sources";

const meta = {
  title: "Components/Sources",
  component: Sources,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 760, height: 420 },
      target: '[data-slot="source-reference"]',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Answer({ open }: { open?: number }) {
  return (
    <Message from="assistant">
      <Sources items={SOURCES} defaultOpen={open}>
        <MessageContent>
          <SourcedAnswer />
        </MessageContent>
        <SourceList />
      </Sources>
    </Message>
  );
}

/**
 * An answer that names its sources: a small raised number after the sentence, in the accent, and
 * the list under the answer, each source a plain link with its site.
 */
export const InAnAnswer: Story = {
  render: () => <Answer />,
};

/** Under the pointer or with the keyboard on a number: the card with the site, title and text. */
export const CardOpen: Story = {
  parameters: {
    visual: { viewport: { width: 760, height: 460 }, clip: "viewport" },
  },
  render: () => <Answer open={2} />,
};

/** On a phone a tap on a number leads to its entry in the list, which stands on the tint. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 640 } } },
  render: () => <Answer />,
};

/**
 * From the keyboard: a number is a link named after its source; with the keyboard on it the
 * card opens, and following it leads to the entry in the list.
 */
export const Keyboard: Story = {
  render: () => <Answer />,
  play: async ({ canvas, userEvent, step }) => {
    const first = canvas.getAllByRole("link", { name: /^Quelle 1: Angebot 2026-0421/ })[0]!;
    await step("a number is named after its source", async () => {
      await userEvent.tab();
      await expect(first).toHaveFocus();
    });
    await step("with the keyboard on it, the card opens", async () => {
      await waitFor(() =>
        expect(document.querySelector('[data-slot="source-card"]')).toBeVisible(),
      );
      await expect(document.querySelector('[data-slot="source-card"]')).toHaveTextContent(
        "Website mit Bestellformular für Torten",
      );
    });
    await step("it leads to the entry in the list", async () => {
      // Followed here, the link would move the test's own page; where it leads is enough.
      const target = first.getAttribute("href")!.slice(1);
      const entry = document.getElementById(target);
      await expect(entry).not.toBeNull();
      await expect(entry).toHaveTextContent("Angebot 2026-0421");
    });
  },
};
