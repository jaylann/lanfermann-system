import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { mergeRefs } from "./merge-refs";

describe("mergeRefs", () => {
  it("fills an object ref and a callback ref, and empties both when the element goes", () => {
    const object = createRef<string>();
    const callback = vi.fn<(node: string | null) => void>();
    const cleanup = mergeRefs(object, callback)("node");

    expect(object.current).toBe("node");
    expect(callback.mock.calls).toEqual([["node"]]);

    expect(cleanup).toBeTypeOf("function");
    (cleanup as () => void)();
    expect(object.current).toBeNull();
    expect(callback.mock.calls).toEqual([["node"], [null]]);
  });

  it("runs a callback ref's own cleanup and never hands that ref null", () => {
    const released = vi.fn();
    const callback = vi.fn((node: string | null) => {
      void node;
      return released;
    });
    const cleanup = mergeRefs(createRef<string>(), callback)("node");

    (cleanup as () => void)();
    expect(released).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls).toEqual([["node"]]);
  });

  it("passes null on when it is called with null, and returns no cleanup then", () => {
    const object = createRef<string>();
    const callback = vi.fn<(node: string | null) => void>();
    const merged = mergeRefs(object, callback);
    merged("node");

    expect(merged(null)).toBeUndefined();
    expect(object.current).toBeNull();
    expect(callback.mock.calls).toEqual([["node"], [null]]);
  });

  it("leaves a missing ref out", () => {
    const object = createRef<string>();
    const cleanup = mergeRefs(object, undefined)("node");
    expect(object.current).toBe("node");
    (cleanup as () => void)();
    expect(object.current).toBeNull();
  });
});
