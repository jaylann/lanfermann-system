import { createContext } from "react";

/**
 * Where the plate of a `FileDropArea` stands, still Justin's to pick (AGENTS.md: built as a
 * switch, shown side by side in `Lab/Files`). `centre`, the default and Claude's
 * recommendation: a plate in the middle of the area. `bar`: a bar along its foot. Once he has
 * picked, the other option goes with this context and the pick is recorded in DESIGN.md. Not
 * exported from the library.
 */
export type DropPlace = "centre" | "bar";

export const DropPlaceContext = createContext<DropPlace>("centre");
