import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { LocaleProvider } from "@/locale/locale";

import { Calendar } from "./calendar";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  // A fixed "today", so the pictures do not change from day to day.
  args: { today: "2026-11-14" },
  parameters: {
    visual: {
      viewport: { width: 320, height: 340 },
      target: '[data-slot="calendar-day"]:not([disabled])',
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing chosen: today wears the ring. */
export const Default: Story = {};

/** The chosen day is the Indigo plug; the ring stays on today. */
export const Chosen: Story = { args: { defaultValue: "2026-11-30" } };

/** Days outside the allowed range are muted and cannot be pressed. */
export const Limited: Story = {
  args: { defaultValue: "2026-11-20", min: "2026-11-14", max: "2026-12-15" },
};

/**
 * `mode="range"`: a first and a last day. The range is one raised shape, filled from its first
 * day to its last, also where it runs on into the next week.
 */
export const Range: Story = {
  render: (args) => (
    <Calendar
      today={args.today}
      mode="range"
      defaultValue={{ from: "2026-11-16", to: "2026-11-27" }}
    />
  ),
};

/** A range over three weeks is a stair, and today's ring steps inside it. */
export const RangeOverToday: Story = {
  render: (args) => (
    <Calendar
      today={args.today}
      mode="range"
      defaultValue={{ from: "2026-11-04", to: "2026-11-22" }}
    />
  ),
};

/** A chosen day next to today: the ring and the plug keep apart. */
export const NextToToday: Story = { args: { defaultValue: "2026-11-13" } };

/** Today chosen: its ring steps inside the plug. */
export const TodayChosen: Story = { args: { defaultValue: "2026-11-14" } };

/** Saturday to Tuesday: two weeks with no column in common stay two pieces. */
export const RangeOverAWeekend: Story = {
  render: (args) => (
    <Calendar
      today={args.today}
      mode="range"
      defaultValue={{ from: "2026-11-21", to: "2026-11-24" }}
    />
  ),
};

/** A range of one day is a single plug. */
export const RangeOfOneDay: Story = {
  render: (args) => (
    <Calendar
      today={args.today}
      mode="range"
      defaultValue={{ from: "2026-11-19", to: "2026-11-19" }}
    />
  ),
};

/**
 * The keyboard path, as a test: the arrows move by day and by week, Enter chooses, and the value
 * comes out as an ISO date.
 */
export const Keyboard: Story = {
  args: { defaultValue: "2026-11-18" },
  play: async ({ canvas, userEvent, step }) => {
    const day = (name: RegExp) => canvas.getByRole("button", { name });

    await step("Tab passes the two month buttons and lands on the chosen day", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await expect(day(/18\. November 2026/)).toHaveFocus();
    });

    await step("ArrowRight moves a day, ArrowDown a week", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(day(/19\. November 2026/)).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(day(/26\. November 2026/)).toHaveFocus();
    });

    await step("Enter chooses the focused day", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(day(/26\. November 2026, ausgewählt/)).toBeInTheDocument();
      await expect(
        canvas.queryByRole("button", { name: /18\. November 2026, ausgewählt/ }),
      ).toBeNull();
    });
  },
};

/**
 * Without a `today` it asks the browser, as a test: the calendar stands on this month, can be
 * seen, and today wears the ring. No picture is taken of it: it would change every day.
 */
export const TodayFromTheClock: Story = {
  args: { today: undefined },
  play: async ({ canvasElement, step }) => {
    const now = new Date();

    await step("It stands on this month", async () => {
      const calendar = canvasElement.querySelector('[data-slot="calendar"]');
      await expect(calendar).toBeVisible();
      const month = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
      await expect(calendar).toHaveTextContent(month.format(now));
    });

    await step("Today is marked, and only today", async () => {
      const marked = [...canvasElement.querySelectorAll("[data-today]")];
      await expect(marked).toHaveLength(1);
      await expect(marked[0]).toHaveTextContent(String(now.getDate()));
    });
  },
};

/**
 * A range, as a test: the first press sets one end, the range follows the focus, and the second
 * press completes it, whichever end came first. What is chosen is one shape, drawn once.
 */
export const RangeKeyboard: Story = {
  render: (args) => (
    <Calendar
      today={args.today}
      mode="range"
      defaultValue={{ from: "2026-11-16", to: "2026-11-27" }}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const day = (name: RegExp) => canvas.getByRole("button", { name });
    const chosen = () =>
      canvas.getAllByRole("button", { name: /ausgewählt/ }).map((button) => button.textContent);

    await step("The range and the days between its ends are chosen", async () => {
      await expect(chosen()).toHaveLength(12);
      await expect(canvasElement.querySelectorAll('[data-slot="calendar-selection"]')).toHaveLength(
        1,
      );
    });

    await step("A press starts a new range at that day", async () => {
      await userEvent.click(day(/24\. November 2026/));
      await expect(chosen()).toEqual(["24"]);
    });

    await step("The range follows the focus before the second press", async () => {
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
      await expect(day(/21\. November 2026/)).toHaveFocus();
      await expect(chosen()).toEqual(["21", "22", "23", "24"]);
    });

    await step("Enter sets the other end, here the earlier one", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(chosen()).toEqual(["21", "22", "23", "24"]);
      // Moving on no longer changes the range.
      await userEvent.keyboard("{ArrowLeft}");
      await expect(chosen()).toEqual(["21", "22", "23", "24"]);
    });

    await step(
      "The shape has come to rest on the range: Saturday to Tuesday, two bars",
      async () => {
        const shape = canvasElement.querySelector<HTMLElement>('[data-slot="calendar-selection"]')!;
        // At rest it is written in the calendar's own units again, not in pixels.
        await waitFor(() => expect(shape.style.getPropertyValue("--shape")).toContain("var(--u)"));
        await expect(shape).not.toHaveAttribute("data-empty");
      },
    );
  },
};

/**
 * Under a `LocaleProvider` with `en`: the month and the weekdays are English. The week still
 * starts on Monday, the selection is drawn for that.
 */
export const English: Story = {
  args: { mode: "range", defaultValue: { from: "2026-11-18", to: "2026-11-27" } },
  decorators: [
    (Story) => (
      <LocaleProvider locale="en">
        <Story />
      </LocaleProvider>
    ),
  ],
};

/** What the calendar says to assistive tech, each word of it. */
const said = (canvasElement: HTMLElement) => ({
  weekdays: [...canvasElement.querySelectorAll("thead th")].map(
    (cell) => `${cell.textContent} ${cell.getAttribute("aria-label")}`,
  ),
  keys: [...canvasElement.querySelectorAll("nav button")].map((key) =>
    key.getAttribute("aria-label"),
  ),
});

/**
 * As a test, in English: nothing German is left. The month, the weekdays (from Monday), the two
 * month keys, the grid's name and every day's name are English, and so is "selected".
 */
export const KeyboardEnglish: Story = {
  args: { defaultValue: "2026-11-18" },
  decorators: English.decorators,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("The month, the weekdays and the keys are English", async () => {
      await expect(canvas.getByText("November 2026")).toBeVisible();
      await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeVisible();
      await expect(said(canvasElement)).toEqual({
        weekdays: [
          "Mo Monday",
          "Tu Tuesday",
          "We Wednesday",
          "Th Thursday",
          "Fr Friday",
          "Sa Saturday",
          "Su Sunday",
        ],
        keys: ["Go to the Previous Month", "Go to the Next Month"],
      });
    });

    await step("The days are named in English, today and the chosen one too", async () => {
      await expect(
        canvas.getByRole("button", { name: "Today, Saturday, November 14, 2026" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Wednesday, November 18, 2026, selected" }),
      ).toBeVisible();
    });

    await step("The next month is English as well", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Go to the Next Month" }));
      await expect(canvas.getByRole("grid", { name: "December 2026" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Tuesday, December 1, 2026" })).toBeVisible();
    });
  },
};

/** As a test: without a `LocaleProvider` every one of those words is German, as it was. */
export const WordsGerman: Story = {
  args: { defaultValue: "2026-11-18" },
  play: async ({ canvas, canvasElement, step }) => {
    await step("The month, the weekdays and the keys are German", async () => {
      await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeVisible();
      await expect(said(canvasElement)).toEqual({
        weekdays: [
          "Mo Montag",
          "Di Dienstag",
          "Mi Mittwoch",
          "Do Donnerstag",
          "Fr Freitag",
          "Sa Samstag",
          "So Sonntag",
        ],
        keys: ["Zum vorherigen Monat", "Zum nächsten Monat"],
      });
    });

    await step("The days are named in German", async () => {
      await expect(
        canvas.getByRole("button", { name: "Heute, Samstag, 14. November 2026" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Mittwoch, 18. November 2026, ausgewählt" }),
      ).toBeVisible();
    });
  },
};
