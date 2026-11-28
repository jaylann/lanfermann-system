import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { LocaleProvider } from "@/locale/locale";

import { TimeField } from "./time-field";

const meta = {
  title: "Components/TimeField",
  component: TimeField,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 320, height: 150 },
      target: '[data-slot="time-field"]',
    },
  },
} satisfies Meta<typeof TimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A time of day, typed ("9", "930", "9:30") or picked from the list the field opens. */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "open", click: '[data-slot="time-field-input"]', frames: 8 }],
    },
  },
  render: (args) => (
    <Field className="w-36">
      <FieldLabel>Beginn</FieldLabel>
      <TimeField {...args} defaultValue="07:30" />
      <FieldDescription>Erster Tag auf der Baustelle.</FieldDescription>
    </Field>
  ),
};

/** The list, open: the times of the day a quarter of an hour apart, starting where the time is. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 320, height: 380 }, clip: "viewport" } },
  render: (args) => (
    <Field className="w-36">
      <FieldLabel>Beginn</FieldLabel>
      <TimeField {...args} defaultValue="07:30" defaultOpen />
    </Field>
  ),
};

/** `hourCycle={12}`: written and offered with AM and PM. The value stays "16:30". */
export const TwelveHours: Story = {
  parameters: { visual: { viewport: { width: 320, height: 380 }, clip: "viewport" } },
  render: (args) => (
    <Field className="w-40">
      <FieldLabel>Pick-up</FieldLabel>
      <TimeField {...args} hourCycle={12} defaultValue="16:30" defaultOpen />
    </Field>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <Field className="w-36">
      <FieldLabel>Rückruf ab</FieldLabel>
      <TimeField {...args} />
    </Field>
  ),
};

/** What a time outside the limits looks like: the error names them. */
export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 420, height: 170 } } },
  render: (args) => (
    <Field invalid className="w-72">
      <FieldLabel>Rückruf ab</FieldLabel>
      <TimeField {...args} defaultValue="21:00" className="w-36" />
      <FieldError match>Bitte wählen Sie eine Uhrzeit zwischen 08:00 und 18:00.</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <Field disabled className="w-36">
      <FieldLabel>Beginn</FieldLabel>
      <TimeField {...args} defaultValue="07:30" />
    </Field>
  ),
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 320, height: 230 } } },
  render: (args) => (
    <div className="flex w-36 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <TimeField key={size} {...args} size={size} defaultValue="07:30" aria-label="Beginn" />
      ))}
    </div>
  ),
};

function Reported({ hourCycle }: { hourCycle?: 12 | 24 }) {
  const [value, setValue] = useState("07:30");
  return (
    <Field className="w-72">
      <FieldLabel>Rückruf ab</FieldLabel>
      <TimeField
        value={value}
        onValueChange={setValue}
        min="08:00"
        max="18:00"
        hourCycle={hourCycle}
        className="w-36"
      />
      <FieldError />
      <FieldDescription>
        Wert: <span data-testid="value">{value === "" ? "leer" : value}</span>
      </FieldDescription>
    </Field>
  );
}

/**
 * As a test: short forms are read when the field is left; a press opens the times of the day and
 * typing narrows them; a time that is not on the list can still be typed; a time outside the
 * limits is flagged, explained and not reported.
 */
export const Keyboard: Story = {
  render: () => <Reported />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Rückruf ab");
    const value = canvas.getByTestId("value");
    const times = () => screen.findByRole("listbox", { name: "Uhrzeiten" });

    await step("Digits alone are a time", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "930");
      await userEvent.tab();
      await expect(input).toHaveValue("09:30");
      await expect(value).toHaveTextContent("09:30");
    });

    await step("An hour with 'Uhr' is read", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "14 Uhr{Enter}");
      await expect(input).toHaveValue("14:00");
    });

    await step(
      "A press opens the times of the day, within the limits; a press takes one",
      async () => {
        await userEvent.click(input);
        const list = await times();
        await expect(within(list).getAllByRole("option")).toHaveLength(41); // 08:00 to 18:00
        await userEvent.click(within(list).getByRole("option", { name: "16:30" }));
        await expect(input).toHaveValue("16:30");
        await expect(value).toHaveTextContent("16:30");
        await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      },
    );

    await step("Typing narrows them to what the text could become", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "9");
      const list = await times();
      await expect(
        within(list)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["09:00", "09:15", "09:30", "09:45"]);
    });

    await step("The arrows walk the list and Enter takes the time", async () => {
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      await expect(input).toHaveValue("09:15");
      await expect(value).toHaveTextContent("09:15");
    });

    await step(
      "Enter on the time the field already holds takes it, not the first match",
      async () => {
        await userEvent.clear(input);
        await userEvent.type(input, "9");
        await times();
        await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
        await expect(input).toHaveValue("09:15");
        await expect(value).toHaveTextContent("09:15");
      },
    );

    await step(
      "Half a time and a row of the list: the row counts, nothing is flagged",
      async () => {
        await userEvent.clear(input);
        await userEvent.type(input, "10:");
        await times();
        await userEvent.keyboard("{ArrowDown}{Enter}");
        await expect(input).toHaveValue("10:00");
        await expect(value).toHaveTextContent("10:00");
        await expect(input).not.toHaveAttribute("aria-invalid");
        await expect(canvas.queryByText(/Bitte geben Sie eine Uhrzeit ein/)).toBeNull();
      },
    );

    await step("Escape with the list closed leaves the time where it is", async () => {
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await userEvent.keyboard("{Escape}");
      await expect(input).toHaveValue("10:00");
      await userEvent.tab();
      await expect(value).toHaveTextContent("10:00");
      await userEvent.click(input);
      await userEvent.keyboard("{Escape}");
    });

    await step("A time that is not on the list can still be typed", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "9:10{Enter}");
      await expect(input).toHaveValue("09:10");
      await expect(value).toHaveTextContent("09:10");
    });

    await step("A time outside the limits is flagged, explained and not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "21:00{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(value).toHaveTextContent("leer");
      await waitFor(() => expect(canvas.getByText(/zwischen 08:00 und 18:00/)).toBeVisible());
    });

    await step("Corrected, the error goes", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "17{Enter}");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await waitFor(() =>
        expect(canvas.queryByText(/zwischen 08:00 und 18:00/)).not.toBeInTheDocument(),
      );
    });
  },
};

/**
 * As a test, on a 12-hour clock: the time is written with AM and PM, the list offers an hour in
 * the half of the day that is named, both clocks can be typed, and the value stays 24 hours.
 */
export const KeyboardTwelveHours: Story = {
  render: () => <Reported hourCycle={12} />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Rückruf ab");
    const value = canvas.getByTestId("value");

    await step("The time is written with AM", async () => {
      await expect(input).toHaveValue("7:30 AM");
      await expect(value).toHaveTextContent("07:30");
    });

    await step("An hour and its half of the day narrow the list", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "4p");
      const list = await screen.findByRole("listbox", { name: "Uhrzeiten" });
      await expect(
        within(list)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM"]);
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
      await expect(input).toHaveValue("4:30 PM");
      await expect(value).toHaveTextContent("16:30");
    });

    await step("A time typed on the 24-hour clock is rewritten", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "13:45{Enter}");
      await expect(input).toHaveValue("1:45 PM");
      await expect(value).toHaveTextContent("13:45");
    });

    await step("The limits are named on the same clock", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "9 pm{Enter}");
      await expect(value).toHaveTextContent("leer");
      await waitFor(() => expect(canvas.getByText(/zwischen 8:00 AM und 6:00 PM/)).toBeVisible());
    });
  },
};

/**
 * Under a `LocaleProvider` with `en` the field speaks English. The clock is still its own: 24
 * hours unless `hourCycle={12}` asks for AM and PM, as here.
 */
export const English: Story = {
  parameters: { visual: { viewport: { width: 320, height: 380 }, clip: "viewport" } },
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-40">
        <FieldLabel>Pick-up</FieldLabel>
        <TimeField {...args} hourCycle={12} defaultValue="16:30" defaultOpen />
      </Field>
    </LocaleProvider>
  ),
};

/** Empty in English: the placeholder is an example on the field's clock. */
export const EnglishEmpty: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-40">
        <FieldLabel>Start</FieldLabel>
        <TimeField {...args} />
      </Field>
    </LocaleProvider>
  ),
};

function ReportedEnglish({ hourCycle }: { hourCycle?: 12 | 24 }) {
  const [value, setValue] = useState("08:30");
  return (
    <LocaleProvider locale="en">
      <Field className="w-72">
        <FieldLabel>Call back from</FieldLabel>
        <TimeField
          value={value}
          onValueChange={setValue}
          min="08:00"
          max="18:00"
          hourCycle={hourCycle}
          className="w-36"
        />
        <FieldError />
        <FieldDescription>
          Value: <span data-testid="value">{value === "" ? "empty" : value}</span>
        </FieldDescription>
      </Field>
    </LocaleProvider>
  );
}

/**
 * As a test, in English: the language changes the words and not the clock. Times are written on
 * 24 hours by default, read with AM and PM all the same, and the messages are English.
 */
export const KeyboardEnglish: Story = {
  render: () => <ReportedEnglish />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Call back from");
    const value = canvas.getByTestId("value");

    await step("The time stays on the 24-hour clock", async () => {
      await expect(input).toHaveValue("08:30");
    });

    await step("A time with PM is read and written back on 24 hours", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "4:15 pm");
      await userEvent.tab();
      await expect(input).toHaveValue("16:15");
      await expect(value).toHaveTextContent("16:15");
    });

    await step("What is not a time is flagged, explained and not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "noon{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(value).toHaveTextContent("empty");
      await waitFor(() =>
        expect(canvas.getByText("Enter a time, for example 09:30.")).toBeVisible(),
      );
    });

    await step("A time outside the limits names them", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "7{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Choose a time between 08:00 and 18:00.")).toBeVisible(),
      );
    });

    await step("The list of times has an English name", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "9");
      const list = await screen.findByRole("listbox", { name: "Times" });
      await userEvent.click(within(list).getByRole("option", { name: "09:30" }));
      await expect(value).toHaveTextContent("09:30");
    });
  },
};

/** As a test, in English on a 12-hour clock: the example and the limits are written with AM and PM. */
export const KeyboardEnglishTwelveHours: Story = {
  render: () => <ReportedEnglish hourCycle={12} />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Call back from");
    const value = canvas.getByTestId("value");

    await step("The time is written with AM", async () => {
      await expect(input).toHaveValue("8:30 AM");
    });

    await step("Digits alone are a time", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "930");
      await userEvent.tab();
      await expect(input).toHaveValue("9:30 AM");
      await expect(value).toHaveTextContent("09:30");
    });

    await step("The messages are written on the same clock", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "noon{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Enter a time, for example 9:30 AM.")).toBeVisible(),
      );
      await userEvent.clear(input);
      await userEvent.type(input, "9 pm{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Choose a time between 8:00 AM and 6:00 PM.")).toBeVisible(),
      );
    });
  },
};

/** As a test: `labels` puts the caller's messages in place of the language's. */
export const KeyboardOwnWords: Story = {
  render: () => (
    <Field className="w-72">
      <FieldLabel>Rückruf ab</FieldLabel>
      <TimeField
        max="18:00"
        className="w-36"
        labels={{
          invalid: "Bitte eine Uhrzeit wie 9:30 eingeben.",
          until: (max) => `Wir sind bis ${max} Uhr erreichbar.`,
        }}
      />
      <FieldError />
    </Field>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Rückruf ab");

    await step("A sentence is said as it is", async () => {
      await userEvent.type(input, "später{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Bitte eine Uhrzeit wie 9:30 eingeben.")).toBeVisible(),
      );
    });

    await step("A function is handed the limit as the field writes it", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "19{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Wir sind bis 18:00 Uhr erreichbar.")).toBeVisible(),
      );
    });
  },
};
