import { Building03Icon, UserIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { RadioGroup, type RadioGroupProps } from "@/components/radio/radio";

import { RadioCard, type RadioCardProps } from "./radio-card";

const meta = {
  title: "Components/RadioCard",
  component: RadioCard,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 860, height: 220 },
      target: '[data-slot="radio-card"]:nth-of-type(3)',
      motion: [{ name: "choose", click: '[data-slot="radio-card"]:nth-of-type(3)', frames: 8 }],
    },
  },
} satisfies Meta;

export default meta;
// A card needs a group around it, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

type Options = Pick<RadioCardProps, "chosen"> & Pick<RadioGroupProps, "disabled" | "onValueChange">;

function Plans({ chosen, ...props }: Options) {
  return (
    <RadioGroup
      aria-label="Tarif"
      defaultValue="team"
      className="grid gap-3 sm:grid-cols-3"
      {...props}
    >
      <RadioCard
        value="solo"
        chosen={chosen}
        title="Solo"
        detail="12 € im Monat"
        description="Für eine Person. Angebote, Rechnungen und ein Postfach."
      />
      <RadioCard
        value="team"
        chosen={chosen}
        title="Team"
        detail="29 € im Monat"
        description="Bis zu zehn Personen, gemeinsame Vorlagen und Freigaben."
      />
      <RadioCard
        value="betrieb"
        chosen={chosen}
        title="Betrieb"
        detail="79 € im Monat"
        description="Beliebig viele Personen, mehrere Standorte und DATEV-Export."
      />
    </RadioGroup>
  );
}

/**
 * Three plans, one chosen: it wears the accent as its edge and its mark is closed. Press
 * another: the card goes down and seats back, and the mark closes in it.
 */
export const Default: Story = {
  render: () => <Plans />,
};

/** `chosen="mark"`: the mark alone says which one is chosen. */
export const MarkOnly: Story = {
  render: () => <Plans chosen="mark" />,
};

/** With a symbol before each title, one under the other: answers in a set-up. */
export const WithIcons: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 330 },
      target: '[data-slot="radio-card"]:nth-of-type(3)',
    },
  },
  render: () => (
    <RadioGroup aria-label="Wer arbeitet hier?" defaultValue="allein" className="gap-3">
      <RadioCard
        value="allein"
        icon={UserIcon}
        title="Ich allein"
        description="Ein Arbeitsbereich für mich. Andere kann ich später einladen."
      />
      <RadioCard
        value="team"
        icon={UserMultipleIcon}
        title="Ein kleines Team"
        description="Zwei bis zehn Personen, die an denselben Angeboten arbeiten."
      />
      <RadioCard
        value="betrieb"
        icon={Building03Icon}
        title="Ein Betrieb mit Abteilungen"
        description="Mehrere Teams mit eigenen Vorlagen und eigener Freigabe."
      />
    </RadioGroup>
  ),
};

/** None of them can be chosen right now: the cards lie flat. */
export const Disabled: Story = {
  parameters: { visual: { motion: [] } },
  render: () => <Plans disabled />,
};

/** On a phone the cards stand one under the other, each as wide as the page. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 400 } } },
  render: () => <Plans />,
};

/** What the group reports in the test below. */
const changed = fn();

/**
 * The keyboard path, as a test: Tab reaches the chosen card, the arrow keys move the choice
 * from card to card, and each card is named by its title and described by its sentence.
 */
export const Keyboard: Story = {
  render: () => <Plans onValueChange={changed} />,
  play: async ({ canvas, userEvent, step }) => {
    changed.mockClear();
    const card = (name: string) => canvas.getByRole("radio", { name });

    await step("each card is named by its title and described by its sentence", async () => {
      await expect(canvas.getAllByRole("radio")).toHaveLength(3);
      await expect(card("Team")).toBeChecked();
      await expect(card("Team")).toHaveAccessibleDescription(
        "Bis zu zehn Personen, gemeinsame Vorlagen und Freigaben.",
      );
    });

    await step("Tab reaches the chosen card, the arrows move the choice", async () => {
      await userEvent.tab();
      await expect(card("Team")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(card("Betrieb")).toHaveFocus();
      await expect(card("Betrieb")).toBeChecked();
      await expect(changed).toHaveBeenLastCalledWith("betrieb", expect.anything());
    });

    await step("a press anywhere on a card chooses it", async () => {
      await userEvent.click(
        canvas.getByText("Für eine Person. Angebote, Rechnungen und ein Postfach."),
      );
      await expect(card("Solo")).toBeChecked();
      await expect(card("Betrieb")).not.toBeChecked();
    });
  },
};
