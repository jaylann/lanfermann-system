/**
 * How a tool that drives the page (the one that prints a deck, the one that checks it, an app
 * that takes a picture of it) knows the page is done: `window.__slidesReady`. It is `false` as
 * soon as this module has loaded and `true`, in every mode, once the view stands with its fonts
 * and pictures and a frame has been drawn since. `data-slides-ready` on <html> says the same to a
 * selector.
 *
 * In check mode `window.__slidesReport` is written first, whole, in the same task: whoever sees
 * `__slidesReady === true` finds the report there. The hub's render spoke waits on this global
 * (the contract is on issue #88): do not turn it into a promise or an event.
 */
import type { PageError, SlidesReport } from "./report";

type SlidesGlobals = {
  __slidesReady?: boolean;
  __slidesReport?: SlidesReport;
};

/** The two faces of the kit, by the family names of their `@font-face` rules. */
export const KIT_FONTS = ["Sofia Sans Variable", "JetBrains Mono Variable"] as const;

// Not on a server: there is no page to be ready.
if (typeof window !== "undefined") {
  const host: Window & SlidesGlobals = window;
  host.__slidesReady = false;
}

/** Says the page is done, with the check's report if there is one. */
export function publish(report: SlidesReport | undefined): void {
  const host: Window & SlidesGlobals = window;
  if (report) host.__slidesReport = report;
  host.__slidesReady = true;
  document.documentElement.setAttribute("data-slides-ready", "");
}

/**
 * Says the page is not done again: a view was taken away, and the next one has to settle first.
 * Without it a tool that changes the mode would read the readiness of the view before.
 */
export function unpublish(): void {
  const host: Window & SlidesGlobals = window;
  host.__slidesReady = false;
  delete host.__slidesReport;
  document.documentElement.removeAttribute("data-slides-ready");
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Resolves once what is inside `root` can be measured or printed: the kit's faces are asked for
 * (a face no text uses yet is not loaded by itself), every font the page waits for is there,
 * every picture is decoded or has failed, and two frames have been drawn since.
 */
export async function whenSettled(root: ParentNode): Promise<void> {
  // The first layout decides which faces the page asks for.
  await nextFrame();
  const faces = KIT_FONTS.flatMap((family) => [`16px "${family}"`, `italic 16px "${family}"`]);
  // A face that cannot be loaded is reported as missing, not thrown.
  await Promise.allSettled(faces.map((face) => document.fonts.load(face)));
  await document.fonts.ready;
  // A picture that fails to decode (a broken file, no source) leaves its box as it is, which is
  // what the check should then measure.
  await Promise.allSettled(Array.from(root.querySelectorAll("img"), (image) => image.decode()));
  await nextFrame();
  await nextFrame();
}

/**
 * Which of the kit's faces the page does not have. `document.fonts.check` alone says yes to a
 * family no `@font-face` names (nothing would have to load), so a loaded face of that name is
 * asked for as well.
 */
export function fontsOfPage(): SlidesReport["fonts"] {
  const loaded = new Set(
    Array.from(document.fonts)
      .filter((face) => face.status === "loaded")
      .map((face) => face.family.replace(/^["']|["']$/g, "")),
  );
  const missing = KIT_FONTS.filter(
    (family) => !loaded.has(family) || !document.fonts.check(`16px "${family}"`),
  );
  return { ready: document.fonts.status === "loaded", missing };
}

/** How many errors a report keeps: a loop that throws must not fill the page's memory. */
const MOST_ERRORS = 50;

function messageOf(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return typeof reason === "string" ? reason : "Unknown error";
}

/**
 * Collects what the page throws from now on, for the report. `stop` ends it.
 */
export function collectErrors(): { errors: PageError[]; stop: () => void } {
  const errors: PageError[] = [];
  const add = (error: PageError) => {
    if (errors.length < MOST_ERRORS) errors.push(error);
  };
  const onError = (event: ErrorEvent) => add({ kind: "error", message: event.message });
  const onRejection = (event: PromiseRejectionEvent) =>
    add({ kind: "unhandledrejection", message: messageOf(event.reason) });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return {
    errors,
    stop() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    },
  };
}
