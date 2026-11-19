"use client";

import { createContext, useContext } from "react";

/**
 * Whether a part stands in a `Toolbar`. A `Toggle` that finds it joins the toolbar's one tab
 * stop by itself, so a `ToggleGroup` can be put into a toolbar as it is.
 */
export const ToolbarContext = createContext(false);

export function useInToolbar() {
  return useContext(ToolbarContext);
}
