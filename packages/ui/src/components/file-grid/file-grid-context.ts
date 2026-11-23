import { createContext } from "react";

import type { Glide } from "@/internal/glide";

/**
 * What a `FileGrid` tells the parts inside it: that they stand in a grid (a tile is then a row
 * of it, for assistive tech), and the glide its sections share, so a section that grows moves
 * the sections below it as well.
 */
export type FileGridContextValue = { glide: Glide | null; inGrid: boolean };

export const FileGridContext = createContext<FileGridContextValue>({
  glide: null,
  inGrid: false,
});
