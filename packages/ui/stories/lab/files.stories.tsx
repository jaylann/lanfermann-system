import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { FileGrid, FileGridSection } from "@/components/file-grid/file-grid";
import { FileTile } from "@/components/file-tile/file-tile";
import {
  type FilesLook,
  FilesLookContext,
  filesLookDefaults,
} from "@/components/file-tile/files-look";
import { FILES, FOLDERS } from "@/components/file-tile/story-files";

/**
 * The looks of the file parts that are Justin's to pick, as switches side by side at real size:
 * one story per question. Every option is the part itself with one setting of `FilesLook`
 * changed, so a pick only deletes the others. The first option of each is Claude's
 * recommendation and the library's default until he has picked. Lab boards are not part of the
 * library and go once the picks are made.
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
  look,
  children,
}: {
  name: string;
  note: string;
  look: Partial<FilesLook>;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-control font-semibold text-fg">{name}</h3>
      <p className="mb-5 max-w-96 text-sm text-fg-muted">{note}</p>
      <FilesLookContext value={{ ...filesLookDefaults, ...look }}>{children}</FilesLookContext>
    </section>
  );
}

function Board({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-12 p-8 lg:grid-cols-2">{children}</div>;
}

/** A folder of a website's assets: three folders, five files, `chosen` of them taken. */
function Folder({ chosen = [] }: { chosen?: string[] }) {
  return (
    <FileGrid aria-label="Dateien in blogs/building-gbar">
      <FileGridSection key="ordner" label="Ordner">
        {FOLDERS.map(({ id, ...folder }) => (
          <FileTile key={id} variant="folder" {...folder} selected={chosen.includes(id)} />
        ))}
      </FileGridSection>
      <FileGridSection key="dateien" label="Dateien">
        {FILES.slice(0, 6).map(({ id, ...file }) => (
          <FileTile key={id} {...file} selected={chosen.includes(id)} />
        ))}
      </FileGridSection>
    </FileGrid>
  );
}

/** The tile's face: a bevelled card, or nothing but the picture on the well. */
export const TileFace: Story = {
  name: "Kachel: Fläche",
  render: () => (
    <Board>
      <Option
        name="Fase (empfohlen)"
        note="Jede Kachel ist eine abgeschrägte Karte, ein Teil, das man anfasst. Gewählt trägt sie die Akzentkante."
        look={{ face: "bevel" }}
      >
        <Folder chosen={["thumbnail"]} />
      </Option>
      <Option
        name="Flach"
        note="Keine Karte: das Bild steht auf der Mulde, der Zeiger tönt die ganze Kachel, gewählt steht sie auf dem Tint."
        look={{ face: "flat" }}
      >
        <Folder chosen={["thumbnail"]} />
      </Option>
    </Board>
  ),
};

/** Where the mark of a tile stands. Something is chosen, so every tile shows its mark. */
export const MarkPlace: Story = {
  name: "Kachel: Häkchen",
  render: () => (
    <Board>
      <Option
        name="Oben links (empfohlen)"
        note="Das Häkchen steht oben links über dem Bild, groß genug zum Treffen, wie in einer Fotoübersicht."
        look={{ mark: "corner" }}
      >
        <Folder chosen={["thumbnail", "angebot"]} />
      </Option>
      <Option
        name="Beim Namen"
        note="Das Häkchen tritt an die Stelle des Dateisymbols vor dem Namen; das Bild bleibt frei."
        look={{ mark: "name" }}
      >
        <Folder chosen={["thumbnail", "angebot"]} />
      </Option>
    </Board>
  ),
};

/** How a folder stands among the files. */
export const Folders: Story = {
  name: "Ordner: Form",
  render: () => (
    <Board>
      <Option
        name="Kompakte Zeile (empfohlen)"
        note="Ein Ordner wird geöffnet, nicht angesehen: eine Zeile mit Symbol und Namen, in den Spalten der Dateien."
        look={{ folders: "row" }}
      >
        <Folder />
      </Option>
      <Option
        name="So groß wie eine Datei"
        note="Ein Ordner ist eine Kachel wie jede Datei, das Ordnersymbol groß an der Stelle des Bildes."
        look={{ folders: "tile" }}
      >
        <Folder />
      </Option>
    </Board>
  ),
};
