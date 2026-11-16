import {
  Invoice01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Code } from "@/components/code/code";

import { Trace, type TraceProps, type TraceStatus, TraceStep, TraceSummary } from "./trace";

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

/** Every step knows its kind; whether the symbol shows is the list's (`marks`). */
function Reminders(props: TraceProps) {
  return (
    <Trace aria-label="Offene Rechnungen prüfen" className="w-[26rem] max-w-full" {...props}>
      <TraceStep title="Offene Rechnungen gesucht" meta="12 gefunden" icon={Search01Icon} />
      <TraceStep title="Zahlungseingänge abgeglichen" meta="9 bezahlt" icon={Invoice01Icon}>
        <Payments />
      </TraceStep>
      <TraceStep
        status="running"
        title="Mahnungen werden entworfen"
        meta="2 von 3"
        icon={PencilEdit02Icon}
      />
      <TraceStep status="pending" title="Zur Freigabe vorlegen" icon={Mail01Icon} />
    </Trace>
  );
}

/**
 * Four steps of one piece of work: two done, one being worked on, one still to come. The disc
 * is done, the arc is working, the ring waits, and a hairline joins them.
 */
export const Default: Story = {
  render: (args) => <Reminders {...args} />,
};

/**
 * The same steps with `marks="symbols"`: a finished step carries the symbol of its kind in
 * place of the disc. What is being worked on and what waits keep the arc and the ring.
 */
export const Symbols: Story = {
  args: { marks: "symbols" },
  render: (args) => <Reminders {...args} />,
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

/** A helper's own steps, inside the step that started it. */
export const Nested: Story = {
  parameters: { visual: { viewport: { width: 520, height: 300 } } },
  render: () => (
    <Trace aria-label="Angebot vorbereiten" className="w-[26rem] max-w-full">
      <TraceStep title="Anfrage der Schreinerei Huber gelesen" />
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

const script = [
  {
    running: "Offene Rechnungen werden gesucht",
    done: "Offene Rechnungen gesucht",
    meta: "12 gefunden",
    icon: Search01Icon,
  },
  {
    running: "Zahlungseingänge werden abgeglichen",
    done: "Zahlungseingänge abgeglichen",
    meta: "9 bezahlt",
    icon: Invoice01Icon,
  },
  {
    running: "Mahnungen werden entworfen",
    done: "Drei Mahnungen entworfen",
    meta: "4 s",
    icon: PencilEdit02Icon,
  },
  {
    running: "Wird zur Freigabe vorgelegt",
    done: "Zur Freigabe vorgelegt",
    meta: undefined,
    icon: Mail01Icon,
  },
];

/** The work as a chat shows it: a step every 1.6 seconds, then the summary puts them away. */
function Working(props: TraceProps) {
  // How many steps are finished; the next one is running.
  const [finished, setFinished] = useState(0);
  const [run, setRun] = useState(0);
  const over = finished >= script.length;

  useEffect(() => {
    if (over) return;
    const timer = setTimeout(() => setFinished((count) => count + 1), 1600);
    return () => clearTimeout(timer);
  }, [finished, over, run]);

  return (
    <div className="flex min-h-56 w-[26rem] max-w-full flex-col items-start justify-between gap-6">
      <TraceSummary
        key={run}
        status={over ? "done" : "running"}
        title={over ? "In 6 Sekunden erledigt" : "Arbeitet"}
        meta={`${Math.min(finished + 1, script.length)} ${finished === 0 ? "Schritt" : "Schritte"}`}
      >
        <Trace aria-label="Offene Rechnungen prüfen" {...props}>
          {script.slice(0, finished + 1).map((step, index) => {
            const status: TraceStatus = index < finished ? "done" : "running";
            return (
              <TraceStep
                key={step.done}
                status={status}
                title={status === "done" ? step.done : step.running}
                meta={status === "done" ? step.meta : undefined}
                icon={step.icon}
              />
            );
          })}
        </Trace>
      </TraceSummary>
      <Button
        size="sm"
        onClick={() => {
          setFinished(0);
          setRun((count) => count + 1);
        }}
      >
        Noch einmal abspielen
      </Button>
    </div>
  );
}

/**
 * The trace at work, on a clock: steps join, the running line shimmers, a finished step's mark
 * closes from the ring into the disc, and the summary puts the steps away when the work is
 * done. It moves by itself, so it is left out of the stills.
 */
export const AtWork: Story = {
  tags: ["visual-skip"],
  render: (args) => <Working {...args} />,
};

/** The same work with `marks="symbols"`: a finished step's symbol comes in where the arc was. */
export const AtWorkSymbols: Story = {
  tags: ["visual-skip"],
  args: { marks: "symbols" },
  render: (args) => <Working {...args} />,
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
