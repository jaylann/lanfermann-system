import {
  Agreement01Icon,
  BrainIcon,
  BrowserIcon,
  BubbleChatIcon,
  Calendar03Icon,
  Call02Icon,
  ChartColumnIcon,
  CheckListIcon,
  CheckmarkBadge01Icon,
  ChipIcon,
  Clock01Icon,
  CloudIcon,
  Database01Icon,
  EuroIcon,
  File01Icon,
  FilterIcon,
  Folder01Icon,
  Globe02Icon,
  HierarchyIcon,
  Image01Icon,
  Key01Icon,
  Location01Icon,
  Mail01Icon,
  Mic01Icon,
  PackageIcon,
  PencilEdit01Icon,
  PlayIcon,
  RepeatIcon,
  Robot01Icon,
  RulerIcon,
  Search01Icon,
  Settings01Icon,
  Shield01Icon,
  SlidersHorizontalIcon,
  SmartPhone01Icon,
  SourceCodeIcon,
  SquareLock02Icon,
  StarIcon,
  Store01Icon,
  Target02Icon,
  TestTube01Icon,
  Tick02Icon,
  Timer01Icon,
  UserGroupIcon,
  Wrench01Icon,
  ZapIcon,
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
import { type IconName, ICONS } from "./icons";

// A board for one decision, not a part: which pictures a slide carries before a title. The kit's
// decks use Phosphor Bold; the library's interface uses Hugeicons. `SideBySide` sets the three
// candidates next to each other at the two sizes a deck uses most (40px beside a 48px title,
// 28px beside a 24px label), `AllPictograms` every picture of the kit in all three, and the last
// three stories show one whole slide in each.
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

/** The Hugeicons picture that says what each of the kit's pictograms says. */
const huge: Record<IconName, IconSvgElement> = {
  users: UserGroupIcon,
  tools: Wrench01Icon,
  lock: SquareLock02Icon,
  gear: Settings01Icon,
  database: Database01Icon,
  code: SourceCodeIcon,
  chat: BubbleChatIcon,
  lightning: ZapIcon,
  cloud: CloudIcon,
  key: Key01Icon,
  globe: Globe02Icon,
  clock: Clock01Icon,
  file: File01Icon,
  folder: Folder01Icon,
  phone: SmartPhone01Icon,
  browser: BrowserIcon,
  chip: ChipIcon,
  shield: Shield01Icon,
  robot: Robot01Icon,
  microphone: Mic01Icon,
  target: Target02Icon,
  play: PlayIcon,
  chart: ChartColumnIcon,
  check: Tick02Icon,
  filter: FilterIcon,
  search: Search01Icon,
  mail: Mail01Icon,
  pin: Location01Icon,
  timer: Timer01Icon,
  flask: TestTube01Icon,
  tree: HierarchyIcon,
  seal: CheckmarkBadge01Icon,
  ruler: RulerIcon,
  package: PackageIcon,
  cycle: RepeatIcon,
  brain: BrainIcon,
  sliders: SlidersHorizontalIcon,
  checklist: CheckListIcon,
  call: Call02Icon,
  calendar: Calendar03Icon,
  euro: EuroIcon,
  image: Image01Icon,
  pencil: PencilEdit01Icon,
  handshake: Agreement01Icon,
  shop: Store01Icon,
  star: StarIcon,
};

type Draw = (name: IconName, size: number) => ReactNode;

const phosphor: Draw = (name, size) => <Icon icon={ICONS[name]} size={size} />;

function hugeAt(strokeWidth: number): Draw {
  return function drawHuge(name, size) {
    return (
      <HugeiconsIcon
        icon={huge[name]}
        size={size}
        strokeWidth={strokeWidth}
        className="shrink-0 text-accent"
      />
    );
  };
}

const sets: { label: string; note: string; draw: Draw }[] = [
  { label: "Phosphor Bold", note: "wie im Kit", draw: phosphor },
  { label: "Hugeicons 1,5 px", note: "wie in der Oberfläche", draw: hugeAt(1.5) },
  { label: "Hugeicons 2 px", note: "kräftiger, für große Schrift", draw: hugeAt(2) },
];

const heads: { name: IconName; title: string }[] = [
  { name: "lock", title: "Daten bleiben hier." },
  { name: "database", title: "Ein Ort für alles." },
  { name: "timer", title: "Antwort in Sekunden." },
  { name: "handshake", title: "Ein Ansprechpartner." },
];

const routes: { name: IconName; label: string }[] = [
  { name: "mail", label: "E-Mail" },
  { name: "globe", label: "Web" },
  { name: "pin", label: "Vor Ort" },
];

/**
 * The three candidates in one slide, a column each: the same four headings with a 40px picture
 * and the same three labels with a 28px one.
 */
export const SideBySide: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>Dieselben Zeilen, drei Bildsätze.</Title>
      <Spacer />
      <div className="grid grid-cols-3 gap-16">
        {sets.map((set) => (
          <div key={set.label} className="flex flex-col gap-6 border-t-2 border-rule pt-6">
            <p className="text-slide-meta text-fg-muted">
              <span className="font-semibold text-fg">{set.label}</span>, {set.note}
            </p>
            <div className="flex flex-col gap-4">
              {heads.map((head) => (
                <div key={head.name} className="flex items-center gap-4">
                  {set.draw(head.name, 40)}
                  <h3 className="text-slide-lead font-normal text-fg">{head.title}</h3>
                </div>
              ))}
            </div>
            <div className="flex gap-8 border-t border-line pt-6">
              {routes.map((route) => (
                <div key={route.name} className="flex items-center gap-3">
                  {set.draw(route.name, 28)}
                  <p className="text-slide-meta text-fg-muted">{route.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Slide>
  ),
};

/**
 * Every pictogram of the kit at 40px: Phosphor Bold on the left, then its Hugeicons counterpart
 * at 1.5px and at 2px.
 */
export const AllPictograms: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={7} gap={48}>
      <Title>46 Piktogramme, je dreimal.</Title>
      <div className="grid grid-cols-8 gap-x-16 gap-y-8">
        {(Object.keys(ICONS) as IconName[]).map((name) => (
          <div key={name} className="flex flex-col gap-2">
            <div className="flex gap-4">
              {sets.map((set) => (
                <span key={set.label} className="flex">
                  {set.draw(name, 40)}
                </span>
              ))}
            </div>
            <p className="text-slide-meta text-fg-muted">{ICONS[name].name}</p>
          </div>
        ))}
      </div>
      <Source>Links Phosphor Bold, Mitte Hugeicons 1,5 px, rechts Hugeicons 2 px</Source>
    </Slide>
  ),
};

function Board({ set, draw }: { set: string; draw: Draw }) {
  return (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>Drei Gründe für ein Modell im eigenen Haus.</Title>
      <Spacer />
      <div className="grid grid-cols-3 gap-16">
        {heads.slice(0, 3).map((head, index) => (
          <div key={head.name} className="flex flex-col gap-4 border-t-2 border-rule pt-6">
            <div className="flex items-center gap-4">
              {draw(head.name, 40)}
              <h3 className="text-slide-lead font-normal text-fg">{head.title}</h3>
            </div>
            <p className="text-slide-body text-fg-body">
              {
                [
                  "Das Modell läuft auf Ihrem Rechner, nichts geht an einen Dienst.",
                  "Angebote, Rechnungen und Notizen liegen in einer Datenbank.",
                  "Eine Frage an die eigenen Unterlagen dauert kürzer als die Suche.",
                ][index]
              }
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-16">
        {routes.map((route) => (
          <div key={route.name} className="flex items-center gap-3">
            {draw(route.name, 28)}
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
  render: () => <Board set="Phosphor Bold, wie im Kit" draw={phosphor} />,
};

/** The interface's set at its own stroke of 1.5px. */
export const Hugeicons: Story = {
  render: () => <Board set="Hugeicons, Strich 1,5 px wie in der Oberfläche" draw={hugeAt(1.5)} />,
};

/** The interface's set with a heavier stroke, to stand beside 48px type. */
export const HugeiconsHeavy: Story = {
  render: () => <Board set="Hugeicons, Strich 2 px" draw={hugeAt(2)} />,
};
