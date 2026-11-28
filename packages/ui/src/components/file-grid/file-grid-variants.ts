import { cva } from "class-variance-authority";

/**
 * The columns of a `FileGrid`, as class names. Outside the component (which is a client part) so
 * that the grid's loading shape, `FileGridSkeleton`, lays its tiles out in the very same columns
 * from a Server Component.
 */
export const fileGrid = cva(
  [
    "group/files relative grid gap-x-3 gap-y-6",
    // As many columns as fit, each at least a tile wide, sharing what is left over.
    "grid-cols-[repeat(auto-fill,minmax(min(var(--file-tile-min),100%),1fr))]",
  ],
  {
    variants: {
      size: {
        /** Tiles at least 8rem wide: a narrow place, many small pictures. */
        sm: "[--file-tile-min:8rem]",
        /** Tiles at least 10rem wide: two on a phone, four or five beside an inspector. */
        md: "[--file-tile-min:10rem]",
      },
    },
  },
);
