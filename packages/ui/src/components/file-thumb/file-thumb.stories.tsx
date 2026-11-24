import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { kindOf } from "@/components/attachment/kinds";
import { Card } from "@/components/card/card";
import { FILES } from "@/components/file-tile/story-files";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import { useSelection } from "@/components/selection/use-selection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";

import { FileThumb } from "./file-thumb";

const meta = {
  title: "Components/FileThumb",
  component: FileThumb,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 640, height: 380 },
      motion: [{ name: "point", hover: '[data-slot="file-thumb"]', frames: 6 }],
    },
  },
} satisfies Meta<typeof FileThumb>;

export default meta;
type Story = StoryObj;

const ENTRIES = FILES.slice(0, 5);
const IDS = ENTRIES.map((entry) => entry.id);

/** A folder as rows; each row's picture is its key to choose it. */
function List({ initial = [] }: { initial?: string[] }) {
  const selection = useSelection({ ids: IDS, defaultSelected: initial });
  return (
    <Card className="max-w-xl">
      <Table aria-label="Dateien in blogs/building-gbar" {...selection.containerProps}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Name</TableHead>
            <TableHead numeric>Größe und Stand</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ENTRIES.map((entry) => (
            <TableRow
              key={entry.id}
              selected={selection.isSelected(entry.id)}
              {...selection.itemProps(entry.id)}
            >
              <TableCell className="w-full max-w-0">
                <span className="flex min-w-0 items-center gap-3 font-medium text-fg">
                  <FileThumb kind={kindOf(entry)} src={entry.src} />
                  <MiddleTruncate text={entry.name} />
                </span>
              </TableCell>
              <TableCell numeric>{entry.meta}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/** Nothing chosen: each row shows its picture or its kind; pointing at one shows the mark. */
export const Default: Story = { render: () => <List /> };

/** Something chosen: every row shows its mark, so more are chosen with a press each. */
export const Choosing: Story = { render: () => <List initial={["hero", "badge"]} /> };

/** A press on a row's mark adds it to what is chosen, and a second takes it away. */
export const Marking: Story = {
  render: () => <List initial={["hero"]} />,
  play: async ({ canvasElement, userEvent }) => {
    const marks = canvasElement.querySelectorAll<HTMLElement>('[data-slot="file-thumb-mark"]');
    const rows = canvasElement.querySelectorAll<HTMLElement>("tbody tr");
    const third = marks[2];
    if (!third) throw new Error("the story has no third row");
    await userEvent.click(third);
    await waitFor(() => expect(rows[2]).toHaveAttribute("data-selected"));
    await expect(rows[0]).toHaveAttribute("data-selected");
    await userEvent.click(third);
    await waitFor(() => expect(rows[2]).not.toHaveAttribute("data-selected"));
  },
};
