import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import type { DateRange } from "@/components/calendar/calendar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { LocaleProvider } from "@/locale/locale";

import { DateRangeField } from "./date-range-field";
import { lastDays } from "./presets";

const meta = {
  title: "Components/DateRangeField",
  component: DateRangeField,
  // A fixed "today", so the pictures do not change from day to day.
  args: { today: "2026-11-14" },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 420, height: 150 },
      target: '[data-slot="date-range-field"]',
    },
  },
} satisfies Meta<typeof DateRangeField>;

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
 * A span of days, typed ("14.–30.11.", "14.11. bis 30.11.2026") or picked with two presses in
 * the calendar.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "open", click: '[data-slot="input-group-button"]', frames: 8 }],
    },
  },
  render: (args) => (
    <Field className="w-72">
      <FieldLabel>Betriebsurlaub</FieldLabel>
      <DateRangeField {...args} defaultValue={{ from: "2026-12-21", to: "2027-01-04" }} />
      <FieldDescription>In dieser Zeit nehmen wir keine Aufträge an.</FieldDescription>
    </Field>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <Field className="w-72">
      <FieldLabel>Leistungszeitraum</FieldLabel>
      <DateRangeField {...args} />
    </Field>
  ),
};

/** With `time`, each end is a moment: a booking. One day is typed as "14.11. 9–17 Uhr". */
export const WithTimes: Story = {
  parameters: { visual: { viewport: { width: 480, height: 150 } } },
  render: (args) => (
    <Field className="w-96 max-w-full">
      <FieldLabel>Hebebühne gebucht</FieldLabel>
      <DateRangeField
        {...args}
        time
        defaultValue={{ from: "2026-11-16T08:00", to: "2026-11-18T16:30" }}
      />
    </Field>
  ),
};

/** The calendar, open: the range is one raised shape over its days. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 420, height: 470 }, clip: "viewport" } },
  render: (args) => (
    <Opened>
      <Field className="w-72">
        <FieldLabel>Leistungszeitraum</FieldLabel>
        <DateRangeField {...args} defaultValue={{ from: "2026-11-16", to: "2026-11-27" }} />
      </Field>
    </Opened>
  ),
};

/** With times, the sheet carries a time field for the start and one for the end, and "Fertig". */
export const OpenWithTimes: Story = {
  parameters: { visual: { viewport: { width: 480, height: 570 }, clip: "viewport" } },
  render: (args) => (
    <Opened>
      <Field className="w-96 max-w-full">
        <FieldLabel>Hebebühne gebucht</FieldLabel>
        <DateRangeField
          {...args}
          time
          defaultValue={{ from: "2026-11-16T08:00", to: "2026-11-18T16:30" }}
        />
      </Field>
    </Opened>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <Field disabled className="w-72">
      <FieldLabel>Betriebsurlaub</FieldLabel>
      <DateRangeField {...args} defaultValue={{ from: "2026-12-21", to: "2027-01-04" }} />
    </Field>
  ),
};

const iso = (range: DateRange) => (range.from === "" ? "leer" : `${range.from}/${range.to}`);

const lookBack = [lastDays(7), lastDays(28), lastDays(90)];

/**
 * On a dashboard: „Letzte 7 Tage“, 28 and 90, taken with one press. The field names the preset
 * the range is.
 */
export const Presets: Story = {
  render: (args) => (
    <Field className="w-72">
      <FieldLabel>Zeitraum</FieldLabel>
      <DateRangeField
        {...args}
        presets={lookBack}
        defaultValue={{ from: "2026-10-18", to: "2026-11-14" }}
      />
    </Field>
  ),
};

/** The presets as a column at the left of the calendar, the disc by the one the range is. */
export const PresetsOpen: Story = {
  parameters: {
    visual: {
      viewport: { width: 700, height: 470 },
      clip: "viewport",
    },
  },
  render: (args) => (
    <Opened>
      <Field className="w-72">
        <FieldLabel>Zeitraum</FieldLabel>
        <DateRangeField
          {...args}
          presets={lookBack}
          defaultValue={{ from: "2026-10-18", to: "2026-11-14" }}
        />
      </Field>
    </Opened>
  ),
};

/** On a phone the column stands above the calendar. */
export const PresetsOpenPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 640 }, clip: "viewport" } },
  render: PresetsOpen.render,
};

function ReportedPresets() {
  const [value, setValue] = useState<DateRange>({ from: "2026-11-02", to: "2026-11-06" });
  return (
    <Field className="w-96 max-w-full">
      <FieldLabel>Zeitraum</FieldLabel>
      <DateRangeField
        value={value}
        onValueChange={setValue}
        today="2026-11-14"
        min="2026-09-01"
        presets={lookBack}
      />
      <FieldError />
      <FieldDescription>
        Wert: <span data-testid="value">{iso(value)}</span>
      </FieldDescription>
    </Field>
  );
}

/**
 * As a test: a preset is taken with one press and closes the sheet, the field names it, the
 * disc stands by it when the sheet opens again, a preset past `min` cannot be taken, and a
 * preset's name typed is that preset.
 */
export const KeyboardPresets: Story = {
  render: () => <ReportedPresets />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Zeitraum");
    const value = canvas.getByTestId("value");

    await step("A preset is taken with one press", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
      const sheet = await screen.findByRole("dialog", { name: "Zeitraum wählen" });
      const presets = within(sheet).getByRole("group", { name: "Schnellauswahl" });
      await userEvent.click(within(presets).getByRole("button", { name: "Letzte 28 Tage" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(value).toHaveTextContent("2026-10-18/2026-11-14");
      await expect(input).toHaveValue("Letzte 28 Tage");
    });

    await step("The chosen preset carries the disc; one past min cannot be taken", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
      const sheet = await screen.findByRole("dialog", { name: "Zeitraum wählen" });
      await expect(within(sheet).getByRole("button", { name: "Letzte 28 Tage" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(within(sheet).getByRole("button", { name: "Letzte 7 Tage" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(within(sheet).getByRole("button", { name: "Letzte 90 Tage" })).toBeDisabled();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    await step(
      "Days typed that are a preset are named; a preset's name typed is read",
      async () => {
        await userEvent.clear(input);
        await userEvent.type(input, "8.-14.11.{Enter}");
        await expect(input).toHaveValue("Letzte 7 Tage");
        await expect(value).toHaveTextContent("2026-11-08/2026-11-14");
        await userEvent.clear(input);
        await userEvent.type(input, "letzte 28 tage{Enter}");
        await expect(value).toHaveTextContent("2026-10-18/2026-11-14");
        await userEvent.clear(input);
        await userEvent.type(input, "10.-12.11.{Enter}");
        await expect(input).toHaveValue("10.11.2026 – 12.11.2026");
      },
    );
  },
};

function Reported({ time = false }: { time?: boolean }) {
  const [value, setValue] = useState<DateRange>(
    time
      ? { from: "2026-11-16T08:00", to: "2026-11-18T16:30" }
      : { from: "2026-11-16", to: "2026-11-27" },
  );
  return (
    <Field className="w-96 max-w-full">
      <FieldLabel>Zeitraum</FieldLabel>
      <DateRangeField time={time} value={value} onValueChange={setValue} today="2026-11-14" />
      <FieldError />
      <FieldDescription>
        Wert: <span data-testid="value">{iso(value)}</span>
      </FieldDescription>
    </Field>
  );
}

/**
 * As a test: a typed range is read when the field is left, in its short forms too, and reported
 * as two ISO dates in order; in the calendar the first press sets one end and the second the
 * other.
 */
export const Keyboard: Story = {
  render: () => <Reported />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Zeitraum");
    const value = canvas.getByTestId("value");

    await step("The range is shown the German way", async () => {
      await expect(input).toHaveValue("16.11.2026 – 27.11.2026");
      await expect(value).toHaveTextContent("2026-11-16/2026-11-27");
    });

    await step("A short form is read: the start takes month and year from the end", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "1.-12.12.");
      await userEvent.tab();
      await expect(input).toHaveValue("01.12.2026 – 12.12.2026");
      await expect(value).toHaveTextContent("2026-12-01/2026-12-12");
    });

    await step("Ends typed the wrong way round are put in order", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "20.12.2026 bis 18.12.2026{Enter}");
      await expect(input).toHaveValue("18.12.2026 – 20.12.2026");
    });

    await step("One date alone is a range of that day", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "24.12.{Enter}");
      await expect(value).toHaveTextContent("2026-12-24/2026-12-24");
    });

    await step("What is not a range is flagged, explained and not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "nächste Woche{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(value).toHaveTextContent("leer");
      await waitFor(() =>
        expect(canvas.getByText(/Bitte geben Sie einen Zeitraum ein/)).toBeVisible(),
      );
    });

    await step("In the calendar two presses make the range, later day first or not", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
      const sheet = await screen.findByRole("dialog", { name: "Zeitraum wählen" });
      await userEvent.click(within(sheet).getByRole("button", { name: /26\. November 2026/ }));
      // One end alone changes nothing yet.
      await expect(value).toHaveTextContent("leer");
      await userEvent.click(within(sheet).getByRole("button", { name: /17\. November 2026/ }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("17.11.2026 – 26.11.2026");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(value).toHaveTextContent("2026-11-17/2026-11-26");
    });
  },
};

/**
 * As a test, with times: both ends are read with their times, one day takes "9–17 Uhr", and the
 * time fields under the calendar set the two times.
 */
export const KeyboardWithTimes: Story = {
  render: () => <Reported time />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Zeitraum");
    const value = canvas.getByTestId("value");

    await step("Both ends are shown and reported with their times", async () => {
      await expect(input).toHaveValue("16.11.2026, 08:00 – 18.11.2026, 16:30");
      await expect(value).toHaveTextContent("2026-11-16T08:00/2026-11-18T16:30");
    });

    await step("One day with two times", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "20.11. 9-17 Uhr");
      await userEvent.tab();
      await expect(input).toHaveValue("20.11.2026, 09:00 – 20.11.2026, 17:00");
      await expect(value).toHaveTextContent("2026-11-20T09:00/2026-11-20T17:00");
    });

    await step("Days without times get the working day", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "23.-25.11.{Enter}");
      await expect(value).toHaveTextContent("2026-11-23T09:00/2026-11-25T17:00");
    });

    await step(
      "The time fields under the calendar set the times; Enter closes the sheet",
      async () => {
        await userEvent.click(canvas.getByRole("button", { name: "Kalender öffnen" }));
        const sheet = await screen.findByRole("dialog", { name: "Zeitraum wählen" });
        const from = within(sheet).getByLabelText("Von");
        await userEvent.clear(from);
        await userEvent.type(from, "730");
        await userEvent.tab();
        await expect(value).toHaveTextContent("2026-11-23T07:30/2026-11-25T17:00");
        const to = within(sheet).getByLabelText("bis");
        await userEvent.clear(to);
        await userEvent.type(to, "12{Enter}");
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await expect(input).toHaveValue("23.11.2026, 07:30 – 25.11.2026, 12:00");
      },
    );
  },
};

/**
 * Under a `LocaleProvider` with `en` both ends are written and typed the American way, month
 * first. What it submits is the same ISO interval.
 */
export const English: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-72">
        <FieldLabel>Service period</FieldLabel>
        <DateRangeField {...args} defaultValue={{ from: "2026-11-16", to: "2026-11-27" }} />
      </Field>
    </LocaleProvider>
  ),
};

/** Empty in English: the placeholder is an example the field reads. */
export const EnglishEmpty: Story = {
  render: (args) => (
    <LocaleProvider locale="en">
      <Field className="w-72">
        <FieldLabel>Service period</FieldLabel>
        <DateRangeField {...args} />
      </Field>
    </LocaleProvider>
  ),
};

/**
 * The sheet in English, with presets: `lastDays` names them in the field's language, and the
 * field says the name of the one the range is.
 */
export const EnglishOpen: Story = {
  parameters: { visual: { viewport: { width: 700, height: 470 }, clip: "viewport" } },
  render: (args) => (
    <LocaleProvider locale="en">
      <Opened>
        <Field className="w-72">
          <FieldLabel>Period</FieldLabel>
          <DateRangeField
            {...args}
            presets={lookBack}
            defaultValue={{ from: "2026-10-18", to: "2026-11-14" }}
          />
        </Field>
      </Opened>
    </LocaleProvider>
  ),
};

/** The sheet in English with times: "From", "to" and "Done" under the calendar. */
export const EnglishOpenWithTimes: Story = {
  parameters: { visual: { viewport: { width: 480, height: 570 }, clip: "viewport" } },
  render: (args) => (
    <LocaleProvider locale="en">
      <Opened>
        <Field className="w-96 max-w-full">
          <FieldLabel>Booking</FieldLabel>
          <DateRangeField
            {...args}
            time
            hourCycle={12}
            defaultValue={{ from: "2026-11-16T08:00", to: "2026-11-18T16:30" }}
          />
        </Field>
      </Opened>
    </LocaleProvider>
  ),
};

function ReportedEnglish() {
  const [value, setValue] = useState<DateRange>({ from: "2026-11-16", to: "2026-11-27" });
  return (
    <LocaleProvider locale="en">
      <Field className="w-96 max-w-full">
        <FieldLabel>Period</FieldLabel>
        <DateRangeField
          value={value}
          onValueChange={setValue}
          today="2026-11-14"
          presets={lookBack}
        />
        <FieldError />
        <FieldDescription>
          Value:{" "}
          <span data-testid="value">
            {value.from === "" ? "empty" : `${value.from}/${value.to}`}
          </span>
        </FieldDescription>
      </Field>
    </LocaleProvider>
  );
}

/**
 * As a test, in English: American ranges are read with a dash, a hyphen or "to" and reported as
 * two ISO dates in order; a German range is flagged, and the message names the American format;
 * a preset is named and read in English; the calendar speaks English.
 */
export const KeyboardEnglish: Story = {
  render: () => <ReportedEnglish />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Period");
    const value = canvas.getByTestId("value");

    await step("The range is shown the American way", async () => {
      await expect(input).toHaveValue("11/16/2026 – 11/27/2026");
      await expect(value).toHaveTextContent("2026-11-16/2026-11-27");
    });

    await step("A short form is read: the start takes its year from the end", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12/1-12/12/26");
      await userEvent.tab();
      await expect(input).toHaveValue("12/01/2026 – 12/12/2026");
      await expect(value).toHaveTextContent("2026-12-01/2026-12-12");
    });

    await step("Ends typed the wrong way round, with 'to', are put in order", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12/20/2026 to 12/18/2026{Enter}");
      await expect(input).toHaveValue("12/18/2026 – 12/20/2026");
      await expect(value).toHaveTextContent("2026-12-18/2026-12-20");
    });

    await step("One date alone is a range of that day, with hyphens too", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12-24-2026{Enter}");
      await expect(value).toHaveTextContent("2026-12-24/2026-12-24");
    });

    await step("A German range is not guessed: flagged, explained, not reported", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "14.11. – 30.11.2026{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(value).toHaveTextContent("empty");
      await waitFor(() =>
        expect(
          canvas.getByText("Enter a date range, for example 11/14 – 11/30/2026."),
        ).toBeVisible(),
      );
    });

    await step("A preset's English name, typed, is that preset", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "last 7 days{Enter}");
      await expect(input).toHaveValue("Last 7 days");
      await expect(value).toHaveTextContent("2026-11-08/2026-11-14");
    });

    await step("In the calendar two presses make the range, and it speaks English", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open calendar" }));
      const sheet = await screen.findByRole("dialog", { name: "Choose a date range" });
      // The sheet eases in: it is there at once and seen a moment later.
      await waitFor(() =>
        expect(within(sheet).getByRole("group", { name: "Presets" })).toBeVisible(),
      );
      await expect(within(sheet).getByRole("button", { name: "Last 28 days" })).toBeVisible();
      await userEvent.click(within(sheet).getByRole("button", { name: /November 26, 2026/ }));
      await userEvent.click(within(sheet).getByRole("button", { name: /November 17, 2026/ }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(input).toHaveValue("11/17/2026 – 11/26/2026");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(value).toHaveTextContent("2026-11-17/2026-11-26");
    });
  },
};

/**
 * As a test: `labels` puts the caller's words in place of the language's, and without a
 * `LocaleProvider` the example in them is the German one.
 */
export const KeyboardOwnWords: Story = {
  render: () => (
    <Field className="w-96 max-w-full">
      <FieldLabel>Zeitraum</FieldLabel>
      <DateRangeField
        today="2026-11-14"
        max="2026-12-31"
        labels={{
          invalid: (example) => `So wird es gelesen: ${example}.`,
          limits: { until: "Dieses Jahr endet am 31.12." },
          open: "Kalender zeigen",
        }}
      />
      <FieldError />
    </Field>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Zeitraum");

    await step("The messages and the button's name are the caller's", async () => {
      await expect(input).toHaveAttribute("placeholder", "z. B. 14.11. – 30.11.2026");
      await userEvent.type(input, "nächste Woche{Enter}");
      await waitFor(() =>
        expect(canvas.getByText("So wird es gelesen: 14.11. – 30.11.2026.")).toBeVisible(),
      );
      await userEvent.clear(input);
      await userEvent.type(input, "28.12. – 3.1.2027{Enter}");
      await waitFor(() => expect(canvas.getByText("Dieses Jahr endet am 31.12.")).toBeVisible());
      await expect(canvas.getByRole("button", { name: "Kalender zeigen" })).toBeVisible();
    });
  },
};
