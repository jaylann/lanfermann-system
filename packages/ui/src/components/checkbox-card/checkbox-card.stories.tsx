import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { CheckboxGroup, type CheckboxGroupProps } from "@/components/checkbox-group/checkbox-group";

import { CheckboxCard, type CheckboxCardProps } from "./checkbox-card";

const meta = {
  title: "Components/CheckboxCard",
  component: CheckboxCard,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 640, height: 290 },
      target: '[data-slot="checkbox-card"]:nth-of-type(3)',
      motion: [{ name: "choose", click: '[data-slot="checkbox-card"]:nth-of-type(3)', frames: 8 }],
    },
  },
} satisfies Meta;

export default meta;
// A card needs a group around it, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

type Options = Pick<CheckboxCardProps, "chosen"> &
  Pick<CheckboxGroupProps, "disabled" | "onValueChange">;

function Uses({ chosen, ...props }: Options) {
  const look = { chosen };
  return (
    <CheckboxGroup
      aria-label="Wofür nutzen Sie den Arbeitsbereich?"
      defaultValue={["angebote", "rechnungen"]}
      className="grid gap-3 sm:grid-cols-2"
      {...props}
    >
      <CheckboxCard
        value="angebote"
        {...look}
        title="Angebote schreiben"
        description="Vorlagen, Positionen und die Freigabe durch die Kundin."
      />
      <CheckboxCard
        value="rechnungen"
        {...look}
        title="Rechnungen stellen"
        description="Aus einem Angebot, mit Zahlungsziel und Mahnung."
      />
      <CheckboxCard
        value="zeiten"
        {...look}
        title="Zeiten erfassen"
        description="Stunden je Auftrag, als Grundlage für die Rechnung."
      />
      <CheckboxCard
        value="belege"
        {...look}
        title="Belege sammeln"
        description="Quittungen fotografieren und der Steuerberatung übergeben."
      />
    </CheckboxGroup>
  );
}

/**
 * Several may be chosen: each card that is on wears the accent as its edge, and its box is
 * ticked. Press one: its shadow tightens and its box dips, then the accent edge eases in and
 * the tick draws itself.
 */
export const Default: Story = {
  render: () => <Uses />,
};

/**
 * `chosen="mark"`: without the accent edge, the box alone says which ones are on. For a place
 * where several accent edges at once would be too much.
 */
export const MarkOnly: Story = {
  render: () => <Uses chosen="mark" />,
};

/** None of them can be changed right now: the cards lie flat. */
export const Disabled: Story = {
  parameters: { visual: { motion: [] } },
  render: () => <Uses disabled />,
};

/** On a phone the cards stand one under the other. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 460 } } },
  render: () => <Uses />,
};

/** What the group reports in the test below. */
const changed = fn();

/**
 * The keyboard path, as a test: Tab goes from card to card, Space turns one on or off, and the
 * group reports the list of what is on.
 */
export const Keyboard: Story = {
  render: () => <Uses onValueChange={changed} />,
  play: async ({ canvas, userEvent, step }) => {
    changed.mockClear();
    const card = (name: string) => canvas.getByRole("checkbox", { name });

    await step("each card is named by its title and described by its sentence", async () => {
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(4);
      await expect(card("Zeiten erfassen")).toHaveAccessibleDescription(
        "Stunden je Auftrag, als Grundlage für die Rechnung.",
      );
    });

    await step("Tab goes from card to card, Space turns one on", async () => {
      await userEvent.tab();
      await expect(card("Angebote schreiben")).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      await expect(card("Zeiten erfassen")).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(card("Zeiten erfassen")).toBeChecked();
      await expect(changed).toHaveBeenLastCalledWith(
        ["angebote", "rechnungen", "zeiten"],
        expect.anything(),
      );
    });

    await step("a press anywhere on a card turns it off again", async () => {
      await userEvent.click(canvas.getByText("Aus einem Angebot, mit Zahlungsziel und Mahnung."));
      await expect(card("Rechnungen stellen")).not.toBeChecked();
    });
  },
};
