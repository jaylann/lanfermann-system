/**
 * For stories only (not exported): a folder's view as a card that takes files, its folders as
 * drop targets and its tiles draggable, shared by the drop area's stories and the Lab board.
 */
import { type ReactNode, useEffect, useId, useRef } from "react";

import { Card, CardBar } from "@/components/card/card";
import { FileGrid, FileGridSection } from "@/components/file-grid/file-grid";
import { FileTile, type FileTileProps } from "@/components/file-tile/file-tile";
import { FILES, FOLDERS, type StoryEntry } from "@/components/file-tile/story-files";
import { Heading } from "@/components/heading/heading";
import { useSelection } from "@/components/selection/use-selection";

import { FileDropArea, useDropTarget, useItemDrag } from "./file-drop-area";

/** A folder's tile that takes files and items itself. */
function FolderTile({
  entry,
  ...props
}: { entry: StoryEntry } & Omit<FileTileProps, "name" | "variant" | "meta">) {
  const { dropProps } = useDropTarget({
    id: entry.id,
    label: `In ${entry.name} ablegen`,
    moveLabel: `Nach ${entry.name} verschieben`,
  });
  return (
    <FileTile variant="folder" name={entry.name} meta={entry.meta} {...props} {...dropProps} />
  );
}

/** `useItemDrag` needs the area around it, so it lives in a child of the area. */
function Dragging({
  selected,
  children,
}: {
  selected: ReadonlySet<string>;
  children: (drag: ReturnType<typeof useItemDrag>) => ReactNode;
}) {
  const drag = useItemDrag({ itemsFor: (id) => (selected.has(id) ? [...selected] : [id]) });
  return children(drag);
}

const IDS = [...FOLDERS, ...FILES].map(({ id }) => id);

export function Browser({
  onFiles = () => {},
  onItems = () => {},
  files = 6,
  className = "min-h-[34rem]",
}: {
  onFiles?: (files: File[], target: string | null) => void;
  onItems?: (ids: string[], target: string) => void;
  files?: number;
  className?: string;
}) {
  const selection = useSelection({ ids: IDS, layout: "grid" });
  const heading = useId();
  return (
    <FileDropArea label="In building-gbar ablegen" onFiles={onFiles} onItems={onItems}>
      <Card className={className}>
        <CardBar>
          <Heading level={2} size="label" id={heading}>
            blogs/building-gbar
          </Heading>
        </CardBar>
        <div className="p-5">
          <Dragging selected={selection.selected}>
            {(drag) => (
              <FileGrid aria-labelledby={heading} {...selection.containerProps}>
                <FileGridSection key="ordner" label="Ordner">
                  {FOLDERS.map((entry) => (
                    <FolderTile
                      key={entry.id}
                      entry={entry}
                      selected={selection.isSelected(entry.id)}
                      {...selection.itemProps(entry.id)}
                      {...drag.itemProps(entry.id)}
                    />
                  ))}
                </FileGridSection>
                <FileGridSection key="dateien" label="Dateien">
                  {FILES.slice(0, files).map(({ id, ...file }) => (
                    <FileTile
                      key={id}
                      {...file}
                      selected={selection.isSelected(id)}
                      {...selection.itemProps(id)}
                      {...drag.itemProps(id)}
                    />
                  ))}
                </FileGridSection>
              </FileGrid>
            )}
          </Dragging>
        </div>
      </Card>
    </FileDropArea>
  );
}

/** Lets files hang over an element, as a drag from the desktop does, and returns what it carries. */
export function hangFilesOver(element: Element): DataTransfer {
  const transfer = new DataTransfer();
  transfer.items.add(new File(["x"], "eingang_abends.webp", { type: "image/webp" }));
  element.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
  element.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
  return transfer;
}

/** The browser with files hanging over the element `over` selects, for a still picture. */
export function Hovering({ over, files }: { over: string; files?: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current?.querySelector(over);
    if (element) hangFilesOver(element);
  }, [over]);
  return (
    <div ref={box}>
      <Browser files={files} />
    </div>
  );
}
