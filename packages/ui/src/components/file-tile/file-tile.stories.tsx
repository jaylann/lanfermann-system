import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";

import { FileTile, type FileTileStatus } from "./file-tile";
import { ARRIVING, FILES, FOLDERS, SEE_THROUGH } from "./story-files";

const meta = {
  title: "Components/FileTile",
  component: FileTile,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 820, height: 340 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Tiles stand in a `FileGrid`; alone in a story they take a tile's width. */
function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(4,11rem)] gap-3">{children}</div>;
}

/**
 * A picture shows itself on the well, contained; a file without one carries the symbol of its
 * kind. Under each, the name cut in its middle and the facts in one line.
 */
export const Default: Story = {
  render: () => (
    <Row>
      {[FILES[0]!, FILES[3]!, FILES[4]!, FILES[5]!].map(({ id, ...file }) => (
        <FileTile key={id} {...file} />
      ))}
    </Row>
  ),
};

/** Chosen: the accent edge and the closed mark. Under the pointer the mark shows as a ring. */
export const Chosen: Story = {
  parameters: { visual: { target: '[data-slot="file-tile"]:not([data-selected])' } },
  render: () => (
    <Row>
      {FILES.slice(0, 3).map(({ id, ...file }, index) => (
        <FileTile key={id} {...file} selected={index === 1} />
      ))}
    </Row>
  ),
};

/** A long name is cut in its middle, so its end and the extension stay. */
export const LongName: Story = {
  parameters: { visual: { viewport: { width: 640, height: 320 } } },
  render: () => (
    <Row>
      <FileTile {...FILES[6]!} />
      <FileTile name="Seminarplan_Wintersemester_2026_Gruppe_B_endgueltig.pdf" meta="96 KB" />
    </Row>
  ),
};

/** A folder is a compact tile: its symbol before its name, what it holds at the end. */
export const Folders: Story = {
  parameters: { visual: { viewport: { width: 820, height: 200 } } },
  render: () => (
    <Row>
      {FOLDERS.map(({ id, ...folder }, index) => (
        <FileTile key={id} variant="folder" {...folder} selected={index === 2} />
      ))}
    </Row>
  ),
};

/** Files hang over a folder that would take them: it wears the field's halo. */
export const DropTarget: Story = {
  parameters: { visual: { viewport: { width: 820, height: 340 } } },
  render: () => (
    <Row>
      <FileTile variant="folder" {...FOLDERS[0]!} dropOver />
      <FileTile variant="folder" {...FOLDERS[1]!} />
    </Row>
  ),
};

/**
 * A picture that may be see-through (here an SVG for a light page, its `_dark` twin, a PNG
 * badge and a 32px favicon) lies on the quiet checker, behind the picture only, so the black
 * mark shows in the dark and the white one in the light. The favicon keeps its own size.
 */
export const Transparent: Story = {
  render: () => (
    <Row>
      {SEE_THROUGH.map(({ id, ...file }) => (
        <FileTile key={id} {...file} />
      ))}
    </Row>
  ),
};

/** A tile's picture element, the box the checker is drawn on. */
function pictureOf(tile: Element | undefined): HTMLElement | null {
  return tile?.querySelector<HTMLElement>('[data-slot="file-tile-picture"]') ?? null;
}

/** What stands behind a tile's picture, as the browser computed it. */
function backdropOf(tile: Element | undefined): string | undefined {
  const picture = pictureOf(tile);
  return picture ? getComputedStyle(picture).backgroundImage : undefined;
}

/** The checker goes by the file's format: under an SVG and a PNG, never under a JPEG. */
export const CheckerByFormat: Story = {
  render: () => (
    <Row>
      {[SEE_THROUGH[0]!, SEE_THROUGH[2]!, FILES[6]!].map(({ id, ...file }) => (
        <FileTile key={id} {...file} />
      ))}
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const [svg, png, jpeg] = canvasElement.querySelectorAll('[data-slot="file-tile"]');
    await expect(backdropOf(svg)).toContain("conic-gradient");
    await expect(backdropOf(png)).toContain("conic-gradient");
    await expect(backdropOf(jpeg)).toBe("none");
  },
};

/** The size a tile's loaded picture is drawn at, and the size of the well it stands in. */
async function drawnSize(tile: Element | undefined) {
  const picture = pictureOf(tile);
  await waitFor(() => expect(picture).toHaveAttribute("data-loaded"));
  const box = picture?.getBoundingClientRect();
  const well = picture?.parentElement?.getBoundingClientRect();
  return {
    width: box?.width ?? 0,
    height: box?.height ?? 0,
    wellWidth: well?.width ?? 0,
    wellHeight: well?.height ?? 0,
  };
}

/**
 * The picture's box is the picture as it is drawn, so the checker never reaches the well beside
 * it: a square badge is a square inside the wider well, a wide picture spans the well's width
 * only, and a 32px favicon stays 32px instead of filling the tile.
 */
export const PictureBox: Story = {
  render: () => (
    <Row>
      {[SEE_THROUGH[2]!, SEE_THROUGH[3]!, FILES[0]!].map(({ id, ...file }) => (
        <FileTile key={id} {...file} />
      ))}
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const [badge, favicon, wide] = canvasElement.querySelectorAll('[data-slot="file-tile"]');

    const square = await drawnSize(badge);
    await expect(Math.abs(square.width - square.height)).toBeLessThanOrEqual(1);
    await expect(Math.abs(square.height - square.wellHeight)).toBeLessThanOrEqual(1);
    await expect(square.width).toBeLessThan(square.wellWidth - 20);

    const small = await drawnSize(favicon);
    await expect(small.width).toBe(32);
    await expect(small.height).toBe(32);

    const hero = await drawnSize(wide);
    await expect(Math.abs(hero.width - hero.wellWidth)).toBeLessThanOrEqual(1);
    await expect(hero.height).toBeLessThan(hero.wellHeight - 10);
  },
};

/** A picture that cannot be loaded gives its place to the symbol of its kind. */
export const BrokenPicture: Story = {
  render: () => (
    <Row>
      <FileTile
        name="hero_alt.webp"
        type="image/webp"
        src="data:image/webp;base64,AAAA"
        meta="96 KB · gestern"
      />
    </Row>
  ),
};

/** On its way, then arrived or failed: the buttons switch the tile's state. */
function Arriving({ start }: { start: FileTileStatus }) {
  const [status, setStatus] = useState<FileTileStatus>(start);
  const [progress, setProgress] = useState(0.42);
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          data-step="more"
          onClick={() => setProgress((was) => Math.min(1, was + 0.3))}
        >
          Weiter
        </Button>
        <Button size="sm" data-step="finish" onClick={() => setStatus("done")}>
          Fertig
        </Button>
        <Button size="sm" variant="quiet" data-step="fail" onClick={() => setStatus("error")}>
          Abbrechen
        </Button>
      </div>
      <Row>
        <FileTile
          {...ARRIVING}
          meta={status === "done" ? "2,6 MB · gerade eben" : ARRIVING.meta}
          status={status}
          progress={progress}
          error="Die Verbindung wurde unterbrochen."
          onRetry={() => {
            setProgress(0);
            setStatus("uploading");
          }}
        />
        <FileTile
          name="Angebot_Kowalski_Herbst.pdf"
          type="application/pdf"
          meta="Wird hochgeladen"
          status="uploading"
        />
      </Row>
    </div>
  );
}

/**
 * A file on its way shows its own picture with a bar across its foot. Arrived, the bar is seen
 * full for a moment and fades; nothing changes the tile's size.
 */
export const Uploading: Story = {
  parameters: {
    visual: {
      viewport: { width: 560, height: 360 },
      target: '[data-step="finish"]',
      motion: [
        { name: "progress", click: '[data-step="more"]', frames: 6 },
        { name: "arrive", click: '[data-step="finish"]', frames: 8 },
        { name: "fail", click: '[data-step="fail"]', frames: 6 },
      ],
    },
  },
  render: () => <Arriving start="uploading" />,
};

/** A file that did not arrive says why over its picture, with a key that tries again. */
export const Failed: Story = {
  parameters: {
    visual: { viewport: { width: 560, height: 360 }, target: '[data-slot="file-tile-retry"]' },
  },
  render: () => <Arriving start="error" />,
};
