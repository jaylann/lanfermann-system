import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";
import { LocaleProvider } from "@/locale/locale";

import { DateField } from "./date-field";

const meta = {
  title: "Components/DateField",
  component: DateField,
  // A fixed "today", so the pictures do not change from day to day.
  args: { today: "2026-11-14" },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 380, height: 150 },
      target: '[data-slot="date-field"]',
    },
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens the calendar as soon as the story stands, for a picture of the open sheet. */
function Opened({ children }: { children: ReactNode }) {
  return (
    <div
      ref={(node) => {
        const button = node?.querySelector<HTMLButtonElement>('[data-slot="input-group-button"]');
        if (button && button.getAttribute("aria-expanded") !== "true") button.click();
      }}
    >
      {children}
    </div>
  );
}

/**
 * A typed German date and our calendar behind a button. The date can be typed in the usual
 * short forms ("30.11.", "301126"); it is read when the field is left.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "open", click: '[data-slot="input-group-button"]', frames: 8 }],
    },
  },
  render: (args) => (
    <Field className="w-56">
      <FieldLabel>Gültig bis</FieldLabel>
      <DateField {...args} defaultValue="2026-11-30" />
      <FieldDescription>Danach verfällt das Angebot.</FieldDescription>
    </Field>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <Field className="w-56">
      <FieldLabel>Gültig bis</FieldLabel>
      <DateField {...args} />
    </Field>
  ),
};

/** With `time`: a day and a time of day. Typed as "30.11. 9:30" or "30.11.2026, 9 Uhr". */
export const WithTime: Story = {
  render: (args) => (
    <Field className="w-64">
      <FieldLabel>Termin am</FieldLabel>
      <DateField {...args} time defaultValue="2026-11-30T09:30" />
      <FieldDescription>Wir kommen zum Aufmaß vorbei.</FieldDescription>
    </Field>
  ),
};

/** `hourCycle={12}` writes the time with AM and PM; the value stays `2026-11-30T16:30`. */
export const TwelveHours: Story = {
  render: (args) => (
    <Field className="w-64">
      <FieldLabel>Appointment</FieldLabel>
      <DateField {...args} time hourCycle={12} defaultValue="2026-11-30T16:30" />
    </Field>
  ),
};

/** The calendar, open. Today wears the ring, the chosen day is the Indigo plug. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 380, height: 470 }, clip: "viewport" } },
  render: (args) => (
    <Opened>
      <Field className="w-56">
        <FieldLabel>Gültig bis</FieldLabel>
        <DateField {...args} defaultValue="2026-11-30" min="2026-11-14" />
      </Field>
    </Opened>
  ),
};

/**
 * With a time the sheet stays open after a day was picked: the time is set under the calendar,
 * typed or picked from its list like any time field, and "Fertig" closes it.
 */
export const OpenWithTime: Story = {
  parameters: { visual: { viewport: { width: 380, height: 570 }, clip: "viewport" } },
  render: (args) => (
    <Opened>
      <Field className="w-64">
        <FieldLabel>Termin am</FieldLabel>
        <DateField {...args} time defaultValue="2026-11-30T09:30" />
      </Field>
    </Opened>
  ),
};

/** What a date that cannot be read looks like: the text stays, and the error says what to type. */
export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 420, height: 170 } } },
  render: (args) => (
    <Field invalid className="w-72">
      <FieldLabel>Gültig bis</FieldLabel>
      <DateField {...args} defaultValue="2026-11-30" />
      <FieldError match>Bitte geben Sie ein Datum ein, zum Beispiel 30.11.2026.</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 600, height: 150 } } },
  render: (args) => (
    <div className="flex gap-8">
      <Field disabled className="w-56">
        <FieldLabel>Gültig bis</FieldLabel>
        <DateField {...args} defaultValue="2026-11-30" />
      </Field>
      <Field disabled className="w-64">
        <FieldLabel>Termin am</FieldLabel>
        <DateField {...args} time defaultValue="2026-11-30T09:30" />
      </Field>
    </div>
  ),
};

/** What cannot be changed opens no calendar, as a test: read-only, and disabled by its field. */
export const Locked: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Field className="w-56">
        <FieldLabel>Angebot vom</FieldLabel>
        <DateField {...args} readOnly defaultValue="2026-11-02" />
      </Field>
      <Field disabled className="w-56">
        <FieldLabel>Gültig bis</FieldLabel>
        <DateField {...args} defaultValue="2026-11-30" />
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const buttons = canvas.getAllByRole("button", { name: "Kalender öffnen" });
    await expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      await expect(button).toBeDisabled();
      button.click();
    }
    await expect(screen.queryByRole("dialog")).toBeNull();
  },
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 320, height: 230 } } },
  render: (args) => (
    <div className="flex w-56 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <DateField
          key={size}
          {...args}
          size={size}
          defaultValue="2026-11-30"
          aria-label="Gültig bis"
        />
      ))}
    </div>
  ),
};

function Reported({ time = false }: { time?: boolean }) {
  const [value, setValue] = useState(time ? "2026-11-30T09:30" : "2026-11-30");
  return (
    <Field className="w-72">
      <FieldLabel>{time ? "Termin am" : "Gültig bis"}</FieldLabel>
      <DateField time={time} value={value} onValueChange={setValue} today="2026-11-14" />
      <FieldError />
      <FieldDescription>
        Wert: <span data-testid="value">{value === "" ? "leer" : value}</span>
      </FieldDescription>
    </Field>
  );
}

/**
 * As a test: a typed German date is read when the field is left and reported as an ISO date; a
 * date that does not exist is flagged, explained and reported as empty; the calendar reports the
 * same way.
 */
export const Keyboard: Story = {
  render: () => <Reported />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Gültig bis");
    const value = canvas.getByTestId("value");

    await step("The ISO value is shown the German way", async () => {
      await expect(input).toHaveValue("30.11.2026");
      await expect(value).toHaveTextContent("2026-11-30");
    });

    await step("A short form is read on leaving the field and reported as ISO", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "5.12.26");
      await userEvent.tab();
      await expect(input).toHaveValue("05.12.2026");
      await expect(value).toHaveTextContent("2026-12-05");
    });

    await step("A day that does not exist is flagged, explained and not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "31.11.2026{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue("31.11.2026");
      await expect(value).toHaveTextContent("leer");
      await waitFor(() => expect(canvas.getByText(/Bitte geben Sie ein Datum ein/)).toBeVisible());
    });

    await step("The calendar chooses a day, reports it and takes the error away", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
      const sheet = await screen.findByRole("dialog", { name: "Datum wählen" });
      await userEvent.click(within(sheet).getByRole("button", { name: /20\. November 2026/ }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("20.11.2026");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(value).toHaveTextContent("2026-11-20");
      await waitFor(() =>
        expect(canvas.queryByText(/Bitte geben Sie ein Datum ein/)).not.toBeInTheDocument(),
      );
    });

    const button = canvas.getByRole("button", { name: "Kalender öffnen" });

    await step("Opened from the keyboard, the sheet starts on the chosen day", async () => {
      await waitFor(() => expect(button).toHaveFocus());
      await userEvent.keyboard("{Enter}");
      const sheet = await screen.findByRole("dialog", { name: "Datum wählen" });
      await waitFor(() =>
        expect(within(sheet).getByRole("button", { name: /, 20\. November 2026/ })).toHaveFocus(),
      );
    });

    await step("The arrows walk on into the next month, and the next year", async () => {
      const sheet = screen.getByRole("dialog", { name: "Datum wählen" });
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await waitFor(() =>
        expect(within(sheet).getByRole("button", { name: /, 4\. Dezember 2026/ })).toHaveFocus(),
      );
      await userEvent.keyboard("{PageDown}");
      await waitFor(() =>
        expect(within(sheet).getByRole("button", { name: /, 4\. Januar 2027/ })).toHaveFocus(),
      );
    });

    await step("Enter takes the day and the focus is back on the button", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("04.01.2027");
      await expect(value).toHaveTextContent("2027-01-04");
      await waitFor(() => expect(button).toHaveFocus());
    });

    await step("Escape leaves the sheet without a change", async () => {
      await userEvent.keyboard("{Enter}");
      await screen.findByRole("dialog", { name: "Datum wählen" });
      await userEvent.keyboard("{ArrowRight}{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(value).toHaveTextContent("2027-01-04");
      await waitFor(() => expect(button).toHaveFocus());
    });
  },
};

/**
 * As a test, with a time: a typed date and time are read together, a day picked in the calendar
 * keeps the time, and the time under the calendar is picked or typed.
 */
export const KeyboardWithTime: Story = {
  render: () => <Reported time />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Termin am");
    const value = canvas.getByTestId("value");

    await step("Date and time are shown and reported together", async () => {
      await expect(input).toHaveValue("30.11.2026, 09:30");
      await expect(value).toHaveTextContent("2026-11-30T09:30");
    });

    await step("A short form with a time is read", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "5.12. 14 Uhr");
      await userEvent.tab();
      await expect(input).toHaveValue("05.12.2026, 14:00");
      await expect(value).toHaveTextContent("2026-12-05T14:00");
    });

    await step("A date without a time gets the start of the day", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "6.12.{Enter}");
      await expect(input).toHaveValue("06.12.2026, 09:00");
    });

    await step("A day picked in the calendar keeps the time and the sheet stays", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
      const sheet = await screen.findByRole("dialog", { name: "Datum und Uhrzeit wählen" });
      await userEvent.click(within(sheet).getByRole("button", { name: /10\. Dezember 2026/ }));
      await expect(value).toHaveTextContent("2026-12-10T09:00");
      await expect(sheet).toBeVisible();
    });

    await step("The time under the calendar is picked from its list", async () => {
      const time = screen.getByLabelText("Uhrzeit");
      await userEvent.click(time);
      const list = await screen.findByRole("listbox", { name: "Uhrzeiten" });
      await userEvent.click(within(list).getByRole("option", { name: "11:15" }));
      await expect(value).toHaveTextContent("2026-12-10T11:15");
      await expect(input).toHaveValue("10.12.2026, 11:15");
    });

    await step("Or typed; Enter closes the sheet", async () => {
      const time = screen.getByLabelText("Uhrzeit");
      await userEvent.clear(time);
      await userEvent.type(time, "1630{Enter}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("10.12.2026, 16:30");
      await expect(value).toHaveTextContent("2026-12-10T16:30");
    });
  },
};

function Submitted() {
  const [sent, setSent] = useState("");
  return (
    <Form
      className="w-72"
      onFormSubmit={(values) => {
        setSent(JSON.stringify(values));
      }}
    >
      <Field name="gueltig">
        <FieldLabel>Gültig bis</FieldLabel>
        <DateField required defaultValue="2026-11-30" today="2026-11-14" />
        <FieldError />
      </Field>
      <Button type="submit" variant="primary">
        Speichern
      </Button>
      <p className="text-sm text-fg-muted">
        Gesendet: <span data-testid="sent">{sent === "" ? "nichts" : sent}</span>
      </p>
    </Form>
  );
}

/**
 * As a test: a form receives the ISO date under the field's name, not the text the field shows,
 * and it is not submitted while the text cannot be read.
 */
export const InForm: Story = {
  parameters: { visual: { viewport: { width: 380, height: 230 } } },
  render: () => <Submitted />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const input = canvas.getByLabelText("Gültig bis");
    const sent = canvas.getByTestId("sent");
    const submit = canvas.getByRole("button", { name: "Speichern" });

    await step("The form hands over the ISO date", async () => {
      await userEvent.click(submit);
      await expect(sent).toHaveTextContent('{"gueltig":"2026-11-30"}');
    });

    await step("Posted the native way, the name carries the ISO date too", async () => {
      const form = canvasElement.querySelector("form")!;
      await expect(new FormData(form).get("gueltig")).toBe("2026-11-30");
    });

    await step("Text that is not a date is not submitted; the field says why", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "übermorgen");
      await userEvent.click(submit);
      await expect(sent).toHaveTextContent('{"gueltig":"2026-11-30"}');
      await waitFor(() => expect(canvas.getByText(/Bitte geben Sie ein Datum ein/)).toBeVisible());
    });

    await step("Corrected, it goes through", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "1.12.");
      await userEvent.click(submit);
      await expect(sent).toHaveTextContent('{"gueltig":"2026-12-01"}');
    });

    await step("Enter in the field submits what was just typed, already read", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "2.12.{Enter}");
      await waitFor(() => expect(sent).toHaveTextContent('{"gueltig":"2026-12-02"}'));
    });
  },
};

/**
 * Under a `LocaleProvider` with `en` the date is written and typed the American way, month
 * first. What it submits is the same ISO date.
 */
export const English: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-56">
        <FieldLabel>Valid until</FieldLabel>
        <DateField {...args} defaultValue="2026-11-30" />
        <FieldDescription>The offer expires after that day.</FieldDescription>
      </Field>
    </LocaleProvider>
  ),
};

/** Empty in English: the placeholder is an example the field reads. */
export const EnglishEmpty: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-56">
        <FieldLabel>Valid until</FieldLabel>
        <DateField {...args} />
      </Field>
    </LocaleProvider>
  ),
};

/**
 * The sheet in English: the month's name, the weekdays (still from Monday), "Time" and "Done".
 */
export const EnglishOpen: Story = {
  parameters: { visual: { viewport: { width: 380, height: 570 }, clip: "viewport" } },
  render: (args) => (
    <LocaleProvider locale="en">
      <Opened>
        <Field className="w-64">
          <FieldLabel>Appointment on</FieldLabel>
          <DateField {...args} time defaultValue="2026-11-30T09:30" />
        </Field>
      </Opened>
    </LocaleProvider>
  ),
};

function ReportedEnglish({ time = false }: { time?: boolean }) {
  const [value, setValue] = useState(time ? "2026-11-30T09:30" : "2026-11-30");
  return (
    <LocaleProvider locale="en">
      <Field className="w-72">
        <FieldLabel>{time ? "Appointment on" : "Valid until"}</FieldLabel>
        <DateField
          time={time}
          value={value}
          onValueChange={setValue}
          today="2026-11-14"
          max="2026-12-31"
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
 * As a test, in English: American dates are read in their short forms and reported as ISO; a
 * German date is not turned round but flagged, and the message names the American format; the
 * limit is written that way too; the calendar speaks English.
 */
export const KeyboardEnglish: Story = {
  render: () => <ReportedEnglish />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Valid until");
    const value = canvas.getByTestId("value");

    await step("The ISO value is shown the American way", async () => {
      await expect(input).toHaveValue("11/30/2026");
      await expect(value).toHaveTextContent("2026-11-30");
    });

    await step("A short form is read on leaving the field: the month comes first", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12/5/26");
      await userEvent.tab();
      await expect(input).toHaveValue("12/05/2026");
      await expect(value).toHaveTextContent("2026-12-05");
    });

    await step("Without a year, with hyphens and as digits alone", async () => {
      for (const [typed, written, iso] of [
        ["12/24", "12/24/2026", "2026-12-24"],
        ["12-6-2026", "12/06/2026", "2026-12-06"],
        ["120726", "12/07/2026", "2026-12-07"],
      ] as const) {
        await userEvent.clear(input);
        await userEvent.type(input, `${typed}{Enter}`);
        await expect(input).toHaveValue(written);
        await expect(value).toHaveTextContent(iso);
      }
    });

    await step("A German date is not guessed: flagged, explained, not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "05.12.2026{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue("05.12.2026");
      await expect(value).toHaveTextContent("empty");
      await waitFor(() =>
        expect(canvas.getByText("Enter a date, for example 11/30/2026.")).toBeVisible(),
      );
    });

    await step("A day after the limit names the limit the American way", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "1/5/2027{Enter}");
      await expect(value).toHaveTextContent("empty");
      await waitFor(() =>
        expect(canvas.getByText("Choose a date up to 12/31/2026.")).toBeVisible(),
      );
    });

    await step("The calendar speaks English and writes the day the American way", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open calendar" }));
      const sheet = await screen.findByRole("dialog", { name: "Choose a date" });
      // The sheet eases in: it is there at once and seen a moment later.
      await waitFor(() =>
        expect(within(sheet).getByRole("grid", { name: "November 2026" })).toBeVisible(),
      );
      await userEvent.click(within(sheet).getByRole("button", { name: /November 20, 2026/ }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("11/20/2026");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(value).toHaveTextContent("2026-11-20");
    });
  },
};

/**
 * As a test, in English with a time: the date is American, the clock is the field's own (24
 * hours unless asked otherwise), and "at" stands between the two as "um" does in German.
 */
export const KeyboardEnglishWithTime: Story = {
  render: () => <ReportedEnglish time />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Appointment on");
    const value = canvas.getByTestId("value");

    await step("Date and time are shown, the time on 24 hours", async () => {
      await expect(input).toHaveValue("11/30/2026, 09:30");
    });

    await step("A date with a time is read, with AM and PM too", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12/5 at 4:15 pm{Enter}");
      await expect(input).toHaveValue("12/05/2026, 16:15");
      await expect(value).toHaveTextContent("2026-12-05T16:15");
    });

    await step("What cannot be read is explained with an example that can", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "5.12. 9 Uhr{Enter}");
      await expect(value).toHaveTextContent("empty");
      await waitFor(() =>
        expect(
          canvas.getByText("Enter a date and a time, for example 11/30/2026, 09:30."),
        ).toBeVisible(),
      );
    });

    await step("The sheet's keys are English", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open calendar" }));
      const sheet = await screen.findByRole("dialog", { name: "Choose a date and a time" });
      // The sheet eases in: it is there at once and seen a moment later.
      await waitFor(() => expect(within(sheet).getByLabelText("Time")).toBeVisible());
      await userEvent.click(within(sheet).getByRole("button", { name: "Done" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  },
};

/**
 * As a test: without a `LocaleProvider` nothing has changed. The field shows, reads and explains
 * German dates, and an American date is not one.
 */
export const KeyboardGermanUnchanged: Story = {
  render: () => (
    <Field className="w-72">
      <FieldLabel>Gültig bis</FieldLabel>
      <DateField today="2026-11-14" min="2026-11-01" />
      <FieldError />
    </Field>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Gültig bis");

    await step("The placeholder is a German date", async () => {
      await expect(input).toHaveAttribute("placeholder", "z. B. 30.11.2026");
    });

    await step("German forms are read as before", async () => {
      for (const [typed, written] of [
        ["30.11.", "30.11.2026"],
        ["5.12.26", "05.12.2026"],
        ["241226", "24.12.2026"],
      ] as const) {
        await userEvent.clear(input);
        await userEvent.type(input, `${typed}{Enter}`);
        await expect(input).toHaveValue(written);
        await expect(input).not.toHaveAttribute("aria-invalid");
      }
    });

    await step("An American date is not read, and the message is the German one", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "11/30/2026{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await waitFor(() =>
        expect(
          canvas.getByText("Bitte geben Sie ein Datum ein, zum Beispiel 30.11.2026."),
        ).toBeVisible(),
      );
    });

    await step("The limit is written the German way, and the button is German", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "1.10.2026{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("Bitte wählen Sie ein Datum ab dem 01.11.2026.")).toBeVisible(),
      );
      await expect(canvas.getByRole("button", { name: "Kalender öffnen" })).toBeVisible();
    });
  },
};

/**
 * As a test: `labels` puts the caller's words in place of the language's, as a sentence or as a
 * function of what the default names.
 */
export const KeyboardOwnWords: Story = {
  render: () => (
    <Field className="w-72">
      <FieldLabel>Termin am</FieldLabel>
      <DateField
        time
        today="2026-11-14"
        min="2026-11-14"
        labels={{
          invalidWithTime: (example) => `So wird es gelesen: ${example}.`,
          limits: { from: (min) => `Frühestens am ${min}.` },
          open: "Kalender zeigen",
          done: "Übernehmen",
        }}
      />
      <FieldError />
    </Field>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Termin am");

    await step("The messages are the caller's", async () => {
      await userEvent.type(input, "morgen{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("So wird es gelesen: 30.11.2026, 09:30.")).toBeVisible(),
      );
      await userEvent.clear(input);
      await userEvent.type(input, "1.11.2026 9 Uhr{Enter}");
      await waitFor(() => expect(canvas.getByText("Frühestens am 14.11.2026.")).toBeVisible());
    });

    await step("So are the two keys of the sheet", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender zeigen" }));
      const sheet = await screen.findByRole("dialog", { name: "Datum und Uhrzeit wählen" });
      await userEvent.click(within(sheet).getByRole("button", { name: "Übernehmen" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  },
};
