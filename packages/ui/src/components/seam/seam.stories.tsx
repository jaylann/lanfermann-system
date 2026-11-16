import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "@/components/container/container";
import { PageHeader, PageHeaderLead, PageHeaderTitle } from "@/components/page-header/page-header";
import { Section } from "@/components/section/section";

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

function Steps({ face }: { face: Face }) {
  return (
    <Section space="md" aria-labelledby="ablauf" className={faceClass[face]}>
      <Container>
        <PageHeader>
          <PageHeaderTitle id="ablauf">Drei Schritte, in dieser Reihenfolge.</PageHeaderTitle>
          <PageHeaderLead>
            Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem
            ich liefere. Erst dann baue ich.
          </PageHeaderLead>
        </PageHeader>
      </Container>
    </Section>
  );
}

function Result({ face, id = "ergebnis" }: { face: Face; id?: string }) {
  return (
    <Section aria-labelledby={id} className={faceClass[face]}>
      <Container>
        <PageHeader>
          <PageHeaderTitle id={id}>Die Seite lädt jetzt in 0,9 Sekunden.</PageHeaderTitle>
          <PageHeaderLead>Vorher waren es 4,1.</PageHeaderLead>
        </PageHeader>
      </Container>
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
      <Result face="ground" id="danach" />
    </>
  ),
};
