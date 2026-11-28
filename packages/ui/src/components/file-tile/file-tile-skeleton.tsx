import type { ComponentProps } from "react";

import { Skeleton } from "@/components/skeleton/skeleton";
import { cn } from "@/lib/cn";

import {
  fileTileMeta,
  fileTileName,
  fileTilePad,
  fileTileText,
  fileTileWell,
} from "./file-tile-shape";

export type FileTileSkeletonProps = Omit<ComponentProps<"div">, "children"> & {
  /** How long the name's line is, as a share of the tile: vary it from tile to tile. */
  nameWidth?: string;
  /** How long the line of facts is. */
  metaWidth?: string;
  /**
   * `flat` (the default): on the tile's face without its shadow, a white sheet with a hairline,
   * so a grid of loading tiles keeps the tiles' outline. `none`: the shapes alone, for a place
   * where the face would stand out more than the tiles that come.
   */
  face?: "none" | "flat";
};

/**
 * The shape of a `FileTile` that is still on its way: its picture, the line of its name and the
 * line of its facts, each where the tile will have it, on the tile's face without its shadow:
 * nothing here can be handled yet, and only what moves casts a shadow.
 *
 * Put it inside a `SkeletonGroup` (or use `FileGridSkeleton`, which fills whole rows with them).
 * Server-safe.
 */
export function FileTileSkeleton({
  nameWidth = "68%",
  metaWidth = "42%",
  face = "flat",
  className,
  ...props
}: FileTileSkeletonProps) {
  return (
    <div
      data-slot="file-tile-skeleton"
      data-face={face}
      aria-hidden
      className={cn(
        "flex min-w-0 flex-col",
        fileTilePad,
        face === "flat" && "rounded-xl bg-surface inset-ring inset-ring-hairline",
        className,
      )}
      {...props}
    >
      <Skeleton shape="block" className={cn("w-full", fileTileWell)} />
      <div className={fileTileText}>
        <Skeleton className={fileTileName} style={{ width: nameWidth }} />
        <Skeleton className={fileTileMeta} style={{ width: metaWidth }} />
      </div>
    </div>
  );
}
