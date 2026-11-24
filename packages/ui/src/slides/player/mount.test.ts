import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { actionOfIntent, intentOfClick, keyBelongsToTarget, tileOfKey } from "./actions";
import { defaultLabels, fill } from "./labels";
import { modeFromSearch, sessionFromSearch } from "./mode";
import { version } from "./version";

describe("the mode a page opens in", () => {
  const audienceBuild = ["audience", "print", "check"] as const;
  const presenterBuild = ["presenter", "audience", "print", "check"] as const;

  it("is the build's own without a wish in the address", () => {
    expect(modeFromSearch("", "audience", audienceBuild)).toBe("audience");
    expect(modeFromSearch("?session=a1", "presenter", presenterBuild)).toBe("presenter");
  });

  it("follows the address to a mode the build allows", () => {
    expect(modeFromSearch("?mode=print", "audience", audienceBuild)).toBe("print");
    expect(modeFromSearch("?mode=check&x=1", "audience", audienceBuild)).toBe("check");
    expect(modeFromSearch("?mode=audience&session=a1", "presenter", presenterBuild)).toBe(
      "audience",
    );
    expect(modeFromSearch("?mode=presenter", "audience", presenterBuild)).toBe("presenter");
  });

  it("refuses the console to a build for an audience", () => {
    expect(modeFromSearch("?mode=presenter", "audience", audienceBuild)).toBe("audience");
  });

  it("keeps the build's own mode whatever the list says, and ignores nonsense", () => {
    expect(modeFromSearch("", "presenter", audienceBuild)).toBe("presenter");
    expect(modeFromSearch("?mode=edit", "audience", audienceBuild)).toBe("audience");
    expect(modeFromSearch("?mode=", "audience", audienceBuild)).toBe("audience");
    expect(modeFromSearch("?mode=PRINT", "audience", audienceBuild)).toBe("audience");
  });

  it("reads a session's name, and only one this player could have made", () => {
    expect(sessionFromSearch("?mode=audience&session=0f3a9c21b7d4e688")).toBe("0f3a9c21b7d4e688");
    expect(sessionFromSearch("?mode=audience")).toBeUndefined();
    expect(sessionFromSearch("?session=")).toBeUndefined();
    expect(sessionFromSearch("?session=a%20b")).toBeUndefined();
    expect(sessionFromSearch(`?session=${"a".repeat(65)}`)).toBeUndefined();
  });
});

describe("what an intent does", () => {
  it("turns every intent but the full screen into an action", () => {
    expect(actionOfIntent("next", 5)).toEqual({ type: "next", at: 5 });
    expect(actionOfIntent("previous", 5)).toEqual({ type: "previous" });
    expect(actionOfIntent("first", 5)).toEqual({ type: "first" });
    expect(actionOfIntent("last", 5)).toEqual({ type: "last" });
    expect(actionOfIntent("blackout", 5)).toEqual({ type: "blackout" });
    expect(actionOfIntent("grid", 5)).toEqual({ type: "grid" });
    expect(actionOfIntent("escape", 5)).toEqual({ type: "escape" });
    expect(actionOfIntent("fullscreen", 5)).toBeUndefined();
  });

  it("steps back on the left half of the slide and forward on the right", () => {
    expect(intentOfClick(300, 100, 800)).toBe("previous");
    expect(intentOfClick(500, 100, 800)).toBe("next");
    expect(intentOfClick(899, 100, 800)).toBe("next");
  });
});

describe("the arrows in the grid of slides", () => {
  it("walk the tiles, a row up or down by the grid's width", () => {
    expect(tileOfKey("ArrowRight", 2, 10, 5)).toBe(3);
    expect(tileOfKey("ArrowLeft", 2, 10, 5)).toBe(1);
    expect(tileOfKey("ArrowDown", 2, 10, 5)).toBe(7);
    expect(tileOfKey("ArrowUp", 7, 10, 5)).toBe(2);
    expect(tileOfKey("Home", 7, 10, 5)).toBe(0);
    expect(tileOfKey("End", 2, 10, 5)).toBe(9);
  });

  it("stay where they are at an edge, so the key does not step the deck instead", () => {
    expect(tileOfKey("ArrowLeft", 0, 10, 5)).toBe(0);
    expect(tileOfKey("ArrowRight", 9, 10, 5)).toBe(9);
    expect(tileOfKey("ArrowUp", 2, 10, 5)).toBe(2);
    expect(tileOfKey("ArrowDown", 7, 10, 5)).toBe(7);
  });

  it("leave every other key to the player", () => {
    expect(tileOfKey("PageDown", 2, 10, 5)).toBeUndefined();
    expect(tileOfKey("Escape", 2, 10, 5)).toBeUndefined();
    expect(tileOfKey("g", 2, 10, 5)).toBeUndefined();
    expect(tileOfKey("constructor", 2, 10, 5)).toBeUndefined();
  });
});

describe("whose key it is", () => {
  it("leaves typing to a field", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(keyBelongsToTarget("ArrowRight", { tagName })).toBe(true);
      expect(keyBelongsToTarget("b", { tagName })).toBe(true);
    }
    expect(keyBelongsToTarget(" ", { tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("leaves Enter and Space to a button or a link, and takes the rest", () => {
    for (const tagName of ["BUTTON", "A"]) {
      expect(keyBelongsToTarget("Enter", { tagName })).toBe(true);
      expect(keyBelongsToTarget(" ", { tagName })).toBe(true);
      expect(keyBelongsToTarget("ArrowRight", { tagName })).toBe(false);
      expect(keyBelongsToTarget("PageDown", { tagName })).toBe(false);
    }
  });

  it("leaves the vertical arrows to a box that scrolls", () => {
    const notes = { tagName: "DIV", scrolls: true };
    expect(keyBelongsToTarget("ArrowDown", notes)).toBe(true);
    expect(keyBelongsToTarget("ArrowUp", notes)).toBe(true);
    expect(keyBelongsToTarget("ArrowRight", notes)).toBe(false);
    expect(keyBelongsToTarget("PageDown", notes)).toBe(false);
  });

  it("takes every key when nothing or the page has the focus", () => {
    expect(keyBelongsToTarget("Enter", null)).toBe(false);
    expect(keyBelongsToTarget(" ", { tagName: "BODY" })).toBe(false);
  });
});

describe("the player's words", () => {
  it("fills in the places of a label", () => {
    expect(fill(defaultLabels.slide, { page: 3, count: 10 })).toBe("Folie 3 von 10");
    expect(fill(defaultLabels.position, { page: 3, count: 10 })).toBe("3 / 10");
    expect(fill("Seite {page} {of}", { page: 1 })).toBe("Seite 1 {of}");
  });

  it("has no dash and no empty word", () => {
    for (const [name, label] of Object.entries(defaultLabels)) {
      expect(label.trim(), name).not.toBe("");
      expect(label, name).not.toMatch(/[–—]| - /);
    }
  });
});

describe("the player's version", () => {
  it("is the package's", () => {
    const manifest: unknown = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    );
    expect(manifest).toMatchObject({ version });
  });
});
