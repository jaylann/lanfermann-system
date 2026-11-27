import type { ComponentProps, CSSProperties } from "react";

import { mayBeTransparent } from "@/components/attachment/kinds";
import {
  FileKindSymbol,
  type FileSymbolKind,
} from "@/components/file-kind-symbol/file-kind-symbol";
import { cn } from "@/lib/cn";

import { FileThumbPicture } from "./file-thumb-picture";

/** One file of a stack: what a `FileThumb` takes, and its name. */
export type FileThumbStackFile = {
  /** Its name: it tells the files apart, and with `type` whether its picture may be see-through. */
  name: string;
  /** What it is (`kindOf`), or `folder`. */
  kind: FileSymbolKind;
  /** Its picture. Without one the kind's symbol stands on the well. */
  src?: string;
  /** Its MIME type. */
  type?: string;
};

export type FileThumbStackProps = Omit<ComponentProps<"span">, "children"> & {
  /** The files that are chosen, the first on top. */
  files: FileThumbStackFile[];
  /** How many pictures are shown at most; the rest is a number at the stack's corner. */
  max?: number;
  /**
   * How the pictures lie on each other. `fan` (the default): a hand of pictures, the first
   * upright and each one under it turned a little further. `row`: side by side, each over the edge of the one before. `pile`: one on
   * the other, the lower ones showing at two edges.
   */
  look?: "fan" | "row" | "pile";
  /** What the stack is for assistive tech: „4 Dateien“. */
  countLabel?: (count: number) => string;
};

/** Where the picture at `index` lies: its turn and its way from its own place. */
function placeOf(look: "fan" | "row" | "pile", index: number) {
  // The first stands upright on top; each one under it is turned a little further and sinks a
  // little, as pictures held in one hand do.
  if (look === "fan") return { turn: index * 5, x: 0, y: index * 1.5 };
  if (look === "pile") return { turn: [0, -4, 3, -2][index % 4]!, x: index * 5, y: index * -3 };
  return { turn: 0, x: 0, y: 0 };
}

/**
 * Several files chosen at once, as a small stack of their pictures: the head of an inspector
 * that says „4 Dateien“, a drag that carries more than one. Each picture is a card in the file
 * tile's cut (`bevel`), with the kind's symbol where a file has no picture. Beyond `max` the
 * stack stays as it is and a number at its corner counts the rest.
 *
 * A file that joins seats into its place (`seat`) and the others make room; one that leaves is
 * simply gone. It is one picture to assistive tech, named by how many files it stands for: name
 * the files themselves in the text beside it. Server-safe.
 */
export function FileThumbStack({
  files,
  max = 4,
  look = "fan",
  countLabel = (count) => (count === 1 ? "1 Datei" : `${count} Dateien`),
  className,
  ...props
}: FileThumbStackProps) {
  const shown = files.slice(0, max);
  const more = files.length - shown.length;
  return (
    <span
      data-slot="file-thumb-stack"
      data-look={look}
      role="img"
      aria-label={countLabel(files.length)}
      className={cn("relative isolate inline-flex shrink-0 items-center", className)}
      {...props}
    >
      {shown.map((file, index) => {
        const place = placeOf(look, index);
        return (
          <span
            key={file.name}
            data-slot="file-thumb-stack-card"
            style={
              {
                "--stack-turn": `${place.turn}deg`,
                "--stack-x": `${place.x}px`,
                "--stack-y": `${place.y}px`,
                // The first lies on top: it is the one the eye reads first.
                zIndex: shown.length - index,
              } as CSSProperties
            }
            className={cn(
              "flex size-16 shrink-0 rounded-lg bg-surface depth-bevel p-0.5",
              "translate-x-(--stack-x) translate-y-(--stack-y) rotate-(--stack-turn)",
              // Joining, it seats into its place; a change of the hand turns the others over.
              "transition-[translate,rotate,scale,opacity] spring-seat starting:scale-90 starting:opacity-0",
              look === "pile"
                ? "not-first:-ms-16"
                : look === "fan"
                  ? "not-first:-ms-9"
                  : "not-first:-ms-6",
            )}
          >
            <span className="flex size-full items-center justify-center overflow-hidden rounded-[calc(var(--radius-lg)-2px)] bg-well">
              {file.src ? (
                <FileThumbPicture
                  src={file.src}
                  kind={file.kind}
                  seeThrough={mayBeTransparent(file)}
                  symbolSize={24}
                />
              ) : (
                <FileKindSymbol kind={file.kind} size={24} className="text-fg-muted" />
              )}
            </span>
          </span>
        );
      })}
      {more > 0 && (
        <span
          aria-hidden
          data-slot="file-thumb-stack-more"
          style={{ zIndex: shown.length + 1 }}
          className="absolute -right-2 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-raised depth-plug px-1.5 text-xs font-medium text-fg tabular-nums"
        >
          +{more}
        </span>
      )}
    </span>
  );
}
