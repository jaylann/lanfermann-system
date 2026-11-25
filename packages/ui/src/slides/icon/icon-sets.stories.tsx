import {
  Database01Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  SquareLock02Icon,
  Timer01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Icon } from "./icon";
import { type IconGlyph, ICONS } from "./icons";

// A board for one decision, not a part: which pictures a slide carries before a title. The kit's
// decks use Phosphor Bold; the library's interface uses Hugeicons. The same slide three times, at
// the two sizes a deck uses most (40px beside a 48px title, 28px beside a 24px label).
//
// Not a doc comment on purpose: Storybook turns one above `meta` into a second `parameters` key
// (the docs description), and that key replaces `parameters: slideParameters`.
const meta = {
  title: "Lab/Slide icons",
  decorators: [onStage],
  parameters: slideParameters,
  tags: ["visual-skip"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Pair = { glyph: IconGlyph; huge: IconSvgElement };

const columns: (Pair & { title: string; text: string })[] = [
  {
    glyph: ICONS.lock,
    huge: SquareLock02Icon,
    title: "Daten bleiben hier.",
    text: "Das Modell läuft auf Ihrem Rechner, nichts geht an einen Dienst.",
  },
  {
    glyph: ICONS.database,
    huge: Database01Icon,
    title: "Ein Ort für alles.",
    text: "Angebote, Rechnungen und Notizen liegen in einer Datenbank.",
  },
  {
    glyph: ICONS.timer,
    huge: Timer01Icon,
    title: "Antwort in Sekunden.",
    text: "Eine Frage an die eigenen Unterlagen dauert kürzer als die Suche.",
  },
];

const routes: (Pair & { label: string })[] = [
  { glyph: ICONS.mail, huge: Mail01Icon, label: "E-Mail" },
  { glyph: ICONS.globe, huge: Globe02Icon, label: "Web" },
  { glyph: ICONS.pin, huge: Location01Icon, label: "Vor Ort" },
];

function Board({ set, draw }: { set: string; draw: (pair: Pair, size: number) => ReactNode }) {
  return (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>Drei Gründe für ein Modell im eigenen Haus.</Title>
      <Spacer />
      <div className="grid grid-cols-3 gap-16">
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-4 border-t-2 border-rule pt-6">
            <div className="flex items-center gap-4">
              {draw(column, 40)}
              <h3 className="text-slide-lead font-normal text-fg">{column.title}</h3>
            </div>
            <p className="text-slide-body text-fg-body">{column.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-16">
        {routes.map((route) => (
          <div key={route.label} className="flex items-center gap-3">
            {draw(route, 28)}
            <p className="text-slide-meta text-fg-muted">{route.label}</p>
          </div>
        ))}
      </div>
      <Source>{set}</Source>
    </Slide>
  );
}

/** The kit's set, as the decks are drawn today. */
export const PhosphorBold: Story = {
  render: () => (
    <Board
      set="Phosphor Bold, wie im Kit"
      draw={(pair, size) => <Icon icon={pair.glyph} size={size} />}
    />
  ),
};

/** The interface's set at its own stroke of 1.5px. */
export const Hugeicons: Story = {
  render: () => (
    <Board
      set="Hugeicons, Strich 1,5 px wie in der Oberfläche"
      draw={(pair, size) => (
        <HugeiconsIcon
          icon={pair.huge}
          size={size}
          strokeWidth={1.5}
          className="shrink-0 text-accent"
        />
      )}
    />
  ),
};

/** The interface's set with a heavier stroke, to stand beside 48px type. */
export const HugeiconsHeavy: Story = {
  render: () => (
    <Board
      set="Hugeicons, Strich 2 px"
      draw={(pair, size) => (
        <HugeiconsIcon
          icon={pair.huge}
          size={size}
          strokeWidth={2}
          className="shrink-0 text-accent"
        />
      )}
    />
  ),
};
