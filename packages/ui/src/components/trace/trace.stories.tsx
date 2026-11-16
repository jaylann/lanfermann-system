import {
  File01Icon,
  Invoice01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Code } from "@/components/code/code";

import { Trace, type TraceProps, TraceStep, TraceSummary } from "./trace";

const meta = {
  title: "Components/Trace",
  component: Trace,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 520, height: 220 },
      target: '[data-slot="trace-trigger"]',
      motion: [{ name: "open", click: '[data-slot="trace-trigger"]', frames: 8 }],
    },
  },
} satisfies Meta<typeof Trace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the assistant found when it compared the payments: the detail of one step. */
function Payments() {
  return (
    <>
      <p>Neun der zwölf Rechnungen sind bezahlt, drei sind noch offen:</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge className="font-mono">RE-2026-112</Badge>
        <Badge className="font-mono">RE-2026-115</Badge>
        <Badge className="font-mono">RE-2026-117</Badge>
      </div>
      <p className="text-fg-muted">Verglichen mit dem Kontoauszug vom November.</p>
    </>
  );
}

function Reminders({ icons = false, ...props }: TraceProps & { icons?: boolean }) {
  return (
    <Trace aria-label="Offene Rechnungen prüfen" className="w-[26rem] max-w-full" {...props}>
      <TraceStep
        title="Offene Rechnungen gesucht"
        meta="12 gefunden"
        icon={icons ? Search01Icon : undefined}
      />
      <TraceStep
        title="Zahlungseingänge abgeglichen"
        meta="9 bezahlt"
        icon={icons ? Invoice01Icon : undefined}
      >
        <Payments />
      </TraceStep>
      <TraceStep
        status="running"
        title="Mahnungen werden entworfen"
        meta="2 von 3"
        icon={icons ? PencilEdit02Icon : undefined}
      />
      <TraceStep
        status="pending"
        title="Zur Freigabe vorlegen"
        icon={icons ? Mail01Icon : undefined}
      />
    </Trace>
  );
}

/**
 * Four steps of one piece of work: two done, one being worked on, one still to come. The disc
 * is done, the arc is working, the ring waits.
 */
export const Default: Story = {
  render: () => <Reminders />,
};

/** A step that has more to say opens under its line. */
export const Detail: Story = {
  parameters: { visual: { viewport: { width: 520, height: 300 } } },
  render: () => (
    <Trace aria-label="Offene Rechnungen prüfen" className="w-[26rem] max-w-full">
      <TraceStep title="Offene Rechnungen gesucht" meta="12 gefunden" />
      <TraceStep title="Zahlungseingänge abgeglichen" meta="9 bezahlt" defaultOpen>
        <Payments />
      </TraceStep>
      <TraceStep status="running" title="Mahnungen werden entworfen" meta="2 von 3" />
    </Trace>
  ),
};

/** A step that failed says so in words and carries the danger symbol; its detail says why. */
export const Failed: Story = {
  parameters: { visual: { viewport: { width: 520, height: 260 } } },
  render: () => (
    <Trace aria-label="Mahnungen senden" className="w-[26rem] max-w-full">
      <TraceStep title="Drei Mahnungen entworfen" meta="4 s" />
      <TraceStep status="error" title="Versand fehlgeschlagen" meta="1 von 3" defaultOpen>
        <p>
          Die Mahnung zu <Code>RE-2026-115</Code> ging nicht hinaus: Für die Brauerei Giesinger Hof
          ist keine E-Mail-Adresse hinterlegt.
        </p>
      </TraceStep>
      <TraceStep status="pending" title="Wiedervorlage in 14 Tagen anlegen" />
    </Trace>
  ),
};

/** With a symbol per kind of step, in place of the disc once the step is done. */
export const WithIcons: Story = {
  render: () => <Reminders icons />,
};

/** Without the rail the marks stand alone. */
export const WithoutRail: Story = {
  render: () => <Reminders rail={false} />,
};

/** A helper's own steps, inside the step that started it. */
export const Nested: Story = {
  parameters: { visual: { viewport: { width: 520, height: 300 } } },
  render: () => (
    <Trace aria-label="Angebot vorbereiten" className="w-[26rem] max-w-full">
      <TraceStep title="Anfrage der Schreinerei Huber gelesen" icon={File01Icon} />
      <TraceStep status="running" title="Preise werden ermittelt" meta="2 Schritte" defaultOpen>
        <Trace aria-label="Preise ermitteln">
          <TraceStep title="Frühere Angebote verglichen" meta="3 gefunden" />
          <TraceStep status="running" title="Aufwand wird geschätzt" />
        </Trace>
      </TraceStep>
      <TraceStep status="pending" title="Angebot schreiben" />
    </Trace>
  ),
};

/**
 * The work as one line above an answer, while it goes on: the line says that something is
 * happening, and the steps under it can be watched.
 */
export const Summary: Story = {
  parameters: { visual: { viewport: { width: 520, height: 260 } } },
  render: () => (
    <TraceSummary status="running" title="Arbeitet" meta="3 Schritte">
      <Reminders />
    </TraceSummary>
  ),
};

/** Once the work is done the line says how long it took, and the steps are put away. */
export const SummaryDone: Story = {
  parameters: { visual: { viewport: { width: 520, height: 120 } } },
  render: () => (
    <TraceSummary title="In 14 Sekunden erledigt" meta="4 Schritte">
      <Trace aria-label="Offene Rechnungen prüfen" className="w-[26rem] max-w-full">
        <TraceStep title="Offene Rechnungen gesucht" meta="12 gefunden" />
        <TraceStep title="Zahlungseingänge abgeglichen" meta="9 bezahlt" />
        <TraceStep title="Drei Mahnungen entworfen" meta="4 s" />
        <TraceStep title="Zur Freigabe vorgelegt" />
      </Trace>
    </TraceSummary>
  ),
};

/**
 * The keyboard, as a test: only a step that opens is a tab stop, Enter opens and closes it and
 * says so, and every line says its state in words to assistive tech.
 */
export const Keyboard: Story = {
  render: () => <Reminders />,
  play: async ({ canvas, userEvent, step }) => {
    const opens = canvas.getByRole("button", { name: /Zahlungseingänge abgeglichen/ });

    await step("The states are said in words", async () => {
      await expect(canvas.getByText("Läuft:", { exact: false })).toBeInTheDocument();
      await expect(canvas.getByText("Steht aus:", { exact: false })).toBeInTheDocument();
    });

    await step("The one step that opens is the one tab stop", async () => {
      await userEvent.tab();
      await expect(opens).toHaveFocus();
      await expect(opens).toHaveAttribute("aria-expanded", "false");
    });

    await step("Enter opens its detail", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(opens).toHaveAttribute("aria-expanded", "true");
      await waitFor(() => expect(canvas.getByText("RE-2026-115")).toBeVisible());
    });

    await step("Enter closes it again", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(opens).toHaveAttribute("aria-expanded", "false");
    });
  },
};
