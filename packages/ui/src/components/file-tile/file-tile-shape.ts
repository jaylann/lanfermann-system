/**
 * The measures of a file tile, shared by `FileTile` and its loading shape (`FileTileSkeleton`),
 * so the two cannot drift apart: a skeleton stands exactly where the tile's parts will stand.
 * No `"use client"`: a skeleton is plain markup and may be a Server Component's fallback.
 */

/** The tile's own padding around its picture and words. */
export const fileTilePad = "p-1";
/** The picture's well: four to three, its corners the tile's minus that padding. */
export const fileTileWell = "aspect-[4/3] rounded-md";
/** The block of words under the picture. */
export const fileTileText = "flex min-w-0 flex-col px-1.5 pt-2 pb-1";
/** The name's line. */
export const fileTileName = "text-control font-medium";
/** The line of facts under the name, kept even when it is empty. */
export const fileTileMeta = "min-h-[1lh] text-sm";
