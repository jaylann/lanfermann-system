import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";

import {
  Combobox,
  ComboboxChips,
  type ComboboxChipsProps,
  ComboboxContent,
  ComboboxItem,
  type ComboboxOption,
} from "./combobox";

const meta = {
  title: "Components/Combobox multiple",
  component: ComboboxChips,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 420, height: 200 },
      target: '[data-slot="combobox-input-group"]',
    },
  },
} satisfies Meta<typeof ComboboxChips>;

export default meta;
type Story = StoryObj<typeof meta>;

type Label = ComboboxOption;

const LABELS: Label[] = [
  { value: "dringend", label: "Dringend" },
  { value: "stammkunde", label: "Stammkunde" },
  { value: "neukunde", label: "Neukunde" },
  { value: "rahmenvertrag", label: "Rahmenvertrag" },
  { value: "foerderung", label: "Förderung" },
  { value: "nachfassen", label: "Nachfassen" },
  { value: "wartung", label: "Wartung" },
  { value: "gewaehrleistung", label: "Gewährleistung" },
  { value: "ausschreibung", label: "Ausschreibung" },
];

type PickerProps = Pick<ComboboxChipsProps, "chipVariant" | "size"> & {
  chosen?: Label[];
  defaultOpen?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Something under the field, to see that it is pushed and does not jump. */
  below?: boolean;
};

function LabelPicker({
  chosen = [],
  invalid,
  disabled,
  below,
  defaultOpen,
  ...chips
}: PickerProps) {
  return (
    <div className="flex w-80 flex-col gap-4">
      <Field invalid={invalid} disabled={disabled}>
        <FieldLabel>Schlagwörter</FieldLabel>
        <Combobox
          multiple
          items={LABELS}
          locale="de-DE"
          defaultValue={chosen}
          defaultOpen={defaultOpen}
        >
          <ComboboxChips placeholder="z. B. Stammkunde" {...chips} />
          <ComboboxContent empty="Kein Schlagwort gefunden.">
            {(label: Label) => <ComboboxItem key={label.value} value={label} />}
          </ComboboxContent>
        </Combobox>
        {invalid ? (
          <FieldError match>Bitte wählen Sie mindestens ein Schlagwort.</FieldError>
        ) : (
          <FieldDescription>Damit finden Sie das Angebot später wieder.</FieldDescription>
        )}
      </Field>
      {below && (
        <Button variant="primary" className="self-start">
          Angebot speichern
        </Button>
      )}
    </div>
  );
}

const some = LABELS.slice(0, 2);
const many = LABELS.slice(0, 5);

/** Nothing chosen: an example in italics, and a chevron that opens the list. */
export const Default: Story = {
  render: () => <LabelPicker />,
};

/**
 * Two values: each is a chip seated in the field, with a key that takes it away. Press the
 * cross of one: it fades, and its neighbour closes up.
 */
export const WithValues: Story = {
  parameters: {
    visual: {
      target: '[data-slot="chip-remove"]',
      motion: [{ name: "leave", click: '[data-slot="chip-remove"]', frames: 8 }],
    },
  },
  render: () => <LabelPicker chosen={some} />,
};

/**
 * Open, with two values: the chosen rows carry the tick at their right end, and the list stays
 * open after a choice. Choose a third: its chip seats in, and if it needs another line, the
 * field grows.
 */
export const Open: Story = {
  parameters: {
    visual: {
      viewport: { width: 420, height: 470 },
      clip: "viewport",
      motion: [{ name: "join", click: '[data-slot="combobox-item"]:nth-of-type(4)', frames: 10 }],
    },
  },
  render: () => <LabelPicker chosen={some} defaultOpen />,
};

type Customer = ComboboxOption & { detail: string };

const CUSTOMERS: Customer[] = [
  { value: "k-1042", label: "Schreinerei Mustermann", detail: "Rosenheim" },
  { value: "k-1043", label: "Bäckerei Kornprobst", detail: "München" },
  { value: "k-1044", label: "Friseursalon Haarscharf", detail: "Augsburg" },
  { value: "k-1046", label: "Metzgerei Obermaier", detail: "Erding" },
  { value: "k-1047", label: "Zimmerei Huber", detail: "Bad Tölz" },
  { value: "k-1049", label: "Gärtnerei Blattwerk", detail: "Dachau" },
];

/**
 * Rows with a place at their right: the chosen ones stand on the tint, and chosen rows that
 * touch are one shape, round only at its outer corners. Choose the row between two chosen
 * ones: the corners where they meet ease square and the three are one block.
 */
export const WithDetails: Story = {
  parameters: {
    visual: {
      viewport: { width: 420, height: 440 },
      clip: "viewport",
      motion: [{ name: "join", click: '[data-slot="combobox-item"]:nth-of-type(3)', frames: 8 }],
    },
  },
  render: () => (
    <Field className="w-80">
      <FieldLabel>Rundschreiben an</FieldLabel>
      <Combobox
        multiple
        items={CUSTOMERS}
        locale="de-DE"
        defaultValue={[CUSTOMERS[0]!, CUSTOMERS[1]!, CUSTOMERS[3]!]}
        defaultOpen
      >
        <ComboboxChips placeholder="z. B. Bäckerei Kornprobst" />
        <ComboboxContent empty="Kein Kunde gefunden.">
          {(customer: Customer) => <ComboboxItem key={customer.value} value={customer} />}
        </ComboboxContent>
      </Combobox>
    </Field>
  ),
};

/**
 * Five values over two lines. Take one away and the field eases back to one line less, and
 * the button under it follows.
 */
export const Wrapping: Story = {
  parameters: {
    visual: {
      viewport: { width: 420, height: 260 },
      motion: [
        {
          name: "shrink",
          click: '[data-slot="chip-place"]:nth-child(4) [data-slot="chip-remove"]',
          frames: 10,
        },
      ],
    },
  },
  render: () => <LabelPicker chosen={many} below />,
};

/**
 * `chipVariant="plug"`: the chips as raised plugs, like a `Chip` on its own, for a field whose
 * values are its point (the recipients of a message).
 */
export const PlugChips: Story = {
  parameters: { visual: { viewport: { width: 420, height: 230 } } },
  render: () => <LabelPicker chosen={many} chipVariant="plug" />,
};

/** Invalid and disabled: the field says so as every field does, and the chips lie flat. */
export const States: Story = {
  parameters: { visual: { viewport: { width: 420, height: 330 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <LabelPicker invalid />
      <LabelPicker disabled chosen={some} />
    </div>
  ),
};

/** The three sizes; the chips keep theirs. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 420, height: 330 } } },
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Combobox key={size} multiple items={LABELS} locale="de-DE" defaultValue={some}>
          <ComboboxChips size={size} aria-label={`Schlagwörter, ${size}`} />
          <ComboboxContent>
            {(label: Label) => <ComboboxItem key={label.value} value={label} />}
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  ),
};

function Creatable({ defaultOpen }: { defaultOpen?: boolean }) {
  const [labels, setLabels] = useState(LABELS);
  const [chosen, setChosen] = useState<Label[]>(some);
  return (
    <Field className="w-80">
      <FieldLabel>Schlagwörter</FieldLabel>
      <Combobox
        multiple
        items={labels}
        locale="de-DE"
        value={chosen}
        onValueChange={setChosen}
        defaultOpen={defaultOpen}
        defaultInputValue={defaultOpen ? "Messe" : undefined}
        onCreate={(name) => {
          const label = { value: name.toLowerCase(), label: name };
          setLabels((all) => [...all, label]);
          return label;
        }}
      >
        <ComboboxChips placeholder="z. B. Stammkunde" />
        <ComboboxContent>
          {(label: Label) => <ComboboxItem key={label.value} value={label} />}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Was es noch nicht gibt, legen Sie beim Tippen an.</FieldDescription>
    </Field>
  );
}

/**
 * `onCreate`: what was typed is not in the list, so a last row offers to make it. Choosing it
 * adds the option and takes it at once.
 */
export const Create: Story = {
  parameters: { visual: { viewport: { width: 420, height: 300 }, clip: "viewport" } },
  render: () => <Creatable defaultOpen />,
};

/** On a phone the field is as wide as the page and the text is 16px. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 230 } } },
  render: () => <LabelPicker chosen={many} />,
};

/**
 * The keyboard path, as a test: typing filters and Enter takes the match while the list stays
 * open, Backspace in the empty input takes the last chip, Arrow left walks into the chips, and
 * a form receives every value.
 */
export const Keyboard: Story = {
  render: function Render() {
    const [sent, setSent] = useState("");
    return (
      <Form
        className="flex w-80 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget).getAll("labels");
          setSent(values.filter((value) => typeof value === "string").join(", "));
        }}
      >
        <Field name="labels">
          <FieldLabel>Schlagwörter</FieldLabel>
          <Combobox multiple items={LABELS} locale="de-DE" defaultValue={some}>
            <ComboboxChips />
            <ComboboxContent>
              {(label: Label) => <ComboboxItem key={label.value} value={label} />}
            </ComboboxContent>
          </Combobox>
        </Field>
        <Button type="submit" className="self-start">
          Speichern
        </Button>
        <output aria-label="Gesendet">{sent}</output>
      </Form>
    );
  },
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByRole("combobox", { name: "Schlagwörter" });
    const chips = () => within(canvas.getByRole("toolbar", { name: "Ausgewählt" }));
    const chipNames = () =>
      [
        ...canvas
          .getByRole("toolbar")
          .querySelectorAll('[data-slot="chip-place"]:not([data-leaving])'),
      ]
        .map((place) => place.textContent)
        .join(", ");

    await step("the chosen values are chips, each with a key named after it", async () => {
      await expect(chipNames()).toBe("Dringend, Stammkunde");
      await expect(chips().getByRole("button", { name: "Dringend entfernen" })).toBeVisible();
    });

    await step("typing filters, Enter takes the match, and the list stays open", async () => {
      await userEvent.click(input);
      await userEvent.keyboard("ford");
      await waitFor(() => expect(screen.getByRole("listbox")).toBeVisible());
      await expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(chipNames()).toBe("Dringend, Stammkunde, Förderung"));
      await expect(input).toHaveValue("");
      await expect(input).toHaveFocus();
    });

    await step("Backspace in the empty input takes the last chip", async () => {
      await userEvent.keyboard("{Backspace}");
      await waitFor(() => expect(chipNames()).toBe("Dringend, Stammkunde"));
    });

    await step(
      "Arrow left walks into the chips, and Delete takes the one it stands on",
      async () => {
        await userEvent.keyboard("{ArrowLeft}");
        await waitFor(() =>
          expect(canvas.getByRole("toolbar").querySelector(":focus")).toHaveTextContent(
            "Stammkunde",
          ),
        );
        await userEvent.keyboard("{ArrowLeft}{Delete}");
        await waitFor(() => expect(chipNames()).toBe("Stammkunde"));
      },
    );

    await step("a form receives every value under the field's name", async () => {
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Speichern" }));
      await waitFor(() =>
        expect(canvas.getByLabelText("Gesendet")).toHaveTextContent("stammkunde"),
      );
    });
  },
};
