import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { type DropPlace, DropPlaceContext } from "@/components/file-drop-area/drop-look";
import { Hovering } from "@/components/file-drop-area/story-browser";

/**
 * The looks of the file parts that are still Justin's to pick, as switches side by side at real
 * size: one story per question. Every option is the part itself with one setting changed, so a
 * pick only deletes the others. The first option is Claude's recommendation and the library's
 * default until he has picked. Lab boards are not part of the library and go once the picks
 * are made. (The tile's face, its mark and the folder rows were picked on 2026-11-23.)
 */
const meta = {
  title: "Lab/Files",
  tags: ["visual-skip"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** One option: its name and a line on what it is, above it. */
function Option({
  name,
  note,
  place,
  children,
}: {
  name: string;
  note: string;
  place: DropPlace;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-control font-semibold text-fg">{name}</h3>
      <p className="mb-5 max-w-96 text-sm text-fg-muted">{note}</p>
      <DropPlaceContext value={place}>{children}</DropPlaceContext>
    </section>
  );
}

/** Where the plate stands while files hang over the card. */
export const DropPlate: Story = {
  name: "Ablage: Schild",
  render: () => (
    <div className="grid grid-cols-1 gap-12 p-8 lg:grid-cols-2">
      <Option
        name="Mitte (empfohlen)"
        note="Ein Schild in der Mitte der Karte sagt, wohin die Dateien gehen; die Karte trägt den Halo des Felds."
        place="centre"
      >
        <Hovering over='[data-slot="file-grid-section"]:last-of-type' files={4} />
      </Option>
      <Option
        name="Leiste unten"
        note="Eine Leiste über die Breite am Fuß der Karte sagt es; die Mitte bleibt frei für die Kacheln."
        place="bar"
      >
        <Hovering over='[data-slot="file-grid-section"]:last-of-type' files={4} />
      </Option>
    </div>
  ),
};
