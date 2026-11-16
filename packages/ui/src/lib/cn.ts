import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { springNames } from "@/motion/springs";

/**
 * The `depth-*` utilities defined in src/styles/depth.css. tailwind-merge has to be told about
 * every custom utility, otherwise it treats e.g. `shadow-raised` as a colour and keeps both sides
 * of a conflict. A test asserts these lists match the stylesheet.
 */
export const depthNames = [
  "raised",
  "raised-hover",
  "pressed",
  "flat",
  "plug",
  "socket",
  "trough",
  "field",
  "field-focus",
  "field-invalid",
  "card",
  "floating",
  "overlay",
  "bar",
  "seam",
  "none",
] as const;

export const depthToneNames = ["key", "accent", "danger", "thumb"] as const;

const shadowNames = [
  "raised",
  "raised-hover",
  "pressed",
  "flat",
  "plug",
  "socket",
  "field",
  "field-focus",
  "field-invalid",
  "card",
  "floating",
  "overlay",
  "bar",
];
const insetShadowNames = [
  "raised",
  "pressed",
  "flat",
  "socket",
  "trough",
  "field",
  "card",
  "sheet",
  "bar",
];
const springKeys = springNames.map((name) => `spring-${name}`);

const twMerge = extendTailwindMerge<"depth" | "depth-tone" | "spring">({
  extend: {
    theme: {
      // `text-control` is a font size (density.css); unregistered it would count as a colour.
      text: ["control"],
      shadow: shadowNames,
      "inset-shadow": insetShadowNames,
      ease: springKeys,
      animate: ["spinner", "indeterminate", "breathe"],
    },
    classGroups: {
      depth: [{ depth: [...depthNames] }],
      "depth-tone": [{ "depth-tone": [...depthToneNames] }],
      spring: [{ spring: [...springNames] }],
      duration: [{ duration: springKeys }],
    },
    conflictingClassGroups: {
      depth: ["shadow", "inset-shadow"],
      spring: ["duration", "ease"],
    },
  },
});

/**
 * Joins class names conditionally and resolves conflicting Tailwind utilities, last one wins.
 * Use it for every `className` a component composes from defaults plus caller overrides.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Merges a component's own classes with the caller's `className`, which on Base UI parts may be a
 * function of the part's state. The function form is preserved, so callers keep access to state.
 */
export function mergeClassName<State>(
  base: ClassValue,
  className: string | ((state: State) => string | undefined) | undefined,
): string | ((state: State) => string) {
  if (typeof className === "function") {
    return (state: State) => cn(base, className(state));
  }
  return cn(base, className);
}
