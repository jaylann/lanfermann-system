import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Tiers } from "./tiers";
import { TiersExample } from "./tiers.example";

const meta = {
  title: "Slides/Tiers",
  component: Tiers,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Tiers>;

export default meta;
type Story = StoryObj;

/** Three offers as ruled columns: name, price at 72px, what is included; one price in the accent. */
export const Default: Story = {
  render: () => <TiersExample />,
};

/** At step 1, building from the smallest offer: the first tier stands from the start, the recommended one has appeared with its rule, the third keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Drei Wege, je nachdem, wo Sie stehen.</Title>
      <Spacer />
      <Tiers
        items={[
          {
            name: "Auffrischung",
            price: "1.900 €",
            unit: "einmalig",
            text: "Ihre Seite bleibt, sie wird schnell und mobil.",
            includes: [
              "Ladezeit und Mobilansicht",
              "Telefon und Anfrage im Kopf",
              "Google-Profil eingerichtet",
            ],
          },
          {
            name: "Neue Website",
            price: "3.400 €",
            unit: "einmalig",
            text: "Meine Empfehlung für die meisten Betriebe.",
            recommended: true,
            includes: [
              "Alles aus der Auffrischung",
              "Neue Gestaltung, fünf Seiten",
              "Texte und Fotos vor Ort",
            ],
            step: 1,
          },
          {
            name: "Website mit Abläufen",
            price: "5.800 €",
            unit: "einmalig",
            text: "Wenn Anfragen heute auf Zetteln landen.",
            includes: [
              "Alles aus der neuen Website",
              "Terminanfrage mit Kalender",
              "Angebote aus einer Vorlage",
            ],
            step: 2,
          },
        ]}
      />
    </Slide>
  ),
};
