import { Invoice01Icon, Mail01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Button } from "@/components/button/button";

import { Timeline, TimelineGroup, TimelineItem } from "./timeline";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  parameters: { visual: { viewport: { width: 620, height: 420 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Person({ initials }: { initials: string }) {
  return (
    <Avatar size="sm">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

/** A record number or an amount: it does not break at its hyphen or before its unit. */
function Whole({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

/** Two days of a workshop's quotes, every kind of entry among them. */
function Days() {
  return (
    <Timeline className="w-[540px]">
      <TimelineGroup label="Heute" dateTime="2026-11-19">
        <TimelineItem time="14:32" dateTime="2026-11-19T14:32" avatar={<Person initials="AW" />}>
          <strong>Anna Weber</strong> hat das Angebot <Whole>A-2026-0418</Whole> angenommen.
        </TimelineItem>
        <TimelineItem time="11:05" dateTime="2026-11-19T11:05" icon={Mail01Icon}>
          Das Angebot <Whole>A-2026-0421</Whole> wurde an <strong>Bäckerei Kornprobst</strong>{" "}
          versendet.
        </TimelineItem>
        <TimelineItem time="09:12" dateTime="2026-11-19T09:12" avatar={<Person initials="JK" />}>
          <strong>Jonas Klein</strong> hat <strong>Lena Fischer</strong> ins Team eingeladen.
        </TimelineItem>
      </TimelineGroup>
      <TimelineGroup label="Gestern" dateTime="2026-11-18">
        <TimelineItem time="17:48" dateTime="2026-11-18T17:48" tone="danger">
          Die Zahlung für die Rechnung <Whole>R-2026-0112</Whole> ist fehlgeschlagen.
        </TimelineItem>
        <TimelineItem time="12:00" dateTime="2026-11-18T12:00">
          Das Angebot <Whole>A-2026-0397</Whole> ist abgelaufen.
        </TimelineItem>
        <TimelineItem time="08:30" dateTime="2026-11-18T08:30" icon={Invoice01Icon}>
          Die Rechnung <Whole>R-2026-0112</Whole> über <Whole>1.240,00 €</Whole> wurde erstellt.
        </TimelineItem>
      </TimelineGroup>
    </Timeline>
  );
}

/**
 * Each entry is led by what it is: a person's avatar where a person acted, the event's symbol
 * where the system did something worth a symbol, the error mark where something failed, and the
 * plain mark for the rest. The rail runs straight through all of them.
 */
export const Default: Story = { render: () => <Days /> };

const arrivals = [
  {
    who: "Lena Fischer",
    initials: "LF",
    what: "hat das Angebot A-2026-0422 erstellt.",
    time: "15:10",
  },
  {
    who: "Paul Wagner",
    initials: "PW",
    what: "hat die Rechnung R-2026-0113 bezahlt.",
    time: "15:24",
  },
  { who: "Mia Becker", initials: "MB", what: "hat das Team verlassen.", time: "15:41" },
];

/**
 * An entry that joins the list on screen opens its room at the top and fades in from above;
 * what stands below moves down with it. What is there on load does not move.
 */
export const Joining: Story = {
  parameters: {
    // From the top: centred, the whole board would move up as the list grows.
    layout: "padded",
    visual: {
      viewport: { width: 620, height: 380 },
      motion: [{ name: "join", click: '[data-step="join"]' }],
    },
  },
  render: function Render() {
    const [count, setCount] = useState(0);
    return (
      <div className="flex w-[540px] flex-col gap-4">
        <Button
          size="sm"
          variant="secondary"
          data-step="join"
          className="self-start"
          onClick={() => setCount((current) => Math.min(current + 1, arrivals.length))}
        >
          Nächstes Ereignis
        </Button>
        <Timeline>
          {arrivals
            .slice(0, count)
            .reverse()
            .map((entry) => (
              <TimelineItem
                key={entry.who}
                time={entry.time}
                avatar={<Person initials={entry.initials} />}
              >
                <strong>{entry.who}</strong> {entry.what}
              </TimelineItem>
            ))}
          <TimelineItem time="14:32" avatar={<Person initials="AW" />}>
            <strong>Anna Weber</strong> hat das Angebot A-2026-0418 angenommen.
          </TimelineItem>
          <TimelineItem time="11:05" icon={Mail01Icon}>
            Das Angebot A-2026-0421 wurde an <strong>Bäckerei Kornprobst</strong> versendet.
          </TimelineItem>
          <TimelineItem time="09:12" icon={UserAdd01Icon}>
            <strong>Lena Fischer</strong> ist dem Team beigetreten.
          </TimelineItem>
        </Timeline>
      </div>
    );
  },
};

/** On a phone a long sentence wraps beside its mark; the time stays at the end of the first line. */
export const Phone: Story = {
  parameters: { layout: "padded", visual: { viewport: { width: 390, height: 520 } } },
  render: () => (
    <div className="w-full [&_[data-slot=timeline]]:w-full">
      <Days />
    </div>
  ),
};

/**
 * Tests the gate in every engine: nothing moves on load, an entry that joins later has a
 * transition, and a list revealed from `hidden` stands still again.
 */
export const Gate: Story = {
  render: function Render() {
    const [count, setCount] = useState(0);
    const [shown, setShown] = useState(true);
    return (
      <div className="flex w-[540px] flex-col gap-4">
        <div className="flex gap-2">
          <Button size="sm" data-step="join" onClick={() => setCount((current) => current + 1)}>
            Ereignis
          </Button>
          <Button size="sm" data-step="toggle" onClick={() => setShown((current) => !current)}>
            Ein- und ausblenden
          </Button>
        </div>
        <div hidden={!shown}>
          <Timeline>
            {Array.from({ length: count }, (_, index) => (
              <TimelineItem key={`new-${index}`} time="15:00">
                Neues Ereignis {count - index}.
              </TimelineItem>
            ))}
            <TimelineItem time="14:32">Das Angebot A-2026-0418 wurde angenommen.</TimelineItem>
          </Timeline>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const list = () => canvasElement.querySelector<HTMLElement>('[data-slot="timeline"]')!;
    const moving = () =>
      list()
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSTransition);
    const click = (name: string) =>
      userEvent.click(canvasElement.querySelector<HTMLElement>(`[data-step="${name}"]`)!);

    await step("What is there on load does not move", async () => {
      await expect(moving()).toHaveLength(0);
    });

    await step("An entry that joins later fades in", async () => {
      await new Promise((done) => setTimeout(done, 250));
      await click("join");
      await waitFor(() =>
        expect(moving().some((animation) => animation.transitionProperty === "opacity")).toBe(true),
      );
    });

    await step("A list revealed from hidden stands still", async () => {
      await new Promise((done) => setTimeout(done, 700));
      await click("toggle");
      await click("join");
      await click("toggle");
      await new Promise((done) => requestAnimationFrame(done));
      await expect(moving()).toHaveLength(0);
    });
  },
};
