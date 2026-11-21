import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment } from "react";
import { expect } from "storybook/test";

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list/description-list";
import { Text } from "@/components/text/text";

import { RelativeTime } from "./relative-time";

/** A fixed "now", so the pictures do not change from minute to minute: 21 Nov 2026, 14:00. */
const NOW = "2026-11-21T14:00:00+01:00";
const ago = (minutes: number) => new Date(Date.parse(NOW) - minutes * 60_000).toISOString();

const meta = {
  title: "Components/RelativeTime",
  component: RelativeTime,
  args: { value: ago(5), now: NOW },
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 480, height: 120 } },
  },
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In a sentence, where it is used most: when a thing was last touched. */
export const Default: Story = {
  render: (args) => (
    <Text tone="muted">
      Zuletzt gespeichert <RelativeTime {...args} />.
    </Text>
  ),
};

/**
 * How far back it counts in words: under a minute, minutes, hours within the day, the days of
 * the calendar, and from a week on the date.
 */
export const Steps: Story = {
  parameters: { visual: { viewport: { width: 520, height: 470 } } },
  render: () => (
    <DescriptionList className="w-[28rem] max-w-full">
      {[
        ["Rechnung RE-2026-0412 bezahlt", ago(0.3)],
        ["Angebot A-2026-0418 angesehen", ago(5)],
        ["Termin bestätigt", ago(3 * 60 + 20)],
        ["Schlüssel erstellt", "2026-11-20T22:15:00+01:00"],
        ["Kundin angelegt", "2026-11-19T09:40:00+01:00"],
        ["Lieferung angekündigt", "2026-11-17T11:00:00+01:00"],
        ["Vertrag geschlossen", "2026-11-12T16:30:00+01:00"],
        ["Konto eröffnet", "2025-03-04T10:00:00+01:00"],
      ].map(([event, when]) => (
        <Fragment key={event}>
          <DescriptionTerm>{event}</DescriptionTerm>
          <DescriptionDetails>
            <RelativeTime value={when!} now={NOW} />
          </DescriptionDetails>
        </Fragment>
      ))}
    </DescriptionList>
  ),
};

/** Ahead as well: a date that is coming. */
export const Ahead: Story = {
  parameters: { visual: { viewport: { width: 520, height: 230 } } },
  render: () => (
    <DescriptionList className="w-[28rem] max-w-full">
      {[
        ["Wartung", "2026-11-21T14:00:40+01:00"],
        ["Zahlung fällig", "2026-11-21T14:25:00+01:00"],
        ["Abholung", "2026-11-22T09:00:00+01:00"],
        ["Probezeit endet", "2026-11-25T00:00:00+01:00"],
      ].map(([event, when]) => (
        <Fragment key={event}>
          <DescriptionTerm>{event}</DescriptionTerm>
          <DescriptionDetails>
            <RelativeTime value={when!} now={NOW} />
          </DescriptionDetails>
        </Fragment>
      ))}
    </DescriptionList>
  ),
};

/** `short` for a tight place, a column of a table: „vor 5 Min.“, „vor 3 Std.“. */
export const Short: Story = {
  render: (args) => (
    <Text tone="muted" size="sm">
      Aktualisiert <RelativeTime {...args} short />
    </Text>
  ),
};

/**
 * Without `now` it counts from the reader's clock and keeps up: this one says „gerade eben“
 * and turns into „vor 1 Minute“ within a minute of opening.
 */
export const Live: Story = {
  tags: ["visual-skip"],
  render: () => (
    <Text tone="muted">
      Zuletzt gespeichert <RelativeTime value={Date.now()} />.
    </Text>
  ),
};

/**
 * As a test: the words say how long ago, the `<time>` carries the moment for machines, and
 * without `now` the reader's clock is read.
 */
export const Reading: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text>
        <RelativeTime data-testid="fixed" value="2026-11-21T13:55:00+01:00" now={NOW} />
      </Text>
      <Text>
        <RelativeTime data-testid="short" value="2026-11-21T10:30:00+01:00" now={NOW} short />
      </Text>
      <Text>
        <RelativeTime data-testid="live" value={Date.now() - 5 * 60_000 - 1000} />
      </Text>
    </div>
  ),
  play: async ({ canvas, step }) => {
    await step("the moment is said in words and kept for machines", async () => {
      const fixed = canvas.getByTestId("fixed");
      await expect(fixed).toHaveTextContent("vor 5 Minuten");
      await expect(fixed.tagName).toBe("TIME");
      await expect(fixed).toHaveAttribute("dateTime", "2026-11-21T13:55:00+01:00");
    });
    await step("short for a tight place", async () => {
      await expect(canvas.getByTestId("short")).toHaveTextContent("vor 3 Std.");
    });
    await step("without now, the reader's clock", async () => {
      await expect(canvas.getByTestId("live")).toHaveTextContent("vor 5 Minuten");
    });
  },
};
