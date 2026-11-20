import { Calendar03Icon, FilterIcon, UserIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { ButtonGroup } from "@/components/button-group/button-group";
import { Icon } from "@/components/icon/icon";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/menu/menu";
import { ChevronDownGlyph, CloseGlyph } from "@/internal/glyphs";

import { Chip, type ChipProps } from "./chip";
import { ChipGroup } from "./chip-group";

const meta = {
  title: "Components/Chip",
  component: Chip,
  args: { children: "Offen" },
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 620, height: 130 } },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const waiting = ["Über 1.000 €", "Mit Anhang", "Von mir"];

/** The filters on a list of quotes, kept in state: each can be taken away, more can join. */
function Filters({ variant }: Pick<ChipProps, "variant">) {
  const [filters, setFilters] = useState(["Offen", "Schreinerei Huber", "Seit Oktober"]);
  const next = waiting.find((filter) => !filters.includes(filter));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ChipGroup aria-label="Filter">
        {filters.map((filter) => (
          <Chip
            key={filter}
            variant={variant}
            onRemove={() => setFilters((all) => all.filter((entry) => entry !== filter))}
          >
            {filter}
          </Chip>
        ))}
      </ChipGroup>
      <Button
        size="sm"
        variant="quiet"
        disabled={!next}
        onClick={() => next && setFilters((all) => [...all, next])}
      >
        <Icon icon={FilterIcon} size={14} />
        Filter hinzufügen
      </Button>
    </div>
  );
}

/**
 * Chips that can be taken away. Press the cross of one: it fades and the row closes its place.
 * Add one: it opens its place and seats in.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="chip-remove"]',
      motion: [
        {
          name: "leave",
          click: '[data-slot="chip-place"]:nth-child(2) [data-slot="chip-remove"]',
          frames: 8,
        },
        { name: "join", click: '[data-slot="button"]', frames: 8 },
      ],
    },
  },
  render: () => <Filters />,
};

/** Without a key: something that was chosen and is only shown, with or without a symbol. */
export const Plain: Story = {
  render: () => (
    <ChipGroup aria-label="Angaben">
      <Chip>Offen</Chip>
      <Chip icon={UserIcon}>Schreinerei Huber</Chip>
      <Chip icon={Calendar03Icon}>Seit Oktober</Chip>
      <Chip disabled onRemove={() => {}}>
        Gesperrt
      </Chip>
    </ChipGroup>
  ),
};

/** `variant="flat"`: drawn like a `Badge`, for a row where raised chips would be too much. */
export const Flat: Story = {
  parameters: { visual: { target: '[data-slot="chip-remove"]' } },
  render: () => <Filters variant="flat" />,
};

const states = ["Offen", "Gesendet", "Bezahlt", "Abgelaufen"];

/**
 * A filter whose value can be changed where it stands: one fitting of two keys (`ButtonGroup`),
 * the first opening the values, the second taking the filter away. A pattern made from parts,
 * not a part of its own.
 */
export const FilterRow: Story = {
  parameters: { visual: { viewport: { width: 620, height: 260 }, clip: "viewport" } },
  render: function Render() {
    const [status, setStatus] = useState("Bezahlt");
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ButtonGroup size="sm" aria-label="Filter nach Status">
          <Menu>
            <MenuTrigger render={<Button />}>
              <span className="text-fg-muted">Status</span>
              {status}
              <ChevronDownGlyph width={10} height={10} className="text-fg-muted" />
            </MenuTrigger>
            <MenuContent>
              <MenuRadioGroup value={status} onValueChange={(value: string) => setStatus(value)}>
                {states.map((state) => (
                  <MenuRadioItem key={state} value={state}>
                    {state}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuContent>
          </Menu>
          <Button iconOnly aria-label="Filter nach Status entfernen">
            <CloseGlyph width={8} height={8} />
          </Button>
        </ButtonGroup>
        <Chip onRemove={() => {}}>Schreinerei Huber</Chip>
        <Button size="sm" variant="quiet">
          <Icon icon={FilterIcon} size={14} />
          Filter hinzufügen
        </Button>
      </div>
    );
  },
};

/**
 * The keyboard path, as a test: Tab goes from cross to cross, each named after its chip; Enter
 * takes the chip away, and the focus goes to the chip beside it.
 */
export const Keyboard: Story = {
  render: () => <Filters />,
  play: async ({ canvas, userEvent, step }) => {
    const list = canvas.getByRole("list", { name: "Filter" });

    await step("each cross is named after its chip", async () => {
      await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Offen Entfernen" })).toHaveFocus();
      await userEvent.tab();
      await expect(
        canvas.getByRole("button", { name: "Schreinerei Huber Entfernen" }),
      ).toHaveFocus();
    });

    await step("Enter takes the chip away, and the focus goes to the next one", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("button", { name: "Seit Oktober Entfernen" })).toHaveFocus();
      await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
      await expect(list).not.toHaveTextContent("Schreinerei Huber");
    });

    await step("the last chip hands the focus back to the one before it", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("button", { name: "Offen Entfernen" })).toHaveFocus();
      await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(1));
    });

    await step("a new chip joins the row", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Filter hinzufügen" }));
      await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
      await expect(list).toHaveTextContent("Über 1.000 €");
    });
  },
};
