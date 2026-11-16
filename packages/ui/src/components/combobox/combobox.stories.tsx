import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  type ComboboxOption,
} from "./combobox";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 400, height: 420 },
      clip: "viewport",
      target: '[data-slot="combobox-input-group"]',
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

type Customer = ComboboxOption & { detail: string };

const CUSTOMERS: Customer[] = [
  { value: "k-1042", label: "Schreinerei Mustermann", detail: "Rosenheim" },
  { value: "k-1043", label: "Bäckerei Kornprobst", detail: "München" },
  { value: "k-1044", label: "Friseursalon Haarscharf", detail: "Augsburg" },
  { value: "k-1045", label: "Elektro Wagner", detail: "Ingolstadt" },
  { value: "k-1046", label: "Metzgerei Obermaier", detail: "Erding" },
  { value: "k-1047", label: "Zimmerei Huber", detail: "Bad Tölz" },
  { value: "k-1048", label: "Malerbetrieb Sedlmayr", detail: "Freising" },
  { value: "k-1049", label: "Gärtnerei Blattwerk", detail: "Dachau" },
  { value: "k-1050", label: "Brauerei Hopfenstolz", detail: "Landshut" },
  { value: "k-1051", label: "Café Morgenrot", detail: "Regensburg" },
  { value: "k-1052", label: "Schlosserei Eisenhart", detail: "Passau" },
  { value: "k-1053", label: "Blumen Rosenthal", detail: "Starnberg" },
];

function CustomerPicker(props: {
  defaultOpen?: boolean;
  defaultValue?: Customer;
  defaultInputValue?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const { invalid, disabled, ...combobox } = props;
  return (
    <Field className="w-80" invalid={invalid} disabled={disabled}>
      <FieldLabel>Kunde</FieldLabel>
      <Combobox items={CUSTOMERS} locale="de-DE" {...combobox}>
        <ComboboxInput placeholder="z. B. Schreinerei Huber" />
        <ComboboxContent empty="Kein Kunde gefunden.">
          {(customer: Customer) => <ComboboxItem key={customer.value} value={customer} />}
        </ComboboxContent>
      </Combobox>
      {invalid ? (
        <FieldError match>Bitte wählen Sie einen Kunden aus der Liste.</FieldError>
      ) : (
        <FieldDescription>An ihn geht das Angebot.</FieldDescription>
      )}
    </Field>
  );
}

/** Nothing chosen yet: an example in italics, and a chevron that opens the whole list. */
export const Default: Story = {
  parameters: {
    visual: {
      viewport: { width: 400, height: 150 },
      clip: "content",
      motion: [{ name: "open", click: '[data-slot="combobox-trigger"]', frames: 8 }],
    },
  },
  render: () => <CustomerPicker />,
};

/**
 * A customer picker, open. Each row has the name and, quieter at the right edge, the place. The
 * chosen one carries the disc, and a cross in the field takes the choice back.
 */
export const Open: Story = {
  render: () => <CustomerPicker defaultOpen defaultValue={CUSTOMERS[1]} />,
};

/** Typing filters the list, by any part of the name and without regard to case or accents. */
export const Filtered: Story = {
  render: () => <CustomerPicker defaultOpen defaultInputValue="rei" />,
};

/** Nothing matches: the sheet says so, in words that name what was looked for. */
export const Empty: Story = {
  render: () => <CustomerPicker defaultOpen defaultInputValue="Zahnarzt" />,
};

const GROUPED = [
  { value: "Kunden", items: CUSTOMERS.slice(0, 4) },
  { value: "Interessenten", items: CUSTOMERS.slice(4, 7) },
];

/** Groups get a quiet label, as in a menu. */
export const Grouped: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Kunde</FieldLabel>
      <Combobox items={GROUPED} locale="de-DE" defaultOpen>
        <ComboboxInput placeholder="z. B. Schreinerei Huber" />
        <ComboboxContent empty="Kein Kunde gefunden.">
          {(group: (typeof GROUPED)[number]) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
              <ComboboxCollection>
                {(customer: Customer) => <ComboboxItem key={customer.value} value={customer} />}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxContent>
      </Combobox>
    </Field>
  ),
};

/** The cross only shows once there is something to take back. */
export const Chosen: Story = {
  parameters: {
    visual: {
      viewport: { width: 400, height: 150 },
      clip: "content",
      motion: [{ name: "clear", click: '[data-slot="combobox-clear"]', frames: 6 }],
    },
  },
  render: () => <CustomerPicker defaultValue={CUSTOMERS[0]} />,
};

export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 400, height: 170 }, clip: "content" } },
  render: () => <CustomerPicker invalid />,
};

export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 400, height: 170 }, clip: "content" } },
  render: () => <CustomerPicker disabled defaultValue={CUSTOMERS[0]} />,
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 400, height: 230 }, clip: "content" } },
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Combobox key={size} items={CUSTOMERS} locale="de-DE" defaultValue={CUSTOMERS[0]}>
          <ComboboxInput size={size} aria-label="Kunde" />
          <ComboboxContent empty="Kein Kunde gefunden.">
            {(customer: Customer) => <ComboboxItem key={customer.value} value={customer} />}
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  ),
};

/**
 * The keyboard path, as a test: typing filters and highlights the first match, the arrows move,
 * Enter chooses and closes, Escape closes without choosing, and the cross takes the choice back.
 */
export const Keyboard: Story = {
  render: () => <CustomerPicker />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByRole("combobox", { name: "Kunde" });
    const options = () => within(screen.getByRole("listbox")).getAllByRole("option");
    const option = (name: RegExp) =>
      within(screen.getByRole("listbox")).getByRole("option", { name });

    await step("Typing opens the list, filters it and highlights the first match", async () => {
      await userEvent.tab();
      await expect(input).toHaveFocus();
      await userEvent.keyboard("rei");
      await waitFor(() => expect(screen.getByRole("listbox")).toBeVisible());
      // Schreinerei, Bäckerei, Metzgerei, Zimmerei, Gärtnerei, Brauerei, Schlosserei.
      await expect(options()).toHaveLength(7);
      await expect(option(/Schreinerei Mustermann/)).toHaveAttribute("data-highlighted");
    });

    await step("ArrowDown moves the highlight, Enter chooses and closes", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await expect(option(/Bäckerei Kornprobst/)).toHaveAttribute("data-highlighted");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await expect(input).toHaveValue("Bäckerei Kornprobst");
      await expect(input).toHaveFocus();
    });

    await step("Case and accents do not matter: an umlaut is found without typing it", async () => {
      await userEvent.clear(input);
      await userEvent.keyboard("GART");
      await waitFor(() => expect(options()).toHaveLength(1));
      await expect(option(/Gärtnerei Blattwerk/)).toHaveAttribute("data-highlighted");
    });

    await step("Escape closes the list and keeps the earlier choice", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await expect(input).toHaveFocus();
    });

    await step("Nothing matches: the sheet says so", async () => {
      await userEvent.clear(input);
      await userEvent.keyboard("Zahnarzt");
      // The sheet fades in: it is there before it can be seen.
      await waitFor(() => expect(screen.getByText("Kein Kunde gefunden.")).toBeVisible());
      await userEvent.keyboard("{Escape}");
    });
  },
};
