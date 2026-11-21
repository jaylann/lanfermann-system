import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { exportRuns, uptimeDays } from "./story-data";
import { Tracker } from "./tracker";

const meta = {
  title: "Components/Tracker",
  component: Tracker,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 260 }, target: '[data-slot="tracker-strip"]' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const days = uptimeDays();

/**
 * Ninety days of a service: the summary above in words, the strip shows when it went wrong.
 * Going from a good day to a disturbed one, the readout swaps its status from the side the
 * pointer goes to.
 */
export const Default: Story = {
  parameters: {
    visual: {
      viewport: { width: 760, height: 300 },
      motion: [
        {
          name: "swap",
          hover: '[data-slot="tracker-strip"] > span:nth-child(19)',
          then: { click: '[data-slot="tracker-strip"] > span:nth-child(20)', at: 40 },
        },
      ],
    },
  },
  render: () => (
    <div className="flex w-[42rem] max-w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-control font-medium text-fg">Angebotsdienst</p>
        <p className="text-sm text-fg-muted tabular-nums">99,8 % verfügbar</p>
      </div>
      <Tracker label="Verfügbarkeit des Angebotsdienstes, letzte 90 Tage" data={days} />
    </div>
  ),
};

/** The last runs of a job: cells named by the run, not by a date, and wide enough to read singly. */
export const Runs: Story = {
  render: () => (
    <Card className="w-[34rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Nächtlicher Rechnungsexport
        </Heading>
        <span className="text-sm text-fg-muted">27 von 27 gelaufen</span>
      </CardBar>
      <div className="px-5 py-4">
        <Tracker label="Die letzten 30 Läufe des Rechnungsexports" data={exportRuns()} />
      </div>
    </Card>
  ),
};

/** Several services, one strip each, aligned. */
export const Services: Story = {
  parameters: { visual: { viewport: { width: 760, height: 360 } } },
  render: () => (
    <div className="flex w-[42rem] max-w-full flex-col gap-6">
      {[
        { name: "Angebotsdienst", share: "99,8 %", data: days },
        {
          name: "Rechnungsexport",
          share: "100 %",
          data: uptimeDays(90).map((day) => ({
            ...day,
            status: "success" as const,
            detail: "Keine Störung",
          })),
        },
        {
          name: "Kundenportal",
          share: "99,1 %",
          data: uptimeDays(90).map((day, index) =>
            index % 23 === 11
              ? { ...day, status: "warning" as const, detail: "Langsam geantwortet" }
              : day,
          ),
        },
      ].map((service) => (
        <div key={service.name} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-control font-medium text-fg">{service.name}</p>
            <p className="text-sm text-fg-muted tabular-nums">{service.share} verfügbar</p>
          </div>
          <Tracker label={`Verfügbarkeit: ${service.name}, letzte 90 Tage`} data={service.data} />
        </div>
      ))}
    </div>
  ),
};

/** On a phone ninety cells stand a pixel apart; a finger slides along to read them. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 240 } } },
  render: () => (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-control font-medium text-fg">Angebotsdienst</p>
        <p className="text-sm text-fg-muted tabular-nums">99,8 % verfügbar</p>
      </div>
      <Tracker label="Verfügbarkeit des Angebotsdienstes, letzte 90 Tage" data={days} />
    </div>
  ),
};

/** The keyboard walks the cells and each is said, its status in words; Escape leaves. */
export const Keyboard: Story = {
  render: () => (
    <Tracker
      className="w-[42rem] max-w-full"
      label="Verfügbarkeit des Angebotsdienstes, letzte 90 Tage"
      data={days}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const strip = canvas.getByRole("group", { name: /Verfügbarkeit/ });
    const readout = () => canvasElement.querySelector('[data-slot="chart-readout"]');
    const said = () => canvasElement.querySelector('[aria-live="polite"]');

    await step("Tab reaches the strip; the first arrow stands on the latest day", async () => {
      await userEvent.tab();
      await expect(strip).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(readout()).toHaveTextContent("Fr., 20. Nov."));
      await expect(said()).toHaveTextContent("Fr., 20. Nov.: In Ordnung, Keine Störung");
    });

    await step("Home goes to the first day; an outage is said in words", async () => {
      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(readout()).toHaveTextContent("So., 23. Aug."));
      // The outage stands 38 days before the end: the 53rd of the 90.
      for (let move = 0; move < 52; move++) await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(said()).toHaveTextContent(/Ausgefallen, 2 Stunden 10 Minuten ausgefallen$/),
      );
    });

    await step("Escape leaves", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvasElement.querySelector("[data-shown]")).toBeNull());
    });
  },
};
