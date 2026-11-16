import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";

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
  },
};
