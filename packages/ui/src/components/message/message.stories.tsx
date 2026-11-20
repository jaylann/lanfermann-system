import { RefreshIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, spyOn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { CopyButton } from "@/components/copy-button/copy-button";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageError,
  MessageFeedback,
} from "./message";
import {
  afterWords,
  ANSWER_LENGTH,
  ANSWER_TEXT,
  answerUpTo,
  QUESTION,
  useArrivingAnswer,
} from "./story-answer";

const meta = {
  title: "Components/Message",
  component: Message,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 420 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const retried = fn();

/** The keys under a finished answer, as a product would put them. */
function Actions() {
  return (
    <MessageActions>
      <CopyButton text={ANSWER_TEXT} size="sm" copyLabel="Antwort kopieren" />
      <MessageFeedback />
      <MessageAction icon={RefreshIcon} iconMotion="turn" label="Noch einmal" onClick={retried} />
    </MessageActions>
  );
}

/**
 * An answer: prose on the page, read like a page, with its keys under it: copy, the verdict,
 * „Noch einmal“. No bubble and no avatar.
 */
export const Answer: Story = {
  parameters: {
    visual: {
      target: '[data-slot="message-feedback"] button',
      motion: [
        { name: "good", click: '[data-slot="message-feedback"] button', frames: 8 },
        { name: "copy", click: '[data-slot="copy-button"] button', frames: 8 },
        { name: "retry", click: '[data-slot="message-action"]', frames: 8 },
      ],
    },
  },
  render: () => (
    <Message from="assistant">
      <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
      <Actions />
    </Message>
  ),
};

/**
 * The person's own words, set off at the right on the ground's tint: the bubble of a `Quote`,
 * its tight corner towards the person.
 */
export const Question: Story = {
  parameters: { visual: { viewport: { width: 760, height: 160 } } },
  render: () => (
    <div className="flex flex-col">
      <Message from="user">
        <MessageContent>{QUESTION}</MessageContent>
      </Message>
    </div>
  ),
};

/** An answer that is being written, a step at a time: „Weiter“ lets the next words arrive. */
function Arriving() {
  const [count, setCount] = useState(() => afterWords(0, 14));
  const streaming = count < ANSWER_LENGTH;
  return (
    <div className="flex flex-col items-start gap-6">
      <Button
        size="sm"
        data-step="next"
        onClick={() => setCount((now) => afterWords(now, 7))}
        disabled={!streaming}
      >
        Weiter
      </Button>
      <Message from="assistant" streaming={streaming}>
        <MessageContent>{answerUpTo(count)}</MessageContent>
        <Actions />
      </Message>
    </div>
  );
}

/**
 * Text that arrives fades in a few words at a time; a burst is pressed into a quarter of a
 * second instead of queuing. The keys wait unseen until the answer is complete.
 */
export const Streaming: Story = {
  parameters: {
    visual: {
      viewport: { width: 760, height: 460 },
      target: '[data-step="next"]',
      motion: [{ name: "arrive", click: '[data-step="next"]', frames: 8 }],
    },
  },
  render: () => <Arriving />,
};

/** The answer arriving on its own, as from a model; „Noch einmal abspielen“ starts it over. */
function Played() {
  const { count, done, run } = useArrivingAnswer();
  return (
    <div className="flex flex-col items-start gap-6">
      <Button size="sm" onClick={run}>
        Noch einmal abspielen
      </Button>
      <Message from="assistant" streaming={!done}>
        <MessageContent>{answerUpTo(count)}</MessageContent>
        <Actions />
      </Message>
    </div>
  );
}

/** Played by a clock, to watch: not for the pictures. */
export const Playing: Story = {
  tags: ["visual-skip"],
  render: () => <Played />,
};

/** An answer that failed says what happened, and offers the next step in words. */
export const Failed: Story = {
  parameters: { visual: { viewport: { width: 760, height: 200 } } },
  render: () => (
    <Message from="assistant">
      <MessageContent>{answerUpTo(64)}</MessageContent>
      <MessageError onRetry={retried}>
        Die Antwort ist abgebrochen, weil die Verbindung unterbrochen wurde.
      </MessageError>
    </Message>
  ),
};

/** On a phone: the person's words take most of the width, the answer all of it. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 700 } } },
  render: () => (
    <div className="flex flex-col gap-8">
      <Message from="user">
        <MessageContent>{QUESTION}</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
        <Actions />
      </Message>
    </div>
  ),
};

/**
 * The keys under an answer, from the keyboard: copy puts the answer on the clipboard, the
 * verdict is one of two or none, and „Noch einmal“ asks again.
 */
export const Keyboard: Story = {
  render: () => (
    <Message from="assistant">
      <MessageContent>{answerUpTo(ANSWER_LENGTH)}</MessageContent>
      <Actions />
    </Message>
  ),
  play: async ({ canvas, userEvent, step }) => {
    retried.mockClear();
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await step("copy the answer", async () => {
        await userEvent.tab();
        const copy = canvas.getByRole("button", { name: "Antwort kopieren" });
        await expect(copy).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(write).toHaveBeenCalledWith(ANSWER_TEXT);
      });
      await step("a verdict is one of two, or none", async () => {
        await userEvent.tab();
        const good = canvas.getByRole("button", { name: "Gute Antwort" });
        const bad = canvas.getByRole("button", { name: "Schlechte Antwort" });
        await expect(good).toHaveFocus();
        await userEvent.keyboard(" ");
        await expect(good).toHaveAttribute("aria-pressed", "true");
        await userEvent.tab();
        await expect(bad).toHaveFocus();
        await userEvent.keyboard(" ");
        await expect(bad).toHaveAttribute("aria-pressed", "true");
        await expect(good).toHaveAttribute("aria-pressed", "false");
        await userEvent.keyboard(" ");
        await expect(bad).toHaveAttribute("aria-pressed", "false");
      });
      await step("ask again", async () => {
        await userEvent.tab();
        await expect(canvas.getByRole("button", { name: "Noch einmal" })).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await waitFor(() => expect(retried).toHaveBeenCalledOnce());
      });
    } finally {
      write.mockRestore();
    }
  },
};
