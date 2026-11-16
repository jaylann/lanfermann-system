import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "@/components/container/container";
import { PageHeader, PageHeaderLead, PageHeaderTitle } from "@/components/page-header/page-header";

import { Section } from "./section";

const meta = {
  title: "Components/Section",
  component: Section,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 620 }, clip: "viewport" },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two parts of a page. Each is named by its title and opens under a rule. */
export const Default: Story = {
  render: () => (
    <>
      <Section aria-labelledby="ablauf">
        <Container>
          <PageHeader rule>
            <PageHeaderTitle id="ablauf">Drei Schritte, in dieser Reihenfolge.</PageHeaderTitle>
            <PageHeaderLead>
              Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem
              ich liefere. Erst dann baue ich.
            </PageHeaderLead>
          </PageHeader>
        </Container>
      </Section>
      <Section space="md" aria-labelledby="ergebnis">
        <Container>
          <PageHeader rule>
            <PageHeaderTitle id="ergebnis">Die Seite lädt jetzt in 0,9 Sekunden.</PageHeaderTitle>
            <PageHeaderLead>Vorher waren es 4,1.</PageHeaderLead>
          </PageHeader>
        </Container>
      </Section>
    </>
  ),
};
