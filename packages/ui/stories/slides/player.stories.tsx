import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect } from "react";
import { expect } from "storybook/test";

import { Player, type PlayerProps } from "@/slides/player";

import { handschlag } from "./story-handschlag";

// The player with the sample deck: what the audience sees, and the presenter's console. Each
// story is the whole window, as the player is the page. (No doc comment here: see
// .claude/rules/slides.md.)
//
// The clock stands still (`now`), the address is left alone (`hash`), and no story opens a
// window: a picture of the console has to be the same picture every time.
const meta = {
  title: "Slides/Player",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1440, height: 900 }, clip: "viewport", grounds: ["paper"] },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// 24.11.2026, 14:32 in Munich; the talk began 12 minutes and 5 seconds earlier.
const NOW = Date.UTC(2026, 10, 24, 13, 32, 0);
const STARTED = NOW - 725_000;
const now = () => NOW;

function player(props: Omit<PlayerProps, "deck">) {
  return <Player deck={handschlag} hash={false} now={now} {...props} />;
}

/**
 * Keeps the audience's controls in the picture: they leave after 2.5 seconds without input, and
 * a capture has none.
 */
function Awake({ children }: { children: ReactNode }) {
  useEffect(() => {
    const id = window.setInterval(() => window.dispatchEvent(new Event("pointermove")), 500);
    return () => window.clearInterval(id);
  }, []);
  return children;
}

/** What the audience sees: the slide fills the window, the controls stand at the top right. */
export const Audience: Story = {
  parameters: {
    visual: { viewport: { width: 1280, height: 720 }, clip: "viewport", grounds: ["paper"] },
  },
  render: () => (
    <Awake>{player({ mode: "audience", start: { index: 1 }, pdf: "handschlag.pdf" })}</Awake>
  ),
};

/** The console on the third slide, twelve minutes into the talk. */
export const Presenter: Story = {
  render: () => player({ mode: "presenter", start: { index: 2, startedAt: STARTED } }),
};

/** The grid of all slides, open over the console; the current slide is marked. */
export const PresenterGrid: Story = {
  render: () => player({ mode: "presenter", start: { index: 2, startedAt: STARTED, grid: true } }),
};

/** The audience's screen is black. The console keeps the slide and says so. */
export const Blackout: Story = {
  render: () =>
    player({ mode: "presenter", start: { index: 2, startedAt: STARTED, blackout: true } }),
};

/** After the last slide the console says „Ende“ where the next one stood. */
export const PresenterEnd: Story = {
  render: () => player({ mode: "presenter", start: { index: 9, startedAt: STARTED } }),
};

/** The keys of the console: the arrows and Home and End step, G opens the grid, B is black. */
export const Keyboard: Story = {
  render: () => player({ mode: "presenter" }),
  play: async ({ canvas, userEvent, step }) => {
    const grid = canvas.getByRole("button", { name: /Übersicht/ });
    const black = canvas.getByRole("button", { name: /Schwarz/ });

    await step("the arrows step, End and Home go to the ends", async () => {
      await expect(canvas.getByRole("heading", { name: "Folie 1 von 10" })).toBeVisible();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("heading", { name: "Folie 2 von 10" })).toBeVisible();
      await userEvent.keyboard("{End}");
      await expect(canvas.getByRole("heading", { name: "Folie 10 von 10" })).toBeVisible();
      await expect(canvas.getByText("Ende")).toBeVisible();
      await userEvent.keyboard("{Home}");
      await expect(canvas.getByRole("heading", { name: "Folie 1 von 10" })).toBeVisible();
    });

    await step("G opens the grid on the current slide, Escape closes it", async () => {
      await userEvent.keyboard("g");
      const dialog = canvas.getByRole("dialog", { name: "Übersicht" });
      await expect(dialog).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Folie 1", current: true })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("button", { name: "Folie 2" })).toHaveFocus();
      await userEvent.keyboard("{Escape}");
      await expect(dialog).not.toBeInTheDocument();
      await expect(grid).toHaveFocus();
      // The arrow moved the focus in the grid, not the deck.
      await expect(canvas.getByRole("heading", { name: "Folie 1 von 10" })).toBeVisible();
    });

    await step("a tile of the grid jumps to its slide", async () => {
      await userEvent.keyboard("g");
      await userEvent.click(canvas.getByRole("button", { name: "Folie 5" }));
      await expect(canvas.getByRole("heading", { name: "Folie 5 von 10" })).toBeVisible();
      await expect(grid).toHaveFocus();
    });

    await step("B turns the audience's screen black, and a step ends it", async () => {
      await userEvent.keyboard("b");
      await expect(black).toHaveAttribute("aria-pressed", "true");
      await expect(canvas.getByText("Das Publikum sieht Schwarz")).toBeVisible();
      await userEvent.keyboard("{ArrowRight}");
      await expect(black).toHaveAttribute("aria-pressed", "false");
      await expect(canvas.getByRole("heading", { name: "Folie 6 von 10" })).toBeVisible();
    });
  },
};

/** The keys of the audience's window: it steps, and B replaces the slide by black. */
export const AudienceKeyboard: Story = {
  render: () => player({ mode: "audience" }),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("PageDown and PageUp step, as a clicker sends them", async () => {
      await expect(canvas.getByText("Folie 1 von 10")).toBeInTheDocument();
      await userEvent.keyboard("{PageDown}");
      await userEvent.keyboard("{PageDown}");
      await expect(canvas.getByText("Folie 3 von 10")).toBeInTheDocument();
      await userEvent.keyboard("{PageUp}");
      await expect(canvas.getByText("Folie 2 von 10")).toBeInTheDocument();
    });

    await step("the window around the slide takes the slide's ground", async () => {
      const root = canvasElement.querySelector('[data-slot="player"]');
      await expect(root).toHaveAttribute("data-slide-ground", "paper");
      await userEvent.keyboard("{Home}");
      await expect(root).toHaveAttribute("data-slide-ground", "ink");
    });

    await step("B shows black instead of the slide, Escape brings it back", async () => {
      await userEvent.keyboard("b");
      await expect(canvas.getByRole("img", { name: "Schwarzer Bildschirm" })).toBeVisible();
      await expect(canvasElement.querySelector('[data-slot="slide"]')).toBeNull();
      await userEvent.keyboard("{Escape}");
      await expect(canvasElement.querySelector('[data-slot="slide"]')).not.toBeNull();
    });
  },
};
