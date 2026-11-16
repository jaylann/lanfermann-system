import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { cn, depthNames, depthToneNames, mergeClassName } from "./cn";

describe("cn", () => {
  it("joins truthy class names and drops falsy ones", () => {
    const disabled = false as boolean;
    expect(cn("px-2", disabled && "hidden", undefined, "py-1")).toBe("px-2 py-1");
  });

  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("treats depth utilities as one group", () => {
    expect(cn("depth-raised", "depth-none")).toBe("depth-none");
    expect(cn("depth-field", "depth-field-invalid")).toBe("depth-field-invalid");
  });

  it("lets a depth utility replace raw shadows (override depth with another depth-*)", () => {
    expect(cn("shadow-lg inset-shadow-sm", "depth-raised")).toBe("depth-raised");
  });

  it("keeps a depth tone next to its recipe and merges tones with each other", () => {
    expect(cn("depth-raised depth-tone-key", "depth-tone-accent")).toBe(
      "depth-raised depth-tone-accent",
    );
  });

  it("treats spring utilities as duration plus easing", () => {
    expect(cn("spring-snap", "spring-settle")).toBe("spring-settle");
    expect(cn("duration-200 ease-out", "spring-seat")).toBe("spring-seat");
  });

  it("does not mistake the type scale for a colour", () => {
    expect(cn("text-base text-fg", "text-sm")).toBe("text-fg text-sm");
    expect(cn("text-fg", "text-fg-muted")).toBe("text-fg-muted");
    expect(cn("text-control text-fg", "text-sm")).toBe("text-fg text-sm");
    expect(cn("text-base text-fg", "text-control")).toBe("text-fg text-control");
  });
});

describe("mergeClassName", () => {
  it("merges plain strings", () => {
    expect(mergeClassName("px-2", "px-4")).toBe("px-4");
  });

  it("keeps Base UI's function form and merges its result", () => {
    const merged = mergeClassName<{ open: boolean }>("px-2", (state) =>
      state.open ? "px-4" : undefined,
    );
    expect(typeof merged).toBe("function");
    if (typeof merged !== "function") return;
    expect(merged({ open: true })).toBe("px-4");
    expect(merged({ open: false })).toBe("px-2");
  });
});

describe("depth names", () => {
  const css = readFileSync(new URL("../styles/depth.css", import.meta.url), "utf8");
  const utilities = [...css.matchAll(/@utility depth-([a-z-]+) \{/g)].map((match) => match[1]!);

  it("match the utilities in depth.css, so tailwind-merge never drops one silently", () => {
    const tones = utilities.filter((name) => name.startsWith("tone-")).map((n) => n.slice(5));
    const recipes = utilities.filter((name) => !name.startsWith("tone-"));
    expect(recipes.sort()).toEqual([...depthNames].sort());
    expect(tones.sort()).toEqual([...depthToneNames].sort());
  });
});
