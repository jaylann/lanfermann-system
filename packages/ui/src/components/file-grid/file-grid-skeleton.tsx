import type { CSSProperties } from "react";

import { FileTileSkeleton } from "@/components/file-tile/file-tile-skeleton";
import { SkeletonGroup, type SkeletonGroupProps } from "@/components/skeleton/skeleton";
import { cn } from "@/lib/cn";

import { fileGrid } from "./file-grid-variants";

export type FileGridSkeletonProps = Omit<SkeletonGroupProps, "children"> & {
  /** How wide a tile is at least, as on the `FileGrid` it stands in for. */
  size?: "sm" | "md";
  /** How many rows of tiles wait: about as many as the folder usually shows at once. */
  rows?: number;
};

// Name and fact lines of unequal length, in an order that does not look like a pattern: real
// names are not all as long.
const NAMES = ["68%", "52%", "81%", "60%", "74%", "46%", "88%", "57%"];
const FACTS = ["42%", "36%", "48%", "30%", "44%", "38%"];
/** More tiles than any window shows in a row: the grid cuts them to whole rows itself. */
const PER_ROW = 12;

/**
 * A `FileGrid` that is still loading: tiles in the grid's own columns, in whole rows at every
 * width. It needs no script for that: the grid lays out `rows` rows and gives every further one
 * no height, so a wider window simply shows more tiles of the same rows.
 *
 * `label` says what is on its way ("Die Dateien werden geladen."). To fade the folder in over
 * it, hand it to a `Loaded` as its `skeleton`. Server-safe.
 */
export function FileGridSkeleton({
  size = "md",
  rows = 2,
  className,
  ...props
}: FileGridSkeletonProps) {
  return (
    <SkeletonGroup data-slot="file-grid-skeleton" className={className} {...props}>
      <div
        style={{ "--file-grid-rows": rows } as CSSProperties}
        className={cn(
          fileGrid({ size }),
          // The rows' gap is each tile's margin instead, so the rows that are not shown add
          // none; the last shown row's margin is taken back.
          "-mb-6 [grid-auto-rows:0] grid-rows-[repeat(var(--file-grid-rows),auto)] gap-y-0 overflow-hidden",
        )}
      >
        {Array.from({ length: rows * PER_ROW }, (_, index) => (
          <FileTileSkeleton
            key={index}
            className="mb-6"
            nameWidth={NAMES[index % NAMES.length]}
            metaWidth={FACTS[index % FACTS.length]}
          />
        ))}
      </div>
    </SkeletonGroup>
  );
}
