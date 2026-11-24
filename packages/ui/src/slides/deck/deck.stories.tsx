import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide, type SlideGround } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { deckParameters } from "@/slides/story-slide";

import { Deck } from "./deck";

const meta = {
  title: "Slides/Deck",
  component: Deck,
  parameters: deckParameters(3),
} satisfies Meta<typeof Deck>;

export default meta;
type Story = StoryObj<typeof meta>;

const findings = [
  ["Die Telefonnummer fehlt im Kopf.", "Wer mobil sucht, will sofort anrufen."],
  ["Das Startbild lädt unkomprimiert.", "Auf dem Smartphone bleibt die Seite lange leer."],
  ["Kein Weg zur Terminanfrage.", "Es gibt kein Formular und keine Öffnungszeiten."],
];

/** Three slides of one deck on one ground: a claim, a figure with its source, a ruled list. */
function ThreeSlides({ ground }: { ground: SlideGround }) {
  return (
    <Deck title="Der digitale Handschlag">
      <Slide id="vertrauen" ground={ground}>
        <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
          Vertrauen entsteht,
          <br />
          bevor das Telefon klingelt.
        </h2>
        <Spacer />
      </Slide>
      <Slide id="recherche" ground={ground}>
        <h2 className="slide-span-10 text-slide-title font-medium text-fg">
          Fast alle Kunden lesen Bewertungen,
          <br />
          bevor sie einen Betrieb anrufen.
        </h2>
        <Spacer />
        <div className="flex items-baseline gap-4">
          <p className="text-slide-figure font-medium text-accent">96</p>
          <p className="text-slide-statement leading-none text-fg">%</p>
        </div>
        <p className="slide-span-6">der Befragten lesen Bewertungen lokaler Betriebe.</p>
        <p className="slide-span-7 border-t border-line pt-4 text-slide-meta text-fg-muted">
          Quelle: BrightLocal, Local Consumer Review Survey 2024
        </p>
      </Slide>
      <Slide id="befunde" ground={ground}>
        <h2 className="slide-span-10 text-slide-title font-medium text-fg">
          Drei Stellen kosten Sie heute Anfragen.
        </h2>
        <Spacer />
        <ul className="flex flex-col">
          {findings.map(([finding, cost]) => (
            <li
              key={finding}
              className="grid grid-cols-2 gap-16 border-t border-line py-6 first:border-t-2 first:border-rule"
            >
              <p className="font-semibold text-fg">{finding}</p>
              <p className="text-fg-muted">{cost}</p>
            </li>
          ))}
        </ul>
        <p className="text-slide-meta text-fg-muted">
          Analyse vom 11.11.2026, Smartphone und Desktop
        </p>
      </Slide>
    </Deck>
  );
}

/** Evidence. Drawn in light and in dark mode: the two captures have to be the same picture. */
export const Paper: Story = {
  args: { title: "Der digitale Handschlag", children: null },
  render: () => <ThreeSlides ground="paper" />,
  parameters: {
    visual: { ...deckParameters(3).visual, grounds: ["paper", "dark"] },
  },
};

/** Someone else's words. */
export const Tint: Story = {
  args: { title: "Der digitale Handschlag", children: null },
  render: () => <ThreeSlides ground="tint" />,
};

/** The claim. */
export const Ink: Story = {
  args: { title: "Der digitale Handschlag", children: null },
  render: () => <ThreeSlides ground="ink" />,
};

/** The ask: the accent is white here, so nothing is highlighted. */
export const Indigo: Story = {
  args: { title: "Der digitale Handschlag", children: null },
  render: () => <ThreeSlides ground="indigo" />,
};
