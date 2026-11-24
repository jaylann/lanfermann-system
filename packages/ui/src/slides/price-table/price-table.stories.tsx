import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { PriceTable } from "./price-table";
import { PriceTableExample } from "./price-table.example";

const meta = {
  title: "Slides/PriceTable",
  component: PriceTable,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof PriceTable>;

export default meta;
type Story = StoryObj;

/** An offer with VAT: two positions on 7, 2 and 3 columns, the totals on the five under the price. */
export const Default: Story = {
  render: () => <PriceTableExample />,
};

/** At step 1: the head and the first position stand from the start, the second position has appeared with its line, the totals keep their places unseen until step 2. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>Ein Festpreis, in zwei Schritten.</Title>
      <Spacer />
      <PriceTable
        items={[
          {
            title: "Neue Website",
            text: "Konzept, Gestaltung, Umsetzung, fünf Seiten",
            qty: "einmalig",
            price: "3.400,00 €",
          },
          {
            title: "Pflege und Hosting",
            text: "Updates, Sicherung, kleine Änderungen",
            qty: "12 Monate",
            price: "588,00 €",
            step: 1,
          },
        ]}
        totals={[
          ["Zwischensumme", "3.988,00 €", 2],
          ["Umsatzsteuer 19 %", "757,72 €", 2],
          ["Gesamt", "4.745,72 €", 2],
        ]}
      />
    </Slide>
  ),
};
