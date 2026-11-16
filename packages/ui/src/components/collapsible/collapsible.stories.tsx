import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Input } from "@/components/input/input";
import { Textarea } from "@/components/textarea/textarea";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { visual: { viewport: { width: 480, height: 200 } } },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

function Breakdown() {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-control text-fg-body">
      <dt>Website und Google-Profil</dt>
      <dd className="text-right tabular-nums">2.336,13 €</dd>
      <dt>Umsatzsteuer 19 %</dt>
      <dd className="text-right tabular-nums">443,87 €</dd>
    </dl>
  );
}

/** Closed, it is one line: the name of what is inside, with a chevron in front. */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="collapsible-trigger"]',
      motion: [{ name: "open", click: '[data-slot="collapsible-trigger"]', frames: 8 }],
    },
  },
  render: () => (
    // A fixed height, so the line stays where it is while the panel opens under it.
    <div className="h-[104px] w-[380px] max-w-[calc(100vw-2rem)]">
      <Collapsible>
        <CollapsibleTrigger>Zusammensetzung</CollapsibleTrigger>
        <CollapsiblePanel>
          <Breakdown />
        </CollapsiblePanel>
      </Collapsible>
    </div>
  ),
};

/** Open, the chevron points down and the panel stands under the line, as wide as its container. */
export const Open: Story = {
  parameters: {
    visual: { motion: [{ name: "close", click: '[data-slot="collapsible-trigger"]', frames: 6 }] },
  },
  render: () => (
    <div className="h-[104px] w-[380px] max-w-[calc(100vw-2rem)]">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Zusammensetzung</CollapsibleTrigger>
        <CollapsiblePanel>
          <Breakdown />
        </CollapsiblePanel>
      </Collapsible>
    </div>
  ),
};

/**
 * The optional part of a form. The fields inside keep their focus halo: the panel clips, but it
 * is a little wider than what it holds.
 */
export const InForm: Story = {
  parameters: { visual: { viewport: { width: 480, height: 440 } } },
  render: () => (
    <div className="flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-4">
      <Field name="betrieb">
        <FieldLabel>Betrieb</FieldLabel>
        <Input defaultValue="Schreinerei Mustermann" />
      </Field>
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Weitere Angaben</CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-4">
            <Field name="ansprechpartner">
              <FieldLabel>Ansprechpartner</FieldLabel>
              <Input placeholder="z. B. Max Mustermann" />
            </Field>
            <Field name="notiz">
              <FieldLabel>Notiz</FieldLabel>
              <Textarea placeholder="z. B. erreichbar ab 16 Uhr" />
              <FieldDescription>Nur für Sie sichtbar.</FieldDescription>
            </Field>
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  ),
};

/** Disabled, the line goes quiet and stays as it is. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 480, height: 120 } } },
  render: () => (
    <Collapsible disabled className="w-[380px] max-w-[calc(100vw-2rem)]">
      <CollapsibleTrigger>Zusammensetzung</CollapsibleTrigger>
      <CollapsiblePanel>
        <Breakdown />
      </CollapsiblePanel>
    </Collapsible>
  ),
};

/**
 * The keyboard path, as a test: the line is a button, Enter opens the panel and Space closes it,
 * and the button says which of the two it is.
 */
export const Keyboard: Story = {
  render: Default.render,
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Zusammensetzung" });

    await step("Tab lands on the line, which is closed", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("Enter opens the panel", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await waitFor(() => expect(canvas.getByText("Umsatzsteuer 19 %")).toBeVisible());
    });

    await step("Space closes it and the focus stays on the line", async () => {
      await userEvent.keyboard(" ");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.queryByText("Umsatzsteuer 19 %")).toBeNull());
      await expect(trigger).toHaveFocus();
    });
  },
};
