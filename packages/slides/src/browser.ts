import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Browser, Page } from "playwright-core";

/**
 * Which browser draws a deck. By default the Chrome the machine has; nothing is downloaded.
 */
export type BrowserChoice = {
  /** `chrome` (default), `msedge`, or `chromium` for the build Playwright installed itself. */
  channel?: string;
  /** A browser by the path of its program, instead of a channel. */
  executablePath?: string;
};

/** No browser could be started: `playwright-core` is not installed, or Chrome is not. */
export class BrowserUnavailableError extends Error {
  override readonly name = "BrowserUnavailableError";
}

/** The page was opened, and the player in it never said it was done. */
export class DeckNotReadyError extends Error {
  override readonly name = "DeckNotReadyError";
}

/** How long a page may take to say it is done. */
const READY_TIMEOUT = 30_000;

/**
 * The browser the environment asks for: `SLIDES_BROWSER` is a channel (`chrome`, `chromium`,
 * `msedge`) or, with a slash in it, the path of a program. Unset, it is the system's Chrome.
 */
export function browserFromEnv(env: NodeJS.ProcessEnv = process.env): BrowserChoice {
  const asked = env.SLIDES_BROWSER?.trim();
  if (asked === undefined || asked === "") return { channel: "chrome" };
  return /[\\/]/.test(asked) ? { executablePath: asked } : { channel: asked };
}

const firstLine = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split("\n")[0] ?? "";

async function loadPlaywright() {
  try {
    // Only here, and only when a browser is needed: the package is an optional peer.
    return await import("playwright-core");
  } catch (cause) {
    throw new BrowserUnavailableError(
      "playwright-core is not installed (it drives the browser; add it with " +
        "`bun add -d playwright-core` or `npm i -D playwright-core`)",
      { cause },
    );
  }
}

async function launch(choice: BrowserChoice): Promise<Browser> {
  const playwright = await loadPlaywright();
  try {
    return await playwright.chromium.launch({
      headless: true,
      ...(choice.executablePath !== undefined
        ? { executablePath: choice.executablePath }
        : // Playwright's own build has no channel name: it is what `launch` starts without one.
          choice.channel === "chromium"
          ? {}
          : { channel: choice.channel ?? "chrome" }),
    });
  } catch (cause) {
    throw new BrowserUnavailableError(`the browser did not start: ${firstLine(cause)}`, { cause });
  }
}

/**
 * Opens a built file from a temporary folder in a headless browser, with every request but the
 * file itself refused, waits until the player says it is done (`window.__slidesReady === true`)
 * and hands the page to `work`. The folder and the browser are gone afterwards.
 */
async function withPage<T>(
  html: string,
  mode: "print" | "check",
  choice: BrowserChoice,
  work: (page: Page) => Promise<T>,
): Promise<T> {
  const browser = await launch(choice);
  let folder: string | undefined;
  try {
    folder = await mkdtemp(join(tmpdir(), "lf-slides-"));
    const file = join(folder, "deck.html");
    await writeFile(file, html);
    const address = pathToFileURL(file).href;
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await context.setOffline(true);
    await context.route("**/*", (route) => {
      const url = route.request().url();
      return url.split(/[?#]/)[0] === address || url.startsWith("data:")
        ? route.continue()
        : route.abort();
    });
    const page = await context.newPage();
    await page.goto(`${address}?mode=${mode}`);
    try {
      // A function, not a line of text: text would be run with `eval` in the page, which the
      // file's own policy refuses, and the policy stays on while a deck is checked.
      await page.waitForFunction(() => Reflect.get(window, "__slidesReady") === true, undefined, {
        timeout: READY_TIMEOUT,
      });
    } catch (cause) {
      throw new DeckNotReadyError(
        `the deck did not come to rest within ${READY_TIMEOUT / 1000} s ` +
          "(window.__slidesReady never became true)",
        { cause },
      );
    }
    return await work(page);
  } finally {
    await browser.close();
    if (folder !== undefined) await rm(folder, { recursive: true, force: true });
  }
}

/**
 * Draws a built file in check mode and returns what the player measured:
 * `window.__slidesReport`, as the page wrote it. The file has to allow that mode (`deckHtml`
 * with `mode: "check"`, or an audience's file).
 */
export function measureDeck(
  html: string,
  choice: BrowserChoice = browserFromEnv(),
): Promise<unknown> {
  return withPage(html, "check", choice, (page) =>
    page.evaluate((): unknown => Reflect.get(window, "__slidesReport")),
  );
}

/**
 * Prints a built file to a PDF: one page per slide, 1440 by 810pt. The file has to allow print
 * mode, as an audience's file does; hand in that one, so the PDF's source holds no notes.
 */
export function renderPdf(
  html: string,
  options: { browser?: BrowserChoice } = {},
): Promise<Uint8Array> {
  return withPage(html, "print", options.browser ?? browserFromEnv(), async (page) => {
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    return new Uint8Array(pdf);
  });
}
