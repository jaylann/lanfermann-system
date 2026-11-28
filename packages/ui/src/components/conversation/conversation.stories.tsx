import { RefreshIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { CopyButton } from "@/components/copy-button/copy-button";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageFeedback,
} from "@/components/message/message";
import {
  ANSWER_LENGTH,
  ANSWER_TEXT,
  answerUpTo,
  QUESTION,
  useArrivingAnswer,
} from "@/components/message/story-answer";
import { Trace, TraceStep } from "@/components/trace/trace";

import { Conversation, ConversationContent, ConversationLatest } from "./conversation";

const meta = {
  title: "Components/Conversation",
  component: Conversation,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 560 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const EARLIER: { question: string; answer: ReactNode }[] = [
  {
    question: "Welche Angebote sind diese Woche noch offen?",
    answer: (
      <p>
        Drei Angebote warten auf eine Antwort: die Website der Bäckerei Kornprobst, die Schulung für
        die Schreinerei Huber und die Wartung für das Café Lindner. Das älteste ist seit zwölf Tagen
        offen.
      </p>
    ),
  },
  {
    question: "Hat sich die Schreinerei Huber noch einmal gemeldet?",
    answer: (
      <p>
        Ja, am Dienstag. Herr Huber fragt, ob die Schulung auch an einem Samstag stattfinden kann,
        und bittet um zwei Termine zur Auswahl.
      </p>
    ),
  },
];

function Actions() {
  return (
    <MessageActions>
      <CopyButton text={ANSWER_TEXT} size="sm" copyLabel="Antwort kopieren" />
      <MessageFeedback />
      <MessageAction icon={RefreshIcon} iconMotion="turn" label="Noch einmal" />
    </MessageActions>
  );
}

/** The conversation so far: two exchanges and the question about the bakery's quote. */
function Earlier() {
  return EARLIER.map(({ question, answer }) => (
    <div key={question} className="contents">
      <Message from="user">
        <MessageContent>{question}</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>{answer}</MessageContent>
      </Message>
    </div>
  ));
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-[30rem] flex-col">{children}</div>;
}

/** A conversation opens at its foot, the newest answer in view, without motion. */
export const Default: Story = {
  render: () => (
    <Frame>
      <Conversation className="flex-1">
        <ConversationContent className="px-1 pb-6">
          <Earlier />
          <Message from="user">
            <MessageContent>{QUESTION}</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
            <Actions />
          </Message>
        </ConversationContent>
        <ConversationLatest />
      </Conversation>
    </Frame>
  ),
};

/** Scrolls the conversation's view to its top once it stands, as a reader would. */
function ScrolledUp({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const scroller = box.current?.querySelector('[data-slot="conversation-scroller"]');
      scroller?.scrollTo({ top: 0 });
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);
  return <div ref={box}>{children}</div>;
}

/**
 * The reader has scrolled up: the key „Neueste“ stands above the foot. Pressed, the view glides
 * back down and the key leaves by fading.
 */
export const LeftTheFoot: Story = {
  parameters: {
    visual: {
      target: '[data-slot="conversation-latest"] button',
      motion: [{ name: "latest", click: '[data-slot="conversation-latest"] button', frames: 8 }],
    },
  },
  render: () => (
    <ScrolledUp>
      <Frame>
        <Conversation className="flex-1">
          <ConversationContent className="px-1 pb-6">
            <Earlier />
            <Message from="user">
              <MessageContent>{QUESTION}</MessageContent>
            </Message>
            <Message from="assistant">
              <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
              <Actions />
            </Message>
          </ConversationContent>
          <ConversationLatest />
        </Conversation>
      </Frame>
    </ScrolledUp>
  ),
};

/** Asking: the question rises in, the view goes to the foot and follows the answer. */
function Asking() {
  const [asked, setAsked] = useState(false);
  const { count, done, run } = useArrivingAnswer({ every: 90 });
  return (
    <div className="flex flex-col gap-4">
      <Button
        size="sm"
        className="self-start"
        onClick={() => {
          setAsked(true);
          run();
        }}
      >
        Frage senden
      </Button>
      <Frame>
        <Conversation className="flex-1">
          <ConversationContent className="px-1 pb-6">
            <Earlier />
            {asked && (
              <>
                <Message from="user">
                  <MessageContent>{QUESTION}</MessageContent>
                </Message>
                <Message from="assistant" streaming={!done}>
                  <MessageContent>{answerUpTo(count)}</MessageContent>
                  <Actions />
                </Message>
              </>
            )}
          </ConversationContent>
          <ConversationLatest />
        </Conversation>
      </Frame>
    </div>
  );
}

/**
 * Played by a clock, to watch: the view keeps to the foot while the answer grows. Scroll up
 * while it is written and it stays where you are; „Neueste“ leads back.
 */
export const Following: Story = {
  tags: ["visual-skip"],
  render: () => <Asking />,
};

/** On a phone. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 640 } } },
  render: () => (
    <Frame>
      <Conversation className="flex-1">
        <ConversationContent className="pb-6">
          <Earlier />
          <Message from="user">
            <MessageContent>{QUESTION}</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
            <Actions />
          </Message>
        </ConversationContent>
        <ConversationLatest />
      </Conversation>
    </Frame>
  ),
};

/**
 * From the keyboard: the conversation is one stop; a key that reads further up leaves the foot
 * and brings „Neueste“, which leads back and hands the focus to the conversation.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame>
      <Conversation className="flex-1">
        <ConversationContent className="px-1 pb-6">
          <Earlier />
          <Message from="user">
            <MessageContent>{QUESTION}</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
          </Message>
        </ConversationContent>
        <ConversationLatest />
      </Conversation>
    </Frame>
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const region = canvas.getByRole("region", { name: "Unterhaltung" });
    const latest = canvasElement.querySelector<HTMLElement>('[data-slot="conversation-latest"]')!;
    await step("it opens at its foot, without the key", async () => {
      await expect(region.scrollTop + region.clientHeight).toBeGreaterThanOrEqual(
        region.scrollHeight - 4,
      );
      await expect(latest).not.toHaveAttribute("data-shown");
    });
    await step("Home leaves the foot and brings the key", async () => {
      await userEvent.tab();
      await expect(region).toHaveFocus();
      await userEvent.keyboard("{Home}");
      // The test's keyboard sends the key but does not scroll as the browser would.
      region.scrollTo({ top: 0 });
      await waitFor(() => expect(latest).toHaveAttribute("data-shown"));
    });
    await step("the key leads back and gives the focus to the conversation", async () => {
      await userEvent.tab();
      const key = canvas.getByRole("button", { name: "Neueste" });
      await expect(key).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(region).toHaveFocus();
      await expect(latest).not.toHaveAttribute("data-shown");
      await waitFor(() =>
        expect(region.scrollTop + region.clientHeight).toBeGreaterThanOrEqual(
          region.scrollHeight - 4,
        ),
      );
    });
  },
};

const PARAGRAPH =
  "Das Angebot an die Bäckerei Kornprobst umfasst eine neue Website mit einem Bestellformular für Torten und einer Seite für jede der drei Filialen. Zusammen kostet es 5.180 € netto.";

/**
 * A conversation that begins shorter than its box and whose answer grows at a press. In the
 * answer stand a fold (a step of a `Trace`) and the key of a menu, with the attributes a
 * `MenuTrigger` carries. The caller keeps a ref on the content.
 */
function Growing() {
  const [paragraphs, setParagraphs] = useState(1);
  const content = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col gap-4">
      <Button size="sm" className="self-start" onClick={() => setParagraphs((count) => count + 1)}>
        Antwort wächst
      </Button>
      <Frame>
        <Conversation className="flex-1">
          <ConversationContent ref={content} className="px-1 pb-6">
            <Message from="user">
              <MessageContent>{QUESTION}</MessageContent>
            </Message>
            <Message from="assistant">
              <MessageContent>
                {Array.from({ length: paragraphs }, (_, index) => (
                  <p key={index}>{PARAGRAPH}</p>
                ))}
              </MessageContent>
              <Trace>
                <TraceStep title="Angebot gelesen">
                  <p>Angebot 2026-0421 vom 12. November, drei Seiten.</p>
                  <p>Gültig bis zum 15. Dezember 2026.</p>
                </TraceStep>
              </Trace>
              <button type="button" aria-haspopup="menu" aria-expanded="false">
                Mehr
              </button>
            </Message>
          </ConversationContent>
          <ConversationLatest />
        </Conversation>
      </Frame>
    </div>
  );
}

/**
 * The view leaves the foot only when the reader goes somewhere: not for a wheel or a key that
 * asks for further up where everything is in view, and not for the key of a menu, which opens
 * nothing in the page. A fold that is opened keeps the reader with it; closed again, they are
 * back at the foot, and the view follows again.
 */
export const KeepsToFoot: Story = {
  render: () => <Growing />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const region = canvas.getByRole("region", { name: "Unterhaltung" });
    const latest = canvasElement.querySelector<HTMLElement>('[data-slot="conversation-latest"]')!;
    const grow = canvas.getByRole("button", { name: "Antwort wächst" });
    /**
     * The answer grows by a paragraph, and the view comes to rest at the foot without the key.
     * To rest, not only near: a press while the view still glides can make the browser move it.
     */
    const followsGrowth = async () => {
      const before = region.scrollHeight;
      await userEvent.click(grow);
      await waitFor(() => expect(region.scrollHeight).toBeGreaterThan(before));
      await waitFor(
        () =>
          expect(region.scrollTop + region.clientHeight).toBeGreaterThanOrEqual(
            region.scrollHeight - 1,
          ),
        { timeout: 3000 },
      );
      await expect(latest).not.toHaveAttribute("data-shown");
    };

    await step("with everything in view, a wheel or Home does not leave the foot", async () => {
      await expect(region.scrollHeight).toBeLessThanOrEqual(region.clientHeight);
      region.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, bubbles: true }));
      region.focus();
      await userEvent.keyboard("{Home}");
      for (let count = 0; count < 5; count += 1) await userEvent.click(grow);
      await waitFor(() => expect(region.scrollHeight).toBeGreaterThan(region.clientHeight + 40));
      await followsGrowth();
    });

    await step("the key of a menu is not a fold: the view still follows", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Mehr" }));
      await followsGrowth();
    });

    await step("a fold that is opened keeps the reader with it", async () => {
      await userEvent.click(canvas.getByRole("button", { name: /Angebot gelesen/ }));
      await waitFor(() => expect(latest).toHaveAttribute("data-shown"));
    });

    await step("closed again, the reader is back at the foot and the view follows", async () => {
      await userEvent.click(canvas.getByRole("button", { name: /Angebot gelesen/ }));
      await waitFor(() => expect(latest).not.toHaveAttribute("data-shown"));
      await followsGrowth();
    });
  },
};

/** Two answers with the same words, each finished at a press. */
function TwiceTheSame() {
  const [finished, setFinished] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <Button size="sm" className="self-start" onClick={() => setFinished((count) => count + 1)}>
        Antwort beenden
      </Button>
      <Frame>
        <Conversation className="flex-1">
          <ConversationContent className="px-1 pb-6">
            {[0, 1].map((index) => (
              <Message key={index} from="assistant" streaming={finished <= index}>
                <MessageContent>
                  <p>Ja, das Angebot gilt noch.</p>
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
        </Conversation>
      </Frame>
    </div>
  );
}

/**
 * A finished answer is said once to assistive tech. A second answer with the same words is
 * said as well: the region changes, though the words do not.
 */
export const SameAnswerTwice: Story = {
  render: () => <TwiceTheSame />,
  play: async ({ canvas, userEvent }) => {
    const said = canvas.getByRole("status");
    const finish = canvas.getByRole("button", { name: "Antwort beenden" });
    await expect(said).toBeEmptyDOMElement();
    await userEvent.click(finish);
    await waitFor(() => expect(said).toHaveTextContent("Ja, das Angebot gilt noch."));
    const first = said.textContent;
    await userEvent.click(finish);
    await waitFor(() => expect(said.textContent).not.toBe(first));
    await expect(said).toHaveTextContent("Ja, das Angebot gilt noch.");
  },
};
