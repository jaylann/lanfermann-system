import type { Meta, StoryObj } from "@storybook/react-vite";

import { Deck } from "@/slides/deck/deck";
import { ICONS } from "@/slides/icon/icons";
import { Slide, type SlideGround } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, deckParameters, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Scene, type SceneProps } from "./scene";
import { SceneExample } from "./scene.example";

// One large diagram, a camera that moves over it beat by beat. `Default` is the example as every
// still shows it (its last beat); the three `Beat` stories are its clicks, one by one; the
// shared world walks two slides through one world, the second continuing where the first ended.
//
// What moves (the camera, arrivals, drawing wires, the march of a loop) moves only where a slide
// is presented; these captures are stills.
//
// The stage is a decorator of each story, not of the meta: the shared world stacks two slides,
// which a stage would crop. In a story's list the first decorator is the innermost, so a step
// stands inside the stage.
const meta = {
  title: "Slides/Scene",
  component: Scene,
  parameters: slideParameters,
} satisfies Meta<typeof Scene>;

export default meta;
type Story = StoryObj;

/** The example at its last beat, as a plain deck, the print and the check show it: the loop that brings the next customer, the world zoomed out to blocks. */
export const Default: Story = {
  render: () => <SceneExample />,
  decorators: [onStage],
};

/** The first click: the whole way, zoomed out until the nodes are blocks under their groups' labels. */
export const BeatOne: Story = {
  render: () => <SceneExample />,
  decorators: [atStep(0, 2), onStage],
};

/** The second click: the camera on the group „Anfrage“ at full size, two nodes standing out and the rest dimmed. */
export const BeatTwo: Story = {
  render: () => <SceneExample />,
  decorators: [atStep(1, 2), onStage],
};

/** The third click: back to the whole way, the loop's nodes in the accent and its wires dashed. */
export const BeatThree: Story = {
  render: () => <SceneExample />,
  decorators: [atStep(2, 2), onStage],
};

// What happens to an inquiry behind the website, shared by two slides.
const postweg: SceneProps["world"] = {
  nodes: [
    {
      id: "kunde",
      label: "Kundin",
      detail: "vom Handy, abends",
      icon: ICONS.users,
      tone: "quiet",
      col: 1,
      row: 1,
    },
    {
      id: "seite",
      label: "Leistungsseite",
      detail: "Dachrinne reinigen",
      icon: ICONS.browser,
      col: 2,
      row: 1,
    },
    {
      id: "formular",
      label: "Formular",
      detail: "Name, Ort, Wunsch",
      icon: ICONS.pencil,
      col: 2,
      row: 2,
    },
    { id: "postfach", label: "Postfach", detail: "des Betriebs", icon: ICONS.mail, col: 3, row: 1 },
    {
      id: "filter",
      label: "Filter",
      detail: "Spam bleibt draußen",
      icon: ICONS.filter,
      col: 3,
      row: 2,
    },
    {
      id: "aufgabe",
      label: "Aufgabe",
      detail: "für morgen 8 Uhr",
      icon: ICONS.checklist,
      col: 4,
      row: 1,
    },
    {
      id: "rueckruf",
      label: "Rückruf",
      detail: "vor der Baustelle",
      icon: ICONS.call,
      col: 5,
      row: 1,
    },
    {
      id: "termin",
      label: "Besichtigung",
      detail: "am Freitag",
      icon: ICONS.calendar,
      col: 6,
      row: 1,
    },
    {
      id: "absage",
      label: "Absage",
      detail: "freundlich, mit Grund",
      icon: ICONS.chat,
      tone: "ghost",
      col: 6,
      row: 2,
    },
    {
      id: "angebot",
      label: "Angebot",
      detail: "aus der Vorlage",
      icon: ICONS.file,
      tone: "solid",
      col: 7,
      row: 1,
    },
  ],
  groups: [
    { id: "web", label: "Auf der Website", nodes: ["kunde", "seite", "formular"] },
    { id: "post", label: "Über Nacht", nodes: ["postfach", "filter", "aufgabe"] },
    {
      id: "morgen",
      label: "Am nächsten Morgen",
      nodes: ["rueckruf", "termin", "absage", "angebot"],
    },
  ],
  wires: [
    { from: "kunde", to: "seite" },
    { from: "seite", to: "formular" },
    { from: "formular", to: "postfach" },
    { from: "postfach", to: "filter" },
    { from: "postfach", to: "aufgabe" },
    { from: "aufgabe", to: "rueckruf" },
    { from: "rueckruf", to: "termin" },
    { from: "rueckruf", to: "absage", dashed: true },
    { from: "termin", to: "angebot" },
  ],
};

/** The first slide on the shared world: the evening. */
function Abends({
  world = postweg,
  ground = "ink",
}: {
  world?: SceneProps["world"];
  ground?: SlideGround;
}) {
  return (
    <Slide ground={ground} deck="Der digitale Handschlag" page={11}>
      <Title>Die Anfrage kommt abends, gelesen wird sie morgens.</Title>
      <Spacer />
      <Scene
        alt="Eine Kundin füllt abends auf der Leistungsseite das Formular aus; über Nacht landet die Anfrage im Postfach, der Filter hält Spam fern, und sie wird zur Aufgabe für den nächsten Morgen."
        world={world}
        beats={[
          {
            view: "web",
            caption: (
              <>
                <b>Abends um neun</b> füllt eine Kundin das Formular auf dem Handy aus.
              </>
            ),
          },
          {
            view: ["web", "post"],
            show: ["postfach", "filter", "aufgabe"],
            highlight: ["formular", "postfach", "aufgabe"],
            caption: (
              <>
                <b>Über Nacht</b> landet sie im Postfach und wird zur Aufgabe für den Morgen.
              </>
            ),
          },
        ]}
      />
    </Slide>
  );
}

/** The second slide: it starts where the first ended (`from`), and the camera travels on. */
function Morgens() {
  return (
    <Slide ground="ink" deck="Der digitale Handschlag" page={12}>
      <Title>Am Morgen danach steht der Termin.</Title>
      <Spacer />
      <Scene
        alt="Am nächsten Morgen ruft der Betrieb vor der ersten Baustelle zurück, vereinbart eine Besichtigung am Freitag oder sagt freundlich ab; nach der Besichtigung folgt das Angebot aus der Vorlage."
        world={postweg}
        from={["web", "post"]}
        beats={[
          {
            view: "morgen",
            highlight: ["rueckruf"],
            caption: (
              <>
                <b>Um acht</b> ruft der Meister zurück, bevor er auf die Baustelle fährt.
              </>
            ),
          },
          {
            show: ["termin", "angebot"],
            highlight: ["rueckruf", "termin", "angebot"],
            caption: (
              <>
                <b>Am Freitag</b> sieht er sich das Dach an, das Angebot geht am selben Abend raus.
              </>
            ),
          },
          {
            view: "all",
            caption: (
              <>
                <b>Ein Abend, zwei Tage:</b> Vom Formular bis zum Angebot geht keine Anfrage
                verloren.
              </>
            ),
          },
        ]}
      />
    </Slide>
  );
}

/** Two slides on one world, each at its last beat: the first ends on the evening's two groups, the second starts there and ends on the whole way. */
export const SharedWorld: Story = {
  parameters: deckParameters(2),
  render: () => (
    <Deck title="Der digitale Handschlag">
      <Abends />
      <Morgens />
    </Deck>
  ),
};

/** The second slide at its first beat: zoomed onto the morning's group; the dashed wire is what happens only sometimes. */
export const SharedWorldMorning: Story = {
  render: () => <Morgens />,
  decorators: [atStep(0, 2), onStage],
  // Not in the baseline: the dimmed dashed curve is drawn one colour step lighter or darker in
  // three pixels from one run to the next (four runs in the pinned container, two of each).
  // The story tests still draw it.
  parameters: { ...slideParameters, visual: { ...slideParameters.visual, skip: true } },
};

/** The first slide on Paper at its last beat: the same tokens hold on every ground. */
export const Paper: Story = {
  render: () => <Abends ground="paper" />,
  decorators: [atStep(1, 1), onStage],
};

/** The same beat with right-angled wires (`route: "elbow"`), to set beside the curves of `Paper`. */
export const Elbow: Story = {
  render: () => <Abends ground="paper" world={{ ...postweg, route: "elbow" }} />,
  decorators: [atStep(1, 1), onStage],
};
