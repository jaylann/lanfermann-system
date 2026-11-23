import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { FileTile } from "@/components/file-tile/file-tile";
import {
  ARRIVING,
  FILES,
  FOLDERS,
  SEE_THROUGH,
  type StoryEntry,
} from "@/components/file-tile/story-files";

import { FileGrid, FileGridSection } from "./file-grid";

const meta = {
  title: "Components/FileGrid",
  component: FileGrid,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 960, height: 640 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const byName = (a: StoryEntry, b: StoryEntry) => a.name.localeCompare(b.name, "de");

function Folder({
  folders = FOLDERS,
  files = FILES,
  chosen = [],
}: {
  folders?: StoryEntry[];
  files?: StoryEntry[];
  chosen?: string[];
}) {
  return (
    <FileGrid aria-label="Dateien in blogs/building-gbar">
      <FileGridSection key="ordner" label="Ordner">
        {folders.map(({ id, ...folder }) => (
          <FileTile key={id} variant="folder" {...folder} selected={chosen.includes(id)} />
        ))}
      </FileGridSection>
      <FileGridSection key="dateien" label="Dateien">
        {files.map(({ id, ...file }) => (
          <FileTile key={id} {...file} selected={chosen.includes(id)} />
        ))}
      </FileGridSection>
    </FileGrid>
  );
}

/**
 * A folder as tiles: its folders first, compact, then its files, as many columns as fit. Every
 * section starts on a row of its own and shares the grid's columns.
 */
export const Default: Story = {
  render: () => <Folder />,
};

/** While anything is chosen, every tile shows its mark, so the next one is one press away. */
export const Chosen: Story = {
  render: () => <Folder chosen={["hero", "angebot", "badge"]} />,
};

/** On a phone two tiles stand side by side; a folder's name is cut in its middle. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 900 } } },
  render: () => <Folder />,
};

/** A narrow place takes the small tiles (`size="sm"`). */
export const Small: Story = {
  parameters: { visual: { viewport: { width: 620, height: 560 } } },
  render: () => (
    <FileGrid aria-label="Abzeichen" size="sm">
      <FileGridSection>
        {FILES.slice(0, 6).map(({ id, ...file }) => (
          <FileTile key={id} {...file} />
        ))}
      </FileGridSection>
    </FileGrid>
  ),
};

/**
 * A folder of logos: a mark for light pages, its `_dark` twin and a badge, see-through around
 * them, lie on the quiet checker; the photo beside them keeps the plain well.
 */
export const Logos: Story = {
  parameters: { visual: { viewport: { width: 960, height: 320 } } },
  render: () => (
    <FileGrid aria-label="Dateien in blogs/building-gbar/logos">
      <FileGridSection>
        {[...SEE_THROUGH, FILES[6]!].map(({ id, ...file }) => (
          <FileTile key={id} {...file} />
        ))}
      </FileGridSection>
    </FileGrid>
  ),
};

const SORTED = FILES.slice(0, 6).sort(byName);

/** Files come and go: a new one joins at its place in the order, one is taken away. */
function Changing() {
  const [files, setFiles] = useState(SORTED);
  const arriving = files.some(({ id }) => id === ARRIVING.id);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <Button
          size="sm"
          data-step="add"
          onClick={() =>
            setFiles((all) =>
              all.some(({ id }) => id === ARRIVING.id) ? all : [...all, ARRIVING].sort(byName),
            )
          }
        >
          Hochladen
        </Button>
        <Button
          size="sm"
          variant="quiet"
          data-step="remove"
          onClick={() => setFiles((all) => all.filter(({ id }) => id !== "badge"))}
        >
          badge_neu.webp löschen
        </Button>
        <Button size="sm" variant="quiet" data-step="reset" onClick={() => setFiles(SORTED)}>
          Zurücksetzen
        </Button>
      </div>
      <FileGrid aria-label="Dateien in blogs/building-gbar">
        <FileGridSection key="dateien" label="Dateien">
          {files.map(({ id, ...file }) => (
            <FileTile
              key={id}
              {...file}
              status={id === ARRIVING.id && arriving ? "uploading" : "done"}
              progress={0.42}
            />
          ))}
        </FileGridSection>
      </FileGrid>
    </div>
  );
}

/**
 * What is there on load stands still. A file that joins fades in at its place while the tiles
 * after it glide aside; one that is taken away fades, and the rest glide into its place.
 */
export const Arriving: Story = {
  parameters: {
    visual: {
      viewport: { width: 760, height: 620 },
      motion: [
        { name: "join", click: '[data-step="add"]', frames: 8 },
        { name: "leave", click: '[data-step="remove"]', frames: 10 },
      ],
    },
  },
  render: () => <Changing />,
};

const report = fn();

/** The grid measures its columns and says how many it has: on load and when it is resized. */
export const Columns: Story = {
  render: () => (
    <div className="w-[34rem]" data-testid="frame">
      <FileGrid aria-label="Dateien" onColumnsChange={report}>
        <FileGridSection>
          {FILES.slice(0, 4).map(({ id, ...file }) => (
            <FileTile key={id} {...file} />
          ))}
        </FileGridSection>
      </FileGrid>
    </div>
  ),
  play: async ({ canvas, step }) => {
    const grid = canvas.getByRole("grid", { name: "Dateien" });
    await step("34rem hold three tiles of at least 10rem", async () => {
      await waitFor(() => expect(report).toHaveBeenLastCalledWith(3));
      await expect(grid).toHaveAttribute("data-columns", "3");
    });
    await step("narrowed, it says the new count", async () => {
      canvas.getByTestId("frame").style.width = "22rem";
      await waitFor(() => expect(report).toHaveBeenLastCalledWith(2));
    });
  },
};
