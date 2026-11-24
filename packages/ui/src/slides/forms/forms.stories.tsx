import type { Meta, StoryObj } from "@storybook/react-vite";

import { Body } from "@/slides/body/body";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Forms } from "./forms";
import { FormsExample } from "./forms.example";

const meta = {
  title: "Slides/Forms",
  component: Forms,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Forms>;

export default meta;
type Story = StoryObj<typeof Forms>;

/** `corner` on Paper: a quarter disc, tone on tone, for a content slide whose evidence starts low. */
export const Default: Story = {
  render: () => <FormsExample />,
};

/** `rise` on Ink, the cover's: a quarter rising from the bottom right, a half hanging from the top. */
export const Rise: Story = {
  render: () => (
    <Slide ground="ink" footer={false} gap={48}>
      <Forms name="rise" />
      <Spacer />
      <Title size="cover">
        Der digitale
        <br />
        Handschlag.
      </Title>
      <Lead>
        Warum Ihre nächsten 100 Kunden Sie googeln,
        <br />
        bevor Sie sie je treffen.
      </Lead>
    </Slide>
  ),
};

/**
 * `edge` on Ink, a statement's: an indigo half disc on the right edge. On Paper it is tone on
 * tone (`Slides/Title`).
 */
export const Edge: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={6}>
      <Forms name="edge" />
      <Title size="statement">
        Vertrauen entsteht,
        <br />
        bevor das Telefon klingelt.
      </Title>
      <Spacer />
    </Slide>
  ),
};

/** `set` on Indigo, the closing slide's: an ink quarter in the corner with a disc below it. */
export const ClosingSet: Story = {
  name: "Set",
  render: () => (
    <Slide ground="indigo" footer={false} gap={48}>
      <Forms name="set" />
      <Spacer />
      <Title size="cover">
        Eine kostenlose
        <br />
        Analyse.
      </Title>
      <Lead>
        Ich schaue mir an, was Sie haben, was die Konkurrenz macht
        <br />
        und wo die Lücken sind. Unverbindlich.
      </Lead>
    </Slide>
  ),
};

/** `arc` on Ink, a section opener's: a quarter ring around the corner with a disc in its hollow. */
export const Arc: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={7}>
      <Forms name="arc" />
      <Spacer />
      <Title size="statement">Was Ihre Website über Sie sagt.</Title>
      <Lead>
        Drei Betriebe aus Ihrer Nachbarschaft,
        <br />
        mit den Augen eines Kunden gesehen.
      </Lead>
    </Slide>
  ),
};

/**
 * `halo` on Ink, a second statement's: a half ring on the right edge with a disc nested in it.
 * On Paper it is tone on tone (`Slides/Body`).
 */
export const Halo: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={14}>
      <Forms name="halo" />
      <Title size="statement">
        Eine Seite, die lädt,
        <br />
        ist schon die halbe Miete.
      </Title>
      <Spacer />
    </Slide>
  ),
};

/** `orbit` on Ink: two thin rings around the top right corner, a disc riding on each. */
export const Orbit: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={15}>
      <Forms name="orbit" />
      <Spacer />
      <Title size="statement">Wie es weitergeht.</Title>
      <Lead>
        Vier Wochen von der Analyse
        <br />
        bis zur neuen Seite.
      </Lead>
    </Slide>
  ),
};

/** `drop` on Ink: a half ring hanging from the top edge, for a cover with a long title line. */
export const Drop: Story = {
  render: () => (
    <Slide ground="ink" footer={false} gap={48}>
      <Forms name="drop" />
      <Spacer />
      <Title size="cover">
        Was kleine Modelle
        <br />
        wirklich können.
      </Title>
      <Lead>
        Wie ein kleines Sprachmodell lernt,
        <br />
        auf dem Gerät zuverlässig Aktionen auszuführen.
      </Lead>
    </Slide>
  ),
};

/** `bend` on Paper: a quarter ring in the corner, in turn with `corner` on content slides. */
export const Bend: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={3}>
      <Forms name="bend" />
      <Title>
        Der erste Eindruck entsteht online,
        <br />
        und er entsteht schnell.
      </Title>
      <Spacer />
      <Body>0,05 Sekunden genügen für ein erstes Urteil über eine Website.</Body>
      <Source>Quelle: Lindgaard et al., Behaviour &amp; Information Technology 2006</Source>
    </Slide>
  ),
};
