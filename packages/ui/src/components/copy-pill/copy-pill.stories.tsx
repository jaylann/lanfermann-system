import {
  AiChat02Icon,
  BrowserIcon,
  CommandLineIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Icon } from "@/components/icon/icon";

import { CopyPill, CopyPillMark } from "./copy-pill";

const PROMPT = [
  "Richte das Kundenportal für mich ein.",
  "",
  "1. Lies die Anleitung unter portal.example/einrichten.",
  "2. Frag mich nach dem Zugangsschlüssel und schreib ihn nie in eine Datei im Repository.",
  "3. Prüf die Verbindung und sag mir, was sie meldet.",
].join("\n");

// An array, not a fragment: the pill counts its direct children.
const marks = [
  <CopyPillMark key="chat">
    <Icon icon={AiChat02Icon} />
  </CopyPillMark>,
  <CopyPillMark key="terminal">
    <Icon icon={CommandLineIcon} />
  </CopyPillMark>,
  <CopyPillMark key="editor">
    <Icon icon={SourceCodeIcon} />
  </CopyPillMark>,
  <CopyPillMark key="browser">
    <Icon icon={BrowserIcon} />
  </CopyPillMark>,
];

const meta = {
  title: "Components/CopyPill",
  component: CopyPill,
  args: {
    text: PROMPT,
    preview: "Richte das Kundenportal für mich ein …",
    label: "Prompt kopieren",
    copied: "Prompt kopiert.",
    // Still captures need the marks to stand; `Turning` shows them take turns.
    turnEvery: false,
    children: marks,
  },
  parameters: { visual: { viewport: { width: 720, height: 130 } } },
} satisfies Meta<typeof CopyPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A prompt to hand to an agent. Under the pointer the stack closes, the trough shows the first
 * line of what will be copied, and the key keeps only its symbol.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="copy-pill-button"]',
      motion: [{ name: "open", hover: '[data-slot="copy-pill-button"]', frames: 10 }],
    },
  },
};

/** `lg` where the pill is the main action of a view; `md` everywhere else. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 720, height: 200 } } },
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <CopyPill {...args} size="md" />
      <CopyPill {...args} size="lg" label="Befehl kopieren" copied="Befehl kopiert." />
    </div>
  ),
};

/** Without a preview the pill stays closed: for a narrow column. */
export const Closed: Story = {
  args: { preview: undefined },
  parameters: { visual: { target: '[data-slot="copy-pill-button"]' } },
};

/**
 * The marks take turns: the one on top goes to the back, stretched a little by its own speed,
 * and the others close up one after another. Not captured: a still says nothing about it.
 */
export const Turning: Story = {
  args: { turnEvery: 2 },
  parameters: { visual: { skip: true } },
};

/**
 * The whole pill is one button. With the focus on it, it opens at once and its description is the
 * first line of the text; Enter and Space copy all of it, and a status says so.
 */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const writeText = fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const pill = canvas.getByRole("button", { name: "Prompt kopieren" });
    const status = canvas.getByRole("status");

    await step("Tab lands on the pill, which says what it will copy", async () => {
      await userEvent.tab();
      await expect(pill).toHaveFocus();
      await expect(pill).toHaveAccessibleDescription("Richte das Kundenportal für mich ein …");
      // The keyboard opens it at once; a pointer has to rest on it first.
      await waitFor(() => expect(pill).toHaveAttribute("data-open"));
      await expect(status).toBeEmptyDOMElement();
    });

    await step("Enter copies the whole text and a status says so", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(PROMPT));
      await waitFor(() => expect(status).toHaveTextContent("Prompt kopiert."));
    });

    await step("Space copies again and the focus stays on the pill", async () => {
      await userEvent.keyboard(" ");
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
      await expect(pill).toHaveFocus();
    });
  },
};

const focused = fn();
const blurred = fn();
const pillRef = createRef<HTMLButtonElement>();

/**
 * A caller's own `ref`, `onFocus` and `onBlur`, as a test: they are served beside the pill's, so
 * the pill still opens under the keyboard and still measures its words.
 */
export const CallerHandlers: Story = {
  render: (args) => <CopyPill {...args} ref={pillRef} onFocus={focused} onBlur={blurred} />,
  play: async ({ canvas, userEvent }) => {
    focused.mockClear();
    blurred.mockClear();
    const pill = canvas.getByRole("button", { name: "Prompt kopieren" });
    await expect(pillRef.current).toBe(pill);
    await expect(pill.style.getPropertyValue("--words")).toMatch(/px$/);

    await userEvent.tab();
    await expect(pill).toHaveFocus();
    await expect(focused).toHaveBeenCalledOnce();
    await waitFor(() => expect(pill).toHaveAttribute("data-open"));

    await userEvent.tab();
    await expect(blurred).toHaveBeenCalledOnce();
    await waitFor(() => expect(pill).not.toHaveAttribute("data-open"));
  },
};
