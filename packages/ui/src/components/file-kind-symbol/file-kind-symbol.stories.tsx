import type { Meta, StoryObj } from "@storybook/react-vite";

import { kindWords } from "@/components/attachment/kinds";

import { FileKindSymbol, type FileSymbolKind } from "./file-kind-symbol";

const meta = {
  title: "Components/FileKindSymbol",
  component: FileKindSymbol,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 720, height: 260 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const KINDS: FileSymbolKind[] = [
  "folder",
  "pdf",
  "image",
  "sheet",
  "csv",
  "document",
  "archive",
  "audio",
  "video",
  "file",
];

/**
 * Every kind at the three sizes it stands at: 14px in a chip or a row (no letters, which run
 * together there), 18px in a tile, 32px where a file has no picture.
 */
export const Kinds: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(10,auto)] items-end gap-x-5 gap-y-3 text-fg-muted">
      {[14, 18, 32].map((size) =>
        KINDS.map((kind) => <FileKindSymbol key={`${kind}-${size}`} kind={kind} size={size} />),
      )}
      {KINDS.map((kind) => (
        <span key={kind} className="text-xs text-fg-muted">
          {kind === "folder" ? "Ordner" : kindWords[kind]}
        </span>
      ))}
    </div>
  ),
};
