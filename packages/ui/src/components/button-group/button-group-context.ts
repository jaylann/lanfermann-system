"use client";

import { createContext, useContext } from "react";

export type ButtonGroupContextValue = {
  size: "sm" | "md" | "lg";
  disabled: boolean;
};

/**
 * What a `ButtonGroup` tells the parts inside it. A `Button` or a `SelectTrigger` that finds it
 * is a key of the group's fitting: it gives up its own face, edge and shadow and takes the
 * group's size.
 */
export const ButtonGroupContext = createContext<ButtonGroupContextValue | undefined>(undefined);

/** The group a part stands in, or `undefined` outside one. */
export function useButtonGroup() {
  return useContext(ButtonGroupContext);
}
