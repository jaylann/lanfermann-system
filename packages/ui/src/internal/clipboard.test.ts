import { afterEach, describe, expect, it, vi } from "vitest";

import { readClipboard } from "./clipboard";

function browser(state: PermissionState | "unknown", text = "https://lanfermann.dev/a1") {
  const readText = vi.fn(() => Promise.resolve(text));
  vi.stubGlobal("navigator", {
    permissions: {
      query:
        state === "unknown"
          ? // Safari and Firefox know no `clipboard-read` permission and refuse the question.
            vi.fn(() =>
              Promise.reject(new TypeError("clipboard-read is not a valid permission name")),
            )
          : vi.fn(() => Promise.resolve({ state })),
    },
    clipboard: { readText },
  });
  return readText;
}

describe("readClipboard", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the text where the browser already allows it", async () => {
    const readText = browser("granted");
    await expect(readClipboard()).resolves.toBe("https://lanfermann.dev/a1");
    expect(readText).toHaveBeenCalledOnce();
  });

  it.each(["prompt", "denied", "unknown"] as const)(
    "does not touch the clipboard while the permission is %s, so nothing is asked",
    async (state) => {
      const readText = browser(state);
      await expect(readClipboard()).resolves.toBeNull();
      expect(readText).not.toHaveBeenCalled();
    },
  );

  it("is null when the read itself fails", async () => {
    const readText = browser("granted");
    readText.mockRejectedValueOnce(new DOMException("NotAllowedError"));
    await expect(readClipboard()).resolves.toBeNull();
  });
});
