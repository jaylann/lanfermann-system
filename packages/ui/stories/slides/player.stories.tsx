import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect } from "react";
import { expect } from "storybook/test";

import { Body, Deck, Slide, Title } from "@/slides";
import { Player, type PlayerProps } from "@/slides/player";
import { Step } from "@/slides/step/step";

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

function player(props: Omit<PlayerProps, "deck"> & { deck?: PlayerProps["deck"] }) {
  // `embed={false}`: a story stands in Storybook's frame, and shows the player as it stands alone.
  return <Player deck={handschlag} hash={false} embed={false} now={now} {...props} />;
}

// A short deck whose middle slide builds its point in two steps: the first line stands, the
// second and third appear click by click.
const stepped = (
  <Deck title="Der digitale Handschlag">
    <Slide id="suche" notes="Kurz fragen, wer heute schon etwas gegoogelt hat.">
      <Title>Jeder Auftrag beginnt mit einer Suche.</Title>
      <Body>Bevor jemand anruft, hat er Ihren Namen schon einmal eingetippt.</Body>
    </Slide>
    <Slide
      id="weg"
      notes="Erst das Profil. Klick: der Rückruf. Klick: der Termin. Bei jedem Schritt eine Pause."
    >
      <Title>So wird aus einer Suche ein Termin.</Title>
      <Body>Ein Kunde findet Ihr Google-Profil und liest drei Bewertungen.</Body>
      <Step at={1}>
        <Body>Er schreibt eine Anfrage, und Sie rufen noch am selben Tag zurück.</Body>
      </Step>
      <Step at={2}>
        <Body>Am Telefon vereinbaren Sie einen Termin für die nächste Woche.</Body>
      </Step>
    </Slide>
    <Slide
      id="angebot"
      notes="Das Angebot ist der Moment, in dem die Website ihre Arbeit getan hat."
    >
      <Title>Das Angebot schicken Sie am Morgen danach.</Title>
    </Slide>
  </Deck>
);

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

/** A slide with steps at its first step: the first two lines stand, the third keeps its place. */
export const AudienceAtStep: Story = {
  parameters: {
    visual: { viewport: { width: 1280, height: 720 }, clip: "viewport", grounds: ["paper"] },
  },
  render: () => (
    <Awake>{player({ deck: stepped, mode: "audience", start: { index: 1, step: 1 } })}</Awake>
  ),
};

/**
 * The console at the first of two steps: the head says the step, and the preview is the same
 * slide one step on.
 */
export const PresenterAtStep: Story = {
  render: () =>
    player({ deck: stepped, mode: "presenter", start: { index: 1, step: 1, startedAt: STARTED } }),
};

/** The console walks a slide's steps before it leaves it, and comes back to its last step. */
export const PresenterSteps: Story = {
  render: () => player({ deck: stepped, mode: "presenter" }),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const stepLine = () => canvasElement.querySelector('[data-slot="player-step"]');
    const shownStep = () =>
      canvasElement
        .querySelector('[data-slot="player-console-current"] [data-slides-step]')
        ?.getAttribute("data-slides-step");
    const current = () =>
      canvasElement.querySelector('[data-slot="player-console-current"] [data-slot="slide"]');

    await step("a slide without steps says none", async () => {
      await expect(canvas.getByRole("heading", { name: "Folie 1 von 3" })).toBeVisible();
      await expect(stepLine()).toBeNull();
      await expect(canvas.getByRole("heading", { name: "Nächste Folie" })).toBeVisible();
    });

    await step("ArrowRight walks the steps, and the preview shows the next one", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(
        canvas.getByRole("heading", { name: "Folie 2 von 3 Schritt 0 von 2" }),
      ).toBeVisible();
      await expect(canvas.getByRole("heading", { name: "Nächster Schritt" })).toBeVisible();
      const slide = current();
      await userEvent.keyboard("{ArrowRight}");
      await expect(stepLine()).toHaveTextContent("Schritt 1 von 2");
      await expect(shownStep()).toBe("1");
      // A step reveals; the slide is not drawn anew.
      await expect(current()).toBe(slide);
      await userEvent.keyboard("{ArrowRight}");
      await expect(stepLine()).toHaveTextContent("Schritt 2 von 2");
      await expect(canvas.getByRole("heading", { name: "Nächste Folie" })).toBeVisible();
    });

    await step("after the last step comes the next slide, and back is the last step", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("heading", { name: "Folie 3 von 3" })).toBeVisible();
      await expect(stepLine()).toBeNull();
      await userEvent.keyboard("{ArrowLeft}");
      await expect(
        canvas.getByRole("heading", { name: "Folie 2 von 3 Schritt 2 von 2" }),
      ).toBeVisible();
      await expect(shownStep()).toBe("2");
    });
  },
};

/** The audience's window walks the same steps; its counter stays on the slide meanwhile. */
export const AudienceSteps: Story = {
  render: () => player({ deck: stepped, mode: "audience" }),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const shownStep = () =>
      canvasElement.querySelector("[data-slides-step]")?.getAttribute("data-slides-step");
    const slide = () => canvasElement.querySelector('[data-slot="stage"] [data-slot="slide"]');

    await step("ArrowRight walks the steps of the second slide", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByText("Folie 2 von 3, Schritt 0 von 2")).toBeInTheDocument();
      const before = slide();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByText("Folie 2 von 3, Schritt 1 von 2")).toBeInTheDocument();
      await expect(canvas.getByText("2 / 3")).toBeInTheDocument();
      await expect(shownStep()).toBe("1");
      await expect(slide()).toBe(before);
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByText("Folie 3 von 3")).toBeInTheDocument();
      await expect(slide()).not.toBe(before);
    });

    await step("ArrowLeft goes back into the slide at its last step", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await expect(canvas.getByText("Folie 2 von 3, Schritt 2 von 2")).toBeInTheDocument();
      await expect(shownStep()).toBe("2");
    });
  },
};
