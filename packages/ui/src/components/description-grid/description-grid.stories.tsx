import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card, CardContent } from "@/components/card/card";

import { DescriptionGrid, DescriptionGridItem } from "./description-grid";

const meta = {
  title: "Components/DescriptionGrid",
  component: DescriptionGrid,
  parameters: { visual: { viewport: { width: 420, height: 260 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The facts of a file in a pane: short values two to a row, a long one across the row. */
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <DescriptionGrid>
          <DescriptionGridItem term="Art">PDF-Dokument</DescriptionGridItem>
          <DescriptionGridItem term="Größe" className="tabular-nums">
            1,2 MB
          </DescriptionGridItem>
          <DescriptionGridItem term="Seiten" className="tabular-nums">
            4
          </DescriptionGridItem>
          <DescriptionGridItem term="Geändert">31. März</DescriptionGridItem>
          <DescriptionGridItem term="Im Browser" className="col-span-2">
            Öffnet sich im Browser, statt heruntergeladen zu werden.
          </DescriptionGridItem>
        </DescriptionGrid>
      </CardContent>
    </Card>
  ),
};
