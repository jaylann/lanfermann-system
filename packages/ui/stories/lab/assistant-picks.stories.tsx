import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/button/button";
import {
  type ArriveBy,
  Message,
  MessageContent,
  type MessageVariant,
} from "@/components/message/message";
import { answerUpTo, QUESTION, useArrivingAnswer } from "@/components/message/story-answer";
import {
  PromptInput,
  PromptInputActions,
  PromptInputAttach,
  type PromptInputLayout,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/prompt-input/prompt-input";
import { SourceList, type SourceReferenceLook, Sources } from "@/components/sources/sources";
import { SourcedAnswer, SOURCES } from "@/components/sources/story-sources";

/**
 * The open looks of the assistant's parts (issue #33), side by side at real size. Each is a
 * switch on its part; the board goes once the picks are made.
 */
const meta = {
  title: "Lab/Picks: Assistent",
  tags: ["visual-skip"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Option({
  name,
  note,
  proposed,
  children,
}: {
  name: string;
  note: string;
  proposed?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-1 basis-[24rem] flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-fg">
          {name}
          {proposed && <span className="ml-2 text-sm font-medium text-accent">Vorschlag</span>}
        </p>
        <p className="text-sm text-fg-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Board({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-wrap gap-x-12 gap-y-10">{children}</div>;
}

function Exchange({ variant }: { variant: MessageVariant }) {
  return (
    <div className="flex flex-col gap-6">
      <Message from="user" variant={variant}>
        <MessageContent>{QUESTION}</MessageContent>
      </Message>
      <Message from="assistant">
        {/* The first paragraph, whole. */}
        <MessageContent>{answerUpTo(145)}</MessageContent>
      </Message>
    </div>
  );
}

/** Pick 1: how the person's own words are set off. */
export const PersonsWords: Story = {
  name: "Pick 1: the person's words",
  render: () => (
    <Board>
      <Option
        name="Auf der Tönung (tint)"
        note="Die Blase eines Quote: fremde Worte stehen auf der Tönung."
        proposed
      >
        <Exchange variant="tint" />
      </Option>
      <Option name="Stilles Blatt (sheet)" note="Weiß mit Haarlinie, ohne Schatten.">
        <Exchange variant="sheet" />
      </Option>
    </Board>
  ),
};

function Prompt({ layout }: { layout: PromptInputLayout }) {
  return (
    <div className="flex flex-col gap-4">
      <PromptInput layout={layout}>
        <PromptInputTextarea placeholder="z. B. Fasse das Angebot für die Bäckerei Kornprobst zusammen" />
        <PromptInputActions>
          <PromptInputAttach />
          <PromptInputSubmit />
        </PromptInputActions>
      </PromptInput>
      <PromptInput layout={layout} defaultValue={`${QUESTION}\nUnd sind die Preise netto?`}>
        <PromptInputTextarea />
        <PromptInputActions>
          <PromptInputAttach />
          <PromptInputSubmit />
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}

/** Pick 2: where the send key stands. */
export const SendKey: Story = {
  name: "Pick 2: the send key",
  render: () => (
    <Board>
      <Option
        name="In einer eigenen Zeile (stacked)"
        note="Unter dem Text, Büroklammer links, Senden rechts. Platz für weitere Tasten."
        proposed
      >
        <Prompt layout="stacked" />
      </Option>
      <Option
        name="Rechts an der letzten Zeile (inline)"
        note="Eine Zeile wie ein Eingabefeld; die Tasten wandern mit der letzten Zeile."
      >
        <Prompt layout="inline" />
      </Option>
    </Board>
  ),
};

/** Each round mounts it again (its `key`), so the answer arrives from the start. */
function Arriving({ arrive }: { arrive: ArriveBy }) {
  const { count, done } = useArrivingAnswer({ every: 90 });
  return (
    <Message from="assistant" streaming={!done}>
      <MessageContent arrive={arrive}>{answerUpTo(count)}</MessageContent>
    </Message>
  );
}

/** Pick 3: how text arrives while it is written. Played: press „Abspielen“. */
function ArrivingBoard() {
  const [round, setRound] = useState(0);
  return (
    <div className="flex flex-col items-start gap-6">
      <Button size="sm" onClick={() => setRound((value) => value + 1)}>
        Abspielen
      </Button>
      <Board>
        <Option
          name="Nach Wörtern (words)"
          note="Ein paar Wörter auf einmal blenden ein, ein Schwall in einer Viertelsekunde."
          proposed
        >
          <Arriving key={`words-${round}`} arrive="words" />
        </Option>
        <Option
          name="Nach Zeilen (lines)"
          note="Eine Zeile blendet ein, sobald sie voll ist; die letzte wartet."
        >
          <Arriving key={`lines-${round}`} arrive="lines" />
        </Option>
      </Board>
    </div>
  );
}

export const ArrivingText: Story = {
  name: "Pick 3: arriving text",
  render: () => <ArrivingBoard />,
};

function Sourced({ look }: { look: SourceReferenceLook }) {
  return (
    <Message from="assistant">
      <Sources items={SOURCES} look={look}>
        <MessageContent>
          <SourcedAnswer />
        </MessageContent>
        <SourceList />
      </Sources>
    </Message>
  );
}

/** Pick 4: how a reference stands in the line. */
export const References: Story = {
  name: "Pick 4: references",
  render: () => (
    <Board>
      <Option
        name="Hochgestellte Zahl (number)"
        note="Wie eine Fußnote, in der Akzentfarbe; ruhig im Lesefluss."
        proposed
      >
        <Sourced look="number" />
      </Option>
      <Option
        name="Kleiner Stecker (plug)"
        note="Die Zahl in einem erhabenen Stecker auf der Zeile."
      >
        <Sourced look="plug" />
      </Option>
    </Board>
  ),
};

const WORDS: [string, string][] = [
  ["Name des Textfelds", "Nachricht an die KI"],
  ["Senden / Anhalten", "Senden · Anhalten"],
  ["Büroklammer", "Datei anhängen"],
  ["Anhänge (Liste)", "Anhänge"],
  ["Anhang entfernen", "„Angebot.pdf“ entfernen"],
  ["Zustände eines Anhangs", "Wird hochgeladen · Hochgeladen · Fehlgeschlagen"],
  ["Urteil", "Gute Antwort · Schlechte Antwort"],
  ["Neu erzeugen", "Noch einmal"],
  ["Antwort abgebrochen", "Die Antwort ist abgebrochen."],
  ["Zurück ans Ende", "Neueste"],
  ["Gesprächsbereich", "Unterhaltung"],
  ["Wer schreibt", "Du · KI"],
  ["Quellen", "Quellen · Quelle 1: ‹Titel› · öffnet in einem neuen Tab"],
];

/** Pick 5: the German defaults, to confirm or correct. */
export const Wording: Story = {
  name: "Pick 5: wording",
  render: () => (
    <dl className="grid max-w-[44rem] grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-x-6 gap-y-2 text-control">
      {WORDS.map(([what, words]) => (
        <div key={what} className="contents">
          <dt className="text-fg-muted">{what}</dt>
          <dd className="text-fg">{words}</dd>
        </div>
      ))}
    </dl>
  ),
};
