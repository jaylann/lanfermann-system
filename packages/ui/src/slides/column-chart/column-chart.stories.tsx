import type { Meta, StoryObj } from "@storybook/react-vite";

import { span } from "@/slides/lib/grid";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { ColumnChart } from "./column-chart";
import { ColumnChartExample } from "./column-chart.example";

const meta = {
  title: "Slides/ColumnChart",
  component: ColumnChart,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof ColumnChart>;

export default meta;
type Story = StoryObj;

/** Six months on one baseline across twelve columns: the value above each column, the month below, the last in the accent. */
export const Default: Story = {
  render: () => <ColumnChartExample />,
};

/** Two series in two groups on eight columns: „vorher“ in the line tone, „nachher“ in the accent or the text colour, the group's name under its baseline. */
export const Groups: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>
        Der Zuwachs kommt vom Smartphone,
        <br />
        nicht vom Schreibtisch.
      </Title>
      <Spacer />
      <ColumnChart
        height={320}
        width={span(8)}
        groups={[
          {
            label: "Smartphone",
            items: [
              { label: "vorher", value: 6 },
              { label: "nachher", value: 21, highlight: true },
            ],
          },
          {
            label: "Desktop",
            items: [
              { label: "vorher", value: 9 },
              { label: "nachher", value: 11, strong: true },
            ],
          },
        ]}
      />
      <Source>
        Anfragen über das Kontaktformular, je drei Monate vor und nach dem Relaunch am 1.8.2026,
        Schreinerei Mustermann
      </Source>
    </Slide>
  ),
};
