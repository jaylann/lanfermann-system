import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "@/components/container/container";
import { Heading } from "@/components/heading/heading";
import { Section } from "@/components/section/section";
import { Text } from "@/components/text/text";

import { Seam } from "./seam";

const meta = {
  title: "Components/Seam",
  component: Seam,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 560 }, clip: "viewport" },
  },
} satisfies Meta<typeof Seam>;

export default meta;
type Story = StoryObj<typeof meta>;

type Face = "ground" | "well";
const faceClass: Record<Face, string> = { ground: "bg-ground", well: "bg-well" };

/** What a part of the page says: its title and a lead under it, set left. */
function Opening({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <Container className="flex flex-col items-start gap-4">
      <Heading id={id} size="title" className="max-w-[44rem]">
        {title}
      </Heading>
      <Text size="lg" className="max-w-[34rem] text-pretty">
        {lead}
      </Text>
    </Container>
  );
}

function Steps({ face }: { face: Face }) {
  return (
    <Section space="md" aria-labelledby="ablauf" className={faceClass[face]}>
      <Opening
        id="ablauf"
        title="Drei Schritte, in dieser Reihenfolge."
        lead="Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem ich liefere. Erst dann baue ich."
      />
    </Section>
  );
}

function Result({ face }: { face: Face }) {
  return (
    <Section aria-labelledby="ergebnis" className={faceClass[face]}>
      <Opening
        id="ergebnis"
        title="Die Seite lädt jetzt in 0,9 Sekunden."
        lead="Vorher waren es 4,1."
      />
    </Section>
  );
}

/** A third part with a name of its own: two sections of one page may not share a title. */
function Invoice({ face }: { face: Face }) {
  return (
    <Section aria-labelledby="rechnung" className={faceClass[face]}>
      <Opening
        id="rechnung"
        title="Die Rechnung kommt nach der Abnahme."
        lead="Vorher zahlst du nichts."
      />
    </Section>
  );
}

/** The plate above dips into the part below and throws a short shadow onto it. */
export const Default: Story = {
  render: () => (
    <>
      <Steps face="ground" />
      <Seam above="ground" below="well" />
      <Result face="well" />
    </>
  ),
};

/** The other way round: the plate above has a notch, and the part below rises into it. */
export const Up: Story = {
  render: () => (
    <>
      <Steps face="well" />
      <Seam direction="up" above="well" below="ground" />
      <Result face="ground" />
    </>
  ),
};

/** Three parts, alternating ground and well, one seam down and one up. */
export const Page: Story = {
  parameters: { visual: { viewport: { width: 1290, height: 900 } } },
  render: () => (
    <>
      <Steps face="ground" />
      <Seam above="ground" below="well" />
      <Result face="well" />
      <Seam direction="up" above="well" below="ground" />
      <Invoice face="ground" />
    </>
  ),
};
