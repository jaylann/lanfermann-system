import { describe, expect, it } from "vitest";

import { type PromptKey, promptKey } from "./keys";

const enter = (over: Partial<PromptKey> = {}): PromptKey => ({
  key: "Enter",
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  isComposing: false,
  keyCode: 13,
  ...over,
});

const desk = { touchOnly: false, running: false };

describe("promptKey", () => {
  it("sends on Enter", () => {
    expect(promptKey(enter(), desk)).toBe("send");
  });

  it("breaks the line on Shift+Enter", () => {
    expect(promptKey(enter({ shiftKey: true }), desk)).toBe("type");
  });

  it("never sends while a word is composed, in Safari's order too", () => {
    expect(promptKey(enter({ isComposing: true }), desk)).toBe("type");
    expect(promptKey(enter({ keyCode: 229 }), desk)).toBe("type");
  });

  it("holds Enter while an answer is written", () => {
    expect(promptKey(enter(), { touchOnly: false, running: true })).toBe("hold");
    expect(promptKey(enter({ shiftKey: true }), { touchOnly: false, running: true })).toBe("type");
  });

  it("breaks the line on a touch screen, and sends there with ⌘ or Strg", () => {
    const touch = { touchOnly: true, running: false };
    expect(promptKey(enter(), touch)).toBe("type");
    expect(promptKey(enter({ metaKey: true }), touch)).toBe("send");
    expect(promptKey(enter({ ctrlKey: true }), touch)).toBe("send");
  });

  it("leaves every other key to the field", () => {
    expect(promptKey(enter({ key: "a" }), desk)).toBe("type");
  });
});
