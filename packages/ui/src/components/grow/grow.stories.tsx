import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { Button } from "@/components/button/button";
import { Trace, TraceStep, TraceSummary } from "@/components/trace/trace";

import { Grow } from "./grow";

const meta = {
  title: "Components/Grow",
  component: Grow,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 520, height: 320 } },
  },
} satisfies Meta<typeof Grow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What stands under the block: it is what the reader sees move. */
function Below() {
  return (
    <p className="border-t-2 border-rule pt-3 text-control text-fg-muted">
      Was darunter steht, rückt mit.
    </p>
  );
}

/** At rest: a block as tall as what it holds, nothing more. */
export const Default: Story = {
  render: () => (
    <div className="flex w-[26rem] max-w-full flex-col gap-4">
      <Grow>
        <p className="text-control text-fg-body">
          Neun der zwölf Rechnungen sind bezahlt, drei sind noch offen.
        </p>
      </Grow>
      <Below />
    </div>
  ),
};

const steps = [
  "Offene Rechnungen gesucht",
  "Zahlungseingänge abgeglichen",
  "Drei Mahnungen entworfen",
  "Zur Freigabe vorgelegt",
];

/**
 * A trace whose steps join on a clock, then the answer under it. The block eases to each new
 * height, so the line under it moves down instead of jumping. It moves by itself, so it is left
 * out of the stills.
 */
function Working() {
  const [shown, setShown] = useState(1);
  const [run, setRun] = useState(0);
  const over = shown > steps.length;

  useEffect(() => {
    if (over) return;
    const timer = setTimeout(() => setShown((count) => count + 1), 1400);
    return () => clearTimeout(timer);
  }, [shown, over, run]);

  return (
    <div className="flex w-[26rem] max-w-full flex-col gap-4">
      <Grow>
        <div className="flex flex-col gap-3">
          <TraceSummary
            key={run}
            status={over ? "done" : "running"}
            title={over ? "In 6 Sekunden erledigt" : "Arbeitet"}
            defaultOpen
          >
            <Trace aria-label="Offene Rechnungen prüfen">
              {steps.slice(0, shown).map((title, index) => (
                <TraceStep
                  key={title}
                  status={index < shown - 1 || over ? "done" : "running"}
                  title={title}
                />
              ))}
            </Trace>
          </TraceSummary>
          {over ? (
            <p className="text-control text-fg-body">
              Drei Rechnungen sind überfällig. Die Mahnungen liegen als Entwurf bereit und gehen
              erst hinaus, wenn du sie freigibst.
            </p>
          ) : null}
        </div>
      </Grow>
      <Below />
      <Button
        size="sm"
        className="self-start"
        onClick={() => {
          setShown(1);
          setRun((count) => count + 1);
        }}
      >
        Noch einmal abspielen
      </Button>
    </div>
  );
}

export const AtWork: Story = {
  tags: ["visual-skip"],
  render: () => <Working />,
};

const answers = [
  { id: "kurz", label: "Kurz", text: ["Drei Rechnungen sind offen."] },
  {
    id: "lang",
    label: "Ausführlich",
    text: [
      "Drei Rechnungen sind offen, zwei davon seit mehr als dreißig Tagen.",
      "Für beide liegt eine Zahlungserinnerung als Entwurf bereit. Versendet ist nichts.",
      "Die dritte ist erst seit einer Woche fällig; sie kann warten.",
    ],
  },
];

/**
 * One block swapped for another of a different height, as a tab does: it eases between the
 * two. Under reduced motion it changes at once.
 */
function Swap() {
  const [chosen, setChosen] = useState("kurz");
  const shown = answers.find((answer) => answer.id === chosen)?.text ?? [];
  return (
    <div className="flex w-[26rem] max-w-full flex-col gap-4">
      <div className="flex gap-2">
        {answers.map((answer) => (
          <Button
            key={answer.id}
            size="sm"
            variant={answer.id === chosen ? "secondary" : "quiet"}
            aria-pressed={answer.id === chosen}
            onClick={() => setChosen(answer.id)}
          >
            {answer.label}
          </Button>
        ))}
      </div>
      <Grow>
        <div key={chosen} className="flex flex-col gap-2 text-control text-fg-body">
          {shown.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Grow>
      <Below />
    </div>
  );
}

export const Swapped: Story = {
  parameters: {
    visual: {
      motion: [{ name: "swap", click: 'button[aria-pressed="false"]', frames: 8 }],
    },
  },
  render: () => <Swap />,
};
