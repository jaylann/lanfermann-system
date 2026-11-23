import { createContext } from "react";

/**
 * The looks of the file parts that are still Justin's to pick (AGENTS.md: built as switches,
 * shown side by side in `Lab/Files`). Each default is Claude's recommendation; once he has
 * picked, the other option goes, with this context, and the pick is recorded in DESIGN.md.
 * Not exported from the library.
 */
export type FilesLook = {
  /** `bevel`: each tile is a bevelled card, a part that is handled. `flat`: on the well, no card. */
  face: "bevel" | "flat";
  /** `corner`: the mark stands at the top left over the picture. `name`: before the name. */
  mark: "corner" | "name";
  /** `row`: a folder is a compact tile one line high. `tile`: as large as a file's tile. */
  folders: "row" | "tile";
};

export const filesLookDefaults: FilesLook = { face: "bevel", mark: "corner", folders: "row" };

export const FilesLookContext = createContext<FilesLook>(filesLookDefaults);
