import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Link } from "@/components/link/link";

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "./accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { visual: { viewport: { width: 600, height: 420 } } },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

function Questions() {
  return (
    <>
      <AccordionItem value="preis">
        <AccordionTrigger>Was kostet eine Website?</AccordionTrigger>
        <AccordionPanel>
          Eine Seite für einen Handwerksbetrieb kostet einmalig 2.780 €. Darin sind Texte, Fotos vom
          Betrieb und das Google-Profil enthalten.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="dauer">
        <AccordionTrigger>Wie lange dauert es, bis die Seite online ist?</AccordionTrigger>
        <AccordionPanel>
          In der Regel vier Wochen nach dem ersten Gespräch. Den Termin legen wir gemeinsam fest und
          halten ihn im <Link href="#angebot">Angebot</Link> fest.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="pflege">
        <AccordionTrigger>Kann ich Texte und Fotos später selbst ändern?</AccordionTrigger>
        <AccordionPanel>
          Ja. Öffnungszeiten, Preise und Bilder ändern Sie selbst. Für alles andere genügt eine
          E-Mail.
        </AccordionPanel>
      </AccordionItem>
    </>
  );
}

/**
 * One answer at a time. Hairlines open the block and divide the rows. The row under the pointer
 * is washed and the lines beside it step aside. An open row rests unmarked; pointed at, its
 * question's wash squares its lower corners and runs on, fainter, behind the answer. The chevron
 * turns, the answer grows to its height and unfolds.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
      motion: [
        {
          name: "point",
          hover: '[data-slot="accordion-item"]:nth-child(3) [data-slot="accordion-trigger"]',
          frames: 4,
        },
        {
          name: "point-open",
          hover: '[data-slot="accordion-item"]:nth-child(1) [data-slot="accordion-trigger"]',
          frames: 4,
        },
        {
          name: "open",
          click: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
          frames: 8,
        },
        {
          name: "close",
          click: '[data-slot="accordion-item"]:nth-child(1) [data-slot="accordion-trigger"]',
          frames: 6,
        },
      ],
    },
  },
  render: () => (
    // A fixed height, so the block does not move on the page while its rows open and close.
    <div className="h-[260px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Accordion defaultValue={["preis"]}>
        <Questions />
      </Accordion>
    </div>
  ),
};

/**
 * `quiet`: no wash under the pointer. The lines stay and only the chevron answers, darkening and
 * leaning the way it points. For a page where the accordion should recede.
 */
export const Quiet: Story = {
  parameters: {
    visual: {
      target: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
    },
  },
  render: () => (
    <div className="h-[260px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Accordion quiet defaultValue={["preis"]}>
        <Questions />
      </Accordion>
    </div>
  ),
};

/** `multiple`: several rows stay open, for sections that are read side by side. */
export const Multiple: Story = {
  render: () => (
    <Accordion
      multiple
      defaultValue={["preis", "pflege"]}
      className="w-[520px] max-w-[calc(100vw-2rem)]"
    >
      <Questions />
    </Accordion>
  ),
};

/** A row that cannot be opened yet keeps its place and goes quiet. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 600, height: 300 } } },
  render: () => (
    <Accordion defaultValue={["preis"]} className="w-[520px] max-w-[calc(100vw-2rem)]">
      <AccordionItem value="preis">
        <AccordionTrigger>Was kostet eine Website?</AccordionTrigger>
        <AccordionPanel>
          Eine Seite für einen Handwerksbetrieb kostet einmalig 2.780 €.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="shop" disabled>
        <AccordionTrigger>Was kostet ein Onlineshop?</AccordionTrigger>
        <AccordionPanel>Das Angebot für Shops folgt im Frühjahr.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

/** At phone width a long question wraps and the chevron stays on its first line. */
export const Narrow: Story = {
  parameters: { visual: { viewport: { width: 390, height: 460 } } },
  render: () => (
    <Accordion defaultValue={["dauer"]} className="w-full">
      <Questions />
    </Accordion>
  ),
};

/**
 * The keyboard path, as a test: every row is a Tab stop, Enter and Space open and close, opening
 * one row closes the other, and Tab walks into an open answer.
 */
export const Keyboard: Story = {
  render: Default.render,
  play: async ({ canvas, userEvent, step }) => {
    const row = (name: RegExp) => canvas.getByRole("button", { name });

    await step("Tab lands on the first row, which is open", async () => {
      await userEvent.tab();
      await expect(row(/Was kostet/)).toHaveFocus();
      await expect(row(/Was kostet/)).toHaveAttribute("aria-expanded", "true");
    });

    await step("Tab moves to the next row, Enter opens it and closes the first", async () => {
      await userEvent.tab();
      await expect(row(/Wie lange/)).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(row(/Wie lange/)).toHaveAttribute("aria-expanded", "true");
      await expect(row(/Was kostet/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.getByText(/In der Regel vier Wochen/)).toBeVisible());
    });

    await step("Tab walks into the open answer", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Angebot" })).toHaveFocus();
    });

    await step("Space closes the row again", async () => {
      await userEvent.tab({ shift: true });
      await userEvent.keyboard(" ");
      await expect(row(/Wie lange/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.queryByText(/In der Regel vier Wochen/)).toBeNull());
    });
  },
};
