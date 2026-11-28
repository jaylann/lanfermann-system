import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in page: the system's setting, what is stored, and the mode on <html>. `flipSystem`
 * and `chooseElsewhere` change it as the system and another tab would, and tell whoever listens.
 */
function fakePage({ systemDark = false, stored }: { systemDark?: boolean; stored?: string } = {}) {
  const page = { systemDark, stored, mode: null as string | null };
  const onSystem = new Set<() => void>();
  const onStorage = new Set<(event: { key: string | null }) => void>();
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      get matches() {
        return query === "(prefers-color-scheme: dark)" && page.systemDark;
      },
      addEventListener: (_type: "change", listener: () => void) => onSystem.add(listener),
      removeEventListener: (_type: "change", listener: () => void) => onSystem.delete(listener),
    }),
    localStorage: {
      getItem: () => page.stored ?? null,
      setItem: (_key: string, value: string) => {
        page.stored = value;
      },
    },
    addEventListener: (_type: "storage", listener: (event: { key: string | null }) => void) =>
      onStorage.add(listener),
    removeEventListener: (_type: "storage", listener: (event: { key: string | null }) => void) =>
      onStorage.delete(listener),
  });
  vi.stubGlobal("document", {
    documentElement: {
      getAttribute: () => page.mode,
      setAttribute: (_name: string, value: string) => {
        page.mode = value;
      },
    },
    cookie: "",
  });
  return {
    page,
    flipSystem() {
      page.systemDark = !page.systemDark;
      for (const listener of onSystem) listener();
    },
    chooseElsewhere(theme: string) {
      page.stored = theme;
      for (const listener of onStorage) listener({ key: "lf-theme" });
    },
  };
}

/** The store as a page that has just loaded finds it: its state is the module's. */
async function freshStore() {
  vi.resetModules();
  const { themeStore } = await import("./use-theme");
  return themeStore;
}

afterEach(() => vi.unstubAllGlobals());

describe("themeStore", () => {
  it("follows the system and another tab while something reads it", async () => {
    const browser = fakePage();
    browser.page.mode = "light";
    const store = await freshStore();
    const heard = vi.fn();
    const stop = store.subscribe(heard);
    expect(store.getSnapshot()).toEqual({ theme: "system", mode: "light" });

    browser.flipSystem();
    expect(store.getSnapshot()).toEqual({ theme: "system", mode: "dark" });
    expect(browser.page.mode).toBe("dark");
    expect(heard).toHaveBeenCalledTimes(1);

    browser.chooseElsewhere("light");
    expect(store.getSnapshot()).toEqual({ theme: "light", mode: "light" });
    expect(browser.page.mode).toBe("light");
    stop();
  });

  it("takes over what changed while nothing was reading it", async () => {
    const browser = fakePage();
    browser.page.mode = "light";
    const store = await freshStore();
    // A switch in a menu: read while the menu is open, gone when it closes.
    store.subscribe(() => {})();
    expect(store.getSnapshot()).toEqual({ theme: "system", mode: "light" });

    // Nobody listens: the page cannot follow yet.
    browser.flipSystem();
    expect(browser.page.mode).toBe("light");

    // The menu opens again: the choice shown and the page are the system's again.
    const heard = vi.fn();
    const stop = store.subscribe(heard);
    expect(store.getSnapshot()).toEqual({ theme: "system", mode: "dark" });
    expect(browser.page.mode).toBe("dark");
    expect(heard).toHaveBeenCalledTimes(1);
    stop();

    browser.chooseElsewhere("light");
    const stopAgain = store.subscribe(() => {});
    expect(store.getSnapshot()).toEqual({ theme: "light", mode: "light" });
    expect(browser.page.mode).toBe("light");
    stopAgain();
  });

  it("leaves the page as it is when nothing changed", async () => {
    // A page whose mode something else set (a server from the cookie, the workshop's toolbar).
    const browser = fakePage();
    browser.page.mode = "dark";
    const store = await freshStore();
    expect(store.getSnapshot()).toEqual({ theme: "system", mode: "light" });
    const stop = store.subscribe(() => {});
    expect(browser.page.mode).toBe("dark");
    stop();
    store.subscribe(() => {})();
    expect(browser.page.mode).toBe("dark");
  });
});
