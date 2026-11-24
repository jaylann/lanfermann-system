import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Table } from "./table";
import { TableExample } from "./table.example";

const meta = {
  title: "Slides/Table",
  component: Table,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj;

/** A measured table across twelve columns: a numeric column, a mono column, one cell in the accent. */
export const Default: Story = {
  render: () => <TableExample />,
};

/** At step 1: the head and the first row stand from the start, the second row has appeared with its line, the row with the accent keeps its place unseen until the last click. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>Ihre Seite lädt im Viertel am langsamsten.</Title>
      <Spacer />
      <Table
        highlight={[2, "load"]}
        rowSteps={[0, 1, 2]}
        columns={[
          { key: "name", label: "Betrieb", span: 5 },
          { key: "load", label: "Ladezeit", span: 3, numeric: true },
          { key: "reviews", label: "Google-Bewertungen", span: 4, numeric: true },
        ]}
        rows={[
          { name: "Schreinerei am Markt", load: "1,8 s", reviews: "112" },
          { name: "Tischlerei Nord", load: "2,4 s", reviews: "64" },
          { name: "Ihr Betrieb", load: "7,1 s", reviews: "9" },
        ]}
      />
      <Source>Messung vom 11.11.2026, Startseite auf dem Smartphone im Mobilfunknetz</Source>
    </Slide>
  ),
};
