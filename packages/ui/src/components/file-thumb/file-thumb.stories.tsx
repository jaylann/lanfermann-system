import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { kindOf } from "@/components/attachment/kinds";
import { Card } from "@/components/card/card";
import { FILES, SEE_THROUGH } from "@/components/file-tile/story-files";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import { useSelection } from "@/components/selection/use-selection";
import { Skeleton, SkeletonGroup } from "@/components/skeleton/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/table/table";

import { FileThumb, FileThumbSkeleton } from "./file-thumb";

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

/**
 * Pictures that may be see-through lie on the quiet checker, so a dark mark shows on a dark well
 * and a light one on a light well. A picture that cannot be loaded gives way to its kind's symbol.
 */
export const SeeThrough: Story = {
  parameters: { visual: { viewport: { width: 640, height: 300 }, motion: [] } },
  render: () => (
    <Card className="max-w-xl">
      <Table aria-label="Logos">
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Name</TableHead>
            <TableHead numeric>Größe und Stand</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ...SEE_THROUGH.slice(0, 3),
            {
              id: "kaputt",
              name: "hero_alt.webp",
              type: "image/webp",
              src: "data:image/webp;base64,AAAA",
              meta: "0 KB · heute",
            },
          ].map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="w-full max-w-0">
                <span className="flex min-w-0 items-center gap-3 font-medium text-fg">
                  <FileThumb
                    kind={kindOf(entry)}
                    src={entry.src}
                    name={entry.name}
                    type={entry.type}
                  />
                  <MiddleTruncate text={entry.name} />
                </span>
              </TableCell>
              <TableCell numeric>{entry.meta}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

const WIDTHS = ["w-44", "w-32", "w-52", "w-36", "w-40"];

/** The list while it loads: a row's picture, its name and its facts, as shapes. */
function LoadingList() {
  return (
    <SkeletonGroup label="Die Dateien werden geladen.">
      <Card>
        <TableSkeleton>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Name</TableHead>
              <TableHead numeric className="max-sm:hidden">
                Größe und Stand
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WIDTHS.map((width) => (
              <TableRow key={width}>
                <TableCell className="w-full max-w-0">
                  <span className="flex min-w-0 items-center gap-3">
                    <FileThumbSkeleton />
                    <span className="flex min-w-0 flex-col">
                      <Skeleton className={`text-control ${width}`} />
                      {/* On a phone the facts stand under the name, as the loaded row has them. */}
                      <Skeleton className="w-24 text-sm sm:hidden" />
                    </span>
                  </span>
                </TableCell>
                <TableCell numeric className="max-sm:hidden">
                  <Skeleton className="ml-auto w-28" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableSkeleton>
      </Card>
    </SkeletonGroup>
  );
}

/**
 * A file list that is still loading. The table is a shape only (`TableSkeleton`): it is no
 * region, has no name and is no stop for the keyboard; the group says what is on its way.
 */
export const Loading: Story = {
  parameters: { visual: { viewport: { width: 640, height: 360 }, motion: [] } },
  render: () => <LoadingList />,
};

/** On a phone the row keeps its picture and name, with the facts as a second line. */
export const LoadingPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 400 }, motion: [] } },
  render: () => <LoadingList />,
};

/** As a test: nothing in the loading list takes the focus or is announced as a table. */
export const LoadingIsQuiet: Story = {
  render: () => <LoadingList />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("Die Dateien werden geladen.");
    await expect(canvas.queryByRole("region")).toBeNull();
    await expect(canvas.queryByRole("table")).toBeNull();
    await userEvent.tab();
    await expect(document.activeElement?.closest('[data-slot="skeleton-group"]')).toBeNull();
  },
};

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

/** As a test: on a touch screen the mark takes a press on the finger's target around it. */
export const MarkOnTouch: Story = {
  render: () => (
    <div data-pointer="coarse">
      <List />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector('[data-slot="file-thumb-mark"]');
    if (!mark) throw new Error("the row has no mark");
    const target = getComputedStyle(mark, "::after");
    await expect(target.content).not.toBe("none");
    await expect(target.width).toBe("44px");
    await expect(target.height).toBe("44px");
  },
};
