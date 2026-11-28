import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";

import { FileDropArea, ITEMS_TYPE } from "./file-drop-area";
import { Browser, hangFilesOver, Hovering } from "./story-browser";

const meta = {
  title: "Components/FileDropArea",
  component: FileDropArea,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 960, height: 680 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A folder's view as a card that takes files anywhere; its folders take them themselves. */
export const Default: Story = {
  render: () => <Browser />,
};

/** Files hang over the card: it takes the field's halo, and the plate says where they go. */
export const FilesOver: Story = {
  render: () => (
    <Hovering over='[data-slot="file-grid-section"]:last-of-type [data-slot="file-tile"]' />
  ),
};

/** Files hang over a folder: it wins over the card, wears the halo itself, and is named. */
export const FolderOver: Story = {
  render: () => <Hovering over='[data-drop-target="badges"]' />,
};

const files = fn();
const items = fn();

/** A drop on the card, on a folder, a paste, and items dragged onto a folder. */
export const Drop: Story = {
  render: () => <Browser onFiles={files} onItems={items} />,
  play: async ({ canvas, step }) => {
    files.mockClear();
    items.mockClear();
    const drop = (element: Element, transfer: DataTransfer) =>
      element.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    await step("files let go over the card go to the folder one is in", async () => {
      const tile = canvas.getByRole("row", { name: /hero/ });
      const transfer = hangFilesOver(tile);
      await waitFor(() =>
        expect(canvas.getByText("In building-gbar ablegen", { selector: ".sr-only" })).toBeTruthy(),
      );
      drop(tile, transfer);
      await expect(files).toHaveBeenCalledWith([expect.any(File)], null);
    });
    await step("files let go over a folder go into that folder", async () => {
      const folder = canvas.getByRole("row", { name: /badges/ });
      const transfer = hangFilesOver(folder);
      await waitFor(() => expect(folder).toHaveAttribute("data-drop-over"));
      drop(folder, transfer);
      await expect(files).toHaveBeenLastCalledWith([expect.any(File)], "badges");
      await waitFor(() => expect(folder).not.toHaveAttribute("data-drop-over"));
    });
    await step("a pasted file goes to the folder one is in", async () => {
      const tile = canvas.getByRole("row", { name: /hero/ });
      const transfer = new DataTransfer();
      transfer.items.add(new File(["x"], "zwischenablage.png", { type: "image/png" }));
      tile.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: transfer }));
      await expect(files).toHaveBeenLastCalledWith([expect.any(File)], null);
    });
    await step("items dragged onto a folder are moved there", async () => {
      const tile = canvas.getByRole("row", { name: /thumbnail/ });
      const folder = canvas.getByRole("row", { name: /archiv/ });
      const transfer = new DataTransfer();
      tile.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: transfer }));
      await expect(transfer.getData(ITEMS_TYPE)).toBe('["thumbnail"]');
      folder.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
      await waitFor(() => expect(folder).toHaveAttribute("data-drop-over"));
      drop(folder, transfer);
      tile.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: transfer }));
      await expect(items).toHaveBeenCalledWith(["thumbnail"], "archiv");
    });
    await step("a folder does not take a drag of itself", async () => {
      items.mockClear();
      const folder = canvas.getByRole("row", { name: /badges/ });
      const transfer = new DataTransfer();
      folder.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: transfer }));
      folder.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
      drop(folder, transfer);
      folder.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: transfer }));
      await expect(folder).not.toHaveAttribute("data-drop-over");
      await expect(items).not.toHaveBeenCalled();
    });
  },
};

const heard = fn();

/** As a test: handlers the caller puts on the area are heard beside the area's own. */
export const OwnHandlers: Story = {
  render: () => (
    <FileDropArea
      label="In building-gbar ablegen"
      onFiles={files}
      onDragEnter={heard}
      onDragLeave={heard}
      onPaste={heard}
    >
      <p className="p-6 text-control text-fg-body">Dateien hierher ziehen oder einfügen.</p>
    </FileDropArea>
  ),
  play: async ({ canvasElement, step }) => {
    files.mockClear();
    heard.mockClear();
    const area = canvasElement.querySelector('[data-slot="file-drop-area"]')!;
    const inside = area.querySelector("p")!;

    await step("a drag is heard by the caller and still taken by the area", async () => {
      const transfer = hangFilesOver(inside);
      await waitFor(() => expect(area).toHaveAttribute("data-dragging"));
      await expect(heard).toHaveBeenCalledTimes(1);
      inside.dispatchEvent(new DragEvent("dragleave", { bubbles: true, dataTransfer: transfer }));
      await waitFor(() => expect(area).not.toHaveAttribute("data-dragging"));
      await expect(heard).toHaveBeenCalledTimes(2);
    });
    await step("a paste is heard by the caller and its file still reported", async () => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(["x"], "zwischenablage.png", { type: "image/png" }));
      inside.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: transfer }));
      await expect(heard).toHaveBeenCalledTimes(3);
      await expect(files).toHaveBeenCalledWith([expect.any(File)], null);
    });
  },
};
