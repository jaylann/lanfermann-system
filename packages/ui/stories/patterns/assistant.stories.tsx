import { File01Icon, Mail01Icon, RefreshIcon, Search01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";

import { Attachment, MessageAttachments } from "@/components/attachment/attachment";
import { FILES } from "@/components/attachment/story-files";
import { Button } from "@/components/button/button";
import {
  Conversation,
  ConversationContent,
  ConversationLatest,
} from "@/components/conversation/conversation";
import { CopyButton } from "@/components/copy-button/copy-button";
import { Heading } from "@/components/heading/heading";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageFeedback,
} from "@/components/message/message";
import {
  afterWords,
  ANSWER_LENGTH,
  ANSWER_TEXT,
  answerUpTo,
  QUESTION,
} from "@/components/message/story-answer";
import {
  PromptInput,
  PromptInputActions,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/prompt-input/prompt-input";
import { SourceList, Sources } from "@/components/sources/sources";
import { SOURCES } from "@/components/sources/story-sources";
import { Text } from "@/components/text/text";
import { Trace, type TraceStatus, TraceStep, TraceSummary } from "@/components/trace/trace";

const meta = {
  title: "Patterns/Assistant",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1180, height: 760 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const SUGGESTIONS = [
  "Fasse das Angebot für die Bäckerei Kornprobst zusammen.",
  "Welche Angebote sind diese Woche noch offen?",
  "Entwirf eine Antwort an die Schreinerei Huber.",
];

const STEPS = [
  { title: "Angebote durchsucht", meta: "3 Treffer", icon: Search01Icon },
  { title: "Angebot 2026-0421 gelesen", meta: "4 Seiten", icon: File01Icon },
  { title: "Mail von Anna Kornprobst gelesen", icon: Mail01Icon },
];

/** Where the answer stands: at work through its steps, writing, or done. */
type Turn = { steps: number; count: number; stopped?: boolean };

/** When a played turn is where, in ms after it was sent. */
const STEP_EVERY = 700;
const WRITE_FROM = STEPS.length * STEP_EVERY + 300;
const WORD_EVERY = 70;

function turnAt(elapsed: number): Turn {
  const steps = Math.min(STEPS.length, Math.floor(elapsed / STEP_EVERY));
  const words = Math.max(0, Math.floor((elapsed - WRITE_FROM) / WORD_EVERY)) * 2;
  return { steps, count: words > 0 ? afterWords(0, words) : 0 };
}

function Work({ turn }: { turn: Turn }) {
  const working = turn.steps < STEPS.length;
  return (
    <TraceSummary
      status={working ? "running" : "done"}
      title={working ? "Arbeitet …" : "In 3 Sekunden erledigt"}
      meta={working ? undefined : `${STEPS.length} Schritte`}
    >
      <Trace marks="symbols">
        {STEPS.slice(0, Math.min(STEPS.length, turn.steps + 1)).map((step, index) => {
          const status: TraceStatus = index < turn.steps ? "done" : "running";
          return <TraceStep key={step.title} status={status} {...step} />;
        })}
      </Trace>
    </TraceSummary>
  );
}

function Answer({ turn }: { turn: Turn }) {
  const writing = turn.count < ANSWER_LENGTH && !turn.stopped;
  return (
    <Message from="assistant" streaming={writing}>
      <Work turn={turn} />
      {turn.count > 0 && (
        <Sources items={SOURCES}>
          <MessageContent>{answerUpTo(turn.count, { sources: true })}</MessageContent>
          {!writing && <SourceList />}
        </Sources>
      )}
      {turn.count > 0 && (
        <MessageActions>
          <CopyButton text={ANSWER_TEXT} size="sm" copyLabel="Antwort kopieren" />
          <MessageFeedback />
          <MessageAction icon={RefreshIcon} iconMotion="turn" label="Noch einmal" />
        </MessageActions>
      )}
    </Message>
  );
}

/** What was said before: one short exchange. */
function Earlier() {
  return (
    <>
      <Message from="user">
        <MessageContent>Welche Angebote sind diese Woche noch offen?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          <p>
            Drei Angebote warten auf eine Antwort: die Website der Bäckerei Kornprobst, die Schulung
            für die Schreinerei Huber und die Wartung für das Café Lindner. Das älteste ist seit
            zwölf Tagen offen.
          </p>
        </MessageContent>
      </Message>
    </>
  );
}

/** The question about the bakery's quote, with the draft and the quote attached. */
function Asked({ question }: { question?: string }) {
  return (
    <Message from="user">
      {question === undefined && (
        <MessageAttachments>
          <Attachment {...FILES[1]!} />
          <Attachment {...FILES[0]!} />
        </MessageAttachments>
      )}
      <MessageContent>{question ?? QUESTION}</MessageContent>
    </Message>
  );
}

/** Before anything was asked: what it can do, and a few prompts to start with. */
function Welcome({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-5 pb-6">
      <div className="flex flex-col gap-2">
        <Heading level={1} size="title">
          Woran arbeiten wir heute?
        </Heading>
        <Text tone="muted" className="max-w-[34rem]">
          Frag nach Angeboten, Kunden und Mails. Die KI liest mit, was im Büro liegt, und sagt,
          woher sie es hat.
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            size="sm"
            onClick={() => onSuggest(suggestion)}
            // A sentence may be longer than a phone is wide: it wraps inside its key.
            className="h-auto min-h-(--control-sm) py-1 text-left whitespace-normal"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

type Start = "empty" | "running" | "answered";

/**
 * The assistant's page: the conversation above, the prompt at the foot, in one column. `start`
 * freezes it in a state for a picture; `played` runs a turn on a clock once a prompt is sent.
 */
function Assistant({ start = "empty", played = false }: { start?: Start; played?: boolean }) {
  const [text, setText] = useState("");
  const [asked, setAsked] = useState(start !== "empty");
  /** What was sent in a played turn; the stills show the question about the quote. */
  const [question, setQuestion] = useState<string | undefined>(undefined);
  const [elapsed, setElapsed] = useState(
    start === "answered" ? Number.POSITIVE_INFINITY : start === "running" ? STEP_EVERY * 1.5 : 0,
  );
  const [stopped, setStopped] = useState(false);
  const turn: Turn = { ...turnAt(elapsed), stopped };
  if (start === "answered") turn.count = ANSWER_LENGTH;
  const running = asked && !stopped && turn.count < ANSWER_LENGTH;
  const field = useRef<HTMLDivElement>(null);

  // The clock of a played turn.
  useEffect(() => {
    if (!played || !asked || !running) return;
    const began = performance.now() - elapsed;
    const clock = window.setInterval(() => setElapsed(performance.now() - began), 60);
    return () => window.clearInterval(clock);
    // Started once per turn; `elapsed` is where it starts from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, asked, running]);

  return (
    <div className="flex h-dvh flex-col bg-ground">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto flex min-h-full w-full max-w-[46rem] px-5 pt-8 pb-10">
          {asked ? (
            <>
              {start !== "empty" && <Earlier />}
              <Asked question={question} />
              <Answer turn={turn} />
            </>
          ) : (
            <Welcome
              onSuggest={(suggestion) => {
                setText(suggestion);
                const area = field.current?.querySelector("textarea");
                area?.focus();
                requestAnimationFrame(() =>
                  area?.setSelectionRange(suggestion.length, suggestion.length),
                );
              }}
            />
          )}
        </ConversationContent>
        <ConversationLatest />
      </Conversation>
      <div ref={field} className="mx-auto w-full max-w-[46rem] px-5 pb-5">
        <PromptInput
          value={text}
          onValueChange={setText}
          running={running}
          onStop={() => setStopped(true)}
          onSubmit={(sent) => {
            setQuestion(sent);
            setAsked(true);
            setStopped(false);
            setElapsed(0);
          }}
        >
          <PromptInputAttachments />
          <PromptInputTextarea placeholder="z. B. Fasse das Angebot für die Bäckerei Kornprobst zusammen" />
          <PromptInputActions>
            <PromptInputAttach />
            <PromptInputSubmit />
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}

/**
 * An empty conversation: what the assistant is for, and three prompts to start with. A prompt
 * fills the field; it does not send. A test board for the parts together, not a template.
 */
export const Empty: Story = {
  render: () => <Assistant />,
};

/** At work: the question with its files, the steps of the work, the stop key in the prompt. */
export const Running: Story = {
  render: () => <Assistant start="running" />,
};

/** Answered: the answer with its sources and its keys, the files of the question above it. */
export const Answered: Story = {
  render: () => <Assistant start="answered" />,
};

/**
 * Played on a clock, to try by hand: pick a prompt or write one and send it. The steps run, the
 * answer is written, the view keeps to the foot; scroll up while it writes, or press stop.
 */
export const Played: Story = {
  tags: ["visual-skip"],
  render: () => <Assistant played />,
};

/** On a phone. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: () => <Assistant start="answered" />,
};

/** On a phone, before anything was asked. */
export const PhoneEmpty: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: () => <Assistant />,
};

/** On a phone, played. */
export const PhonePlayed: Story = {
  tags: ["visual-skip"],
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: () => <Assistant played />,
};
