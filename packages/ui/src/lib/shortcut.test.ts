import { describe, expect, it } from "vitest";

import { hasCommandKey, type KeyPress, matchesShortcut, shortcutKeys } from "./shortcut";

function press(key: string, held: Partial<KeyPress> = {}): KeyPress {
  return {
    key,
    code: "",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...held,
  };
}

describe("shortcutKeys", () => {
  it("draws the command key of each kind of keyboard", () => {
    expect(shortcutKeys("mod+k", "apple").map((key) => key.label)).toEqual(["⌘", "K"]);
    expect(shortcutKeys("mod+k", "other").map((key) => key.label)).toEqual(["Strg", "K"]);
  });

  it("keeps the order the shortcut is written in", () => {
    expect(shortcutKeys("mod+shift+p", "apple").map((key) => key.label)).toEqual(["⌘", "⇧", "P"]);
  });

  it("names every key for assistive tech", () => {
    expect(shortcutKeys("mod+enter", "apple").map((key) => key.name)).toEqual([
      "Befehlstaste",
      "Eingabetaste",
    ]);
    expect(shortcutKeys("alt+up", "other").map((key) => key.name)).toEqual([
      "Alt",
      "Pfeil nach oben",
    ]);
  });

  it("takes a sign as it is, and the plus by its name", () => {
    expect(shortcutKeys("/", "other")).toEqual([{ label: "/", name: "/" }]);
    expect(shortcutKeys("mod+plus", "other").map((key) => key.label)).toEqual(["Strg", "+"]);
  });
});

describe("matchesShortcut", () => {
  it("takes ⌘ on an Apple keyboard and Strg on the others", () => {
    expect(matchesShortcut(press("k", { metaKey: true }), "mod+k", "apple")).toBe(true);
    expect(matchesShortcut(press("k", { ctrlKey: true }), "mod+k", "apple")).toBe(false);
    expect(matchesShortcut(press("k", { ctrlKey: true }), "mod+k", "other")).toBe(true);
    expect(matchesShortcut(press("k", { metaKey: true }), "mod+k", "other")).toBe(false);
  });

  it("does not fire when another modifier is held as well", () => {
    expect(matchesShortcut(press("k", { metaKey: true, shiftKey: true }), "mod+k", "apple")).toBe(
      false,
    );
    expect(matchesShortcut(press("k", { metaKey: true, altKey: true }), "mod+k", "apple")).toBe(
      false,
    );
    expect(matchesShortcut(press("k"), "mod+k", "apple")).toBe(false);
  });

  it("follows the layout: the letter a key types counts, in either case", () => {
    expect(
      matchesShortcut(press("K", { metaKey: true, shiftKey: true }), "mod+shift+k", "apple"),
    ).toBe(true);
    // On a German keyboard the key marked Z sits where a US keyboard has Y.
    expect(matchesShortcut(press("z", { ctrlKey: true, code: "KeyY" }), "mod+z", "other")).toBe(
      true,
    );
  });

  it("goes by the place of the key while Alt is held, because Alt changes what it types", () => {
    expect(matchesShortcut(press("˚", { altKey: true, code: "KeyK" }), "alt+k", "apple")).toBe(
      true,
    );
    expect(matchesShortcut(press("˚", { altKey: true, code: "KeyJ" }), "alt+k", "apple")).toBe(
      false,
    );
  });

  it("knows the named keys", () => {
    expect(matchesShortcut(press("Escape"), "esc", "other")).toBe(true);
    expect(matchesShortcut(press("Enter", { metaKey: true }), "mod+enter", "apple")).toBe(true);
    expect(matchesShortcut(press("ArrowDown"), "down", "apple")).toBe(true);
    expect(matchesShortcut(press(" "), "space", "apple")).toBe(true);
  });

  it("does not compare Shift for a sign, which needs it on some layouts only", () => {
    expect(matchesShortcut(press("?", { shiftKey: true }), "?", "other")).toBe(true);
    expect(matchesShortcut(press("/"), "/", "other")).toBe(true);
    expect(matchesShortcut(press("7", { shiftKey: true }), "7", "other")).toBe(false);
  });

  it("is never a shortcut without a key", () => {
    expect(matchesShortcut(press("Meta", { metaKey: true }), "mod", "apple")).toBe(false);
  });
});

describe("hasCommandKey", () => {
  it("tells a command from a plain key", () => {
    expect(hasCommandKey("mod+k")).toBe(true);
    expect(hasCommandKey("alt+up")).toBe(true);
    expect(hasCommandKey("shift+a")).toBe(false);
    expect(hasCommandKey("/")).toBe(false);
  });
});
