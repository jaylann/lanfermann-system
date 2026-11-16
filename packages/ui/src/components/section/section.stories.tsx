import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "@/components/container/container";
import { Heading } from "@/components/heading/heading";
import { Separator } from "@/components/separator/separator";
import { Text } from "@/components/text/text";

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
        <Container className="flex flex-col items-start gap-4">
          <Separator variant="rule" className="mb-2" />
          <Heading id="ablauf" size="title" className="max-w-[44rem]">
            Drei Schritte, in dieser Reihenfolge.
          </Heading>
          <Text size="lg" className="max-w-[34rem] text-pretty">
            Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem
            ich liefere. Erst dann baue ich.
          </Text>
        </Container>
      </Section>
      <Section space="md" aria-labelledby="ergebnis">
        <Container className="flex flex-col items-start gap-4">
          <Separator variant="rule" className="mb-2" />
          <Heading id="ergebnis" size="title" className="max-w-[44rem]">
            Die Seite lädt jetzt in 0,9 Sekunden.
          </Heading>
          <Text size="lg" className="max-w-[34rem] text-pretty">
            Vorher waren es 4,1.
          </Text>
        </Container>
      </Section>
    </>
  ),
};
