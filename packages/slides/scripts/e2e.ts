/**
 * The command line from end to end: the built `dist/cli.js` runs as a process of its own on the
 * fixture decks, and a browser then opens what it wrote, from `file://` and with the network
 * refused. What is proven here is what no unit test can: that the one file runs under its own
 * policy without loading anything, that an audience's file holds no notes, that keys, a touch
 * and a second window move the deck, that a framing page can drive it, and that the PDF has
 * one page per slide, each slide filling its page.
 *
 *   bun run slides:e2e          (from the repository's root; builds the tool first)
 *
 * It needs `@lanfermann/ui` built (`bun install` does that) and a Chrome on the machine.
 * `SLIDES_BROWSER` picks another browser, as for the tool itself: a channel (`chromium` is the
 * build Playwright installed) or the path of a program. Run it outside a sandbox: a browser
 * does not start inside one.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";

import { type BrowserContext, chromium, type Frame, type Page } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = join(root, "dist/cli.js");
const library = join(root, "dist/index.js");
if (!existsSync(cli) || !existsSync(library)) {
  throw new Error(
    "dist/ is missing. Build the tool first: bun run --filter @lanfermann/slides build",
  );
}
const fixture = (name: string) => join(root, "fixtures", name);
const out = await mkdtemp(join(tmpdir(), "lf-slides-e2e-"));

const CANARY = "NOTE-CANARY";
const SLUG = "der-digitale-handschlag";

// The list of what was looked at.
const results: string[] = [];
let failed = 0;
function check(name: string, ok: boolean, detail = ""): void {
  if (!ok) failed += 1;
  results.push(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}
const note = (line: string) => results.push(`     ${line}`);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const recordsOf = (value: unknown) => listOf(value).filter(isRecord);

/** Runs the built command line in the folder the files are written to. */
function slides(...args: string[]) {
  return slidesWith({}, ...args);
}
/** The same, with variables of the environment set for this one process. */
function slidesWith(env: NodeJS.ProcessEnv, ...args: string[]) {
  const run = spawnSync(process.execPath, [cli, ...args], {
    cwd: out,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: run.status, stdout: run.stdout, stderr: run.stderr };
}
const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/**
 * How wide, in points, each slide's ground is drawn on its page: the fill of a 1920 by 1080
 * rectangle in a page's content, through the transformations around it. A slide that fills its
 * page is 1440pt wide. Chromium can shrink every page of a print to fit a document it thinks is
 * wider (down to 2/3): the page stays 1440 by 810pt, but the slide is drawn smaller in its top
 * left corner, so the page boxes alone do not show it.
 */
function groundWidths(pdf: Buffer): number[] {
  const text = pdf.toString("latin1");
  const widths: number[] = [];
  for (const stream of text.matchAll(/>>\s*stream\r?\n/g)) {
    const start = stream.index + stream[0].length;
    let content: string;
    try {
      content = inflateSync(pdf.subarray(start, text.indexOf("endstream", start))).toString(
        "latin1",
      );
    } catch {
      continue; // not deflated, so no page content Chromium writes (a picture)
    }
    // The horizontal scale of the transformation, through `q` (save), `Q` (restore) and `cm`.
    let scale = 1;
    const saved: number[] = [];
    let operands: number[] = [];
    let rectangle: number[] = [];
    for (const token of content.split(/\s+/)) {
      if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(token)) {
        operands.push(Number(token));
        continue;
      }
      if (token === "q") saved.push(scale);
      else if (token === "Q") scale = saved.pop() ?? 1;
      else if (token === "cm" && operands.length === 6)
        scale *= Math.hypot(operands[0] ?? 0, operands[1] ?? 0);
      else if ((token === "f" || token === "f*") && rectangle[2] === 1920 && rectangle[3] === 1080)
        widths.push(Math.round(1920 * scale));
      rectangle = token === "re" ? operands : [];
      operands = [];
    }
  }
  return widths;
}

/*
 * 1. The command line.
 */
{
  const bad = slides("check", fixture("bad-import"));
  check("check bad-import: exits 1", bad.code === 1, `exit ${bad.code}`);
  check(
    "check bad-import: names the import, its line and its column",
    bad.stdout.includes('deck.tsx:2:20 error import "lodash" is not allowed'),
    bad.stdout.trim(),
  );

  const sample = slides("check", fixture("sample"));
  check("check sample: exits 0", sample.code === 0, `exit ${sample.code} ${sample.stderr.trim()}`);
  check(
    "check sample: the layout was checked, and nothing is said",
    sample.stdout.trim() === "check passed: 10 slides, 0 errors, 0 warnings",
    sample.stdout.trim(),
  );

  const json = readJson(slides("check", fixture("sample"), "--json").stdout);
  const report = isRecord(json) ? json.report : undefined;
  const reported = isRecord(report) ? recordsOf(report.slides) : [];
  check(
    "check --json: prints { ok, diagnostics, report, layout } and nothing else",
    isRecord(json) &&
      json.ok === true &&
      listOf(json.diagnostics).length === 0 &&
      isRecord(report) &&
      Object.keys(json).sort().join() === "diagnostics,layout,ok,report",
  );
  check(
    "check --json: says the layout was measured",
    isRecord(json) && json.layout === "checked",
    isRecord(json) ? String(json.layout) : "",
  );
  const asked = slides("check", fixture("sample"), "--browser");
  check(
    "check --browser: passes where a browser is there, with the same line",
    asked.code === 0 && asked.stdout.trim() === "check passed: 10 slides, 0 errors, 0 warnings",
    `exit ${asked.code} ${asked.stdout.trim()}`,
  );
  // A browser that is not there, for these two runs: a pass says what it did not look at.
  const nowhere = { SLIDES_BROWSER: join(out, "no-browser-here") };
  const blind = slidesWith(nowhere, "check", fixture("sample"));
  check(
    "check without a browser: passes with a warning and says the layout was not checked",
    blind.code === 0 &&
      (blind.stdout.trim().split("\n").at(-1) ?? "").startsWith(
        "check passed: 10 slides, 0 errors, 1 warning, layout not checked: no browser started",
      ),
    `exit ${blind.code} ${blind.stdout.trim()}`,
  );
  const blindAsked = slidesWith(nowhere, "check", fixture("sample"), "--browser");
  check(
    "check --browser without a browser: exits 1",
    blindAsked.code === 1 && blindAsked.stdout.includes("check failed: 10 slides, 1 error"),
    `exit ${blindAsked.code} ${blindAsked.stdout.trim()}`,
  );
  check(
    "check --json: the report is ok and has ten slides",
    isRecord(report) && report.ok === true && reported.length === 10,
  );
  check(
    "check --json: each slide of the report has its index, overflow, wraps and errors",
    reported.length === 10 &&
      reported.every(
        (slide, index) =>
          slide.index === index &&
          Array.isArray(slide.overflow) &&
          Array.isArray(slide.wraps) &&
          Array.isArray(slide.errors),
      ),
  );
  if (isRecord(report)) {
    note(
      `report: ok=${String(report.ok)} kit=${String(report.kit)} deck=${JSON.stringify(report.deck)} fonts=${JSON.stringify(report.fonts)}`,
    );
  }

  const pictures = slides("check", fixture("pictures"));
  check(
    "check pictures: exits 0",
    pictures.code === 0,
    `${pictures.stdout.trim()} ${pictures.stderr.trim()}`,
  );

  // A deck that is wrong on purpose: every rule of the layout has to find its case, at the
  // line of the slide it is on.
  const broken = slides("check", fixture("broken"), "--json");
  const brokenJson = readJson(broken.stdout);
  const found = recordsOf(isRecord(brokenJson) ? brokenJson.diagnostics : undefined);
  const at = (line: number) =>
    found
      .filter((diagnostic) => diagnostic.line === line)
      .map((diagnostic) => String(diagnostic.code));
  check("check broken: exits 1", broken.code === 1, `exit ${broken.code}`);
  check(
    "check broken: a title on three lines is layout-wrap",
    at(11).includes("layout-wrap"),
    at(11).join(","),
  );
  check(
    "check broken: a block below y 920 is layout-overflow",
    at(17).includes("layout-overflow"),
    at(17).join(","),
  );
  check(
    "check broken: a placed part beyond the canvas is layout-overflow",
    at(21).includes("layout-overflow"),
    at(21).join(","),
  );
  check(
    "check broken: a box that cuts its text is layout-clipped",
    at(28).includes("layout-clipped"),
    at(28).join(","),
  );
  check(
    "check broken: a line that runs out of its box is layout-overflow",
    at(34).includes("layout-overflow"),
    at(34).join(","),
  );
  check(
    "check broken: a slide that throws is render-error",
    at(40).includes("render-error"),
    at(40).join(","),
  );
  check(
    "check broken: a child that is no slide is structure",
    at(43).includes("structure"),
    at(43).join(","),
  );
  check("check broken: the slide that is fine has no line", at(44).length === 0, at(44).join(","));
  for (const diagnostic of found)
    note(
      `broken ${String(diagnostic.line)}: ${String(diagnostic.code)} ${String(diagnostic.message)}`,
    );

  const audience = slides("build", fixture("sample"), "--audience", "--pdf");
  check("build --audience --pdf: exits 0", audience.code === 0, audience.stderr.trim());
  check(
    "build --audience --pdf: writes <slug>.html and <slug>.pdf into ./slides-out",
    existsSync(join(out, "slides-out", `${SLUG}.html`)) &&
      existsSync(join(out, "slides-out", `${SLUG}.pdf`)),
    audience.stdout.trim(),
  );
  const presenter = slides("build", fixture("sample"), "--presenter");
  check(
    "build --presenter: writes <slug>.presenter.html",
    presenter.code === 0 && existsSync(join(out, "slides-out", `${SLUG}.presenter.html`)),
    presenter.stderr.trim(),
  );
  check(
    "build broken: a deck whose types hold builds, whatever its layout",
    slides("build", fixture("broken"), "--audience").code === 0,
  );
  check("build pictures: builds", slides("build", fixture("pictures"), "--audience").code === 0);
  const motion = slides("check", fixture("motion"));
  check(
    "check motion: steps, a diagram that builds up and two scenes pass the layout",
    motion.stdout.trim() === "check passed: 7 slides, 0 errors, 0 warnings",
    `${motion.stdout.trim()} ${motion.stderr.trim()}`,
  );
  check(
    "build motion: builds, with its PDF",
    slides("build", fixture("motion"), "--audience", "--pdf").code === 0,
  );
  check(
    "build bad-import: is refused, exit 1",
    slides("build", fixture("bad-import"), "--audience").code === 1,
  );
  check(
    "build notes-forms: is refused, exit 1",
    slides("build", fixture("notes-forms"), "--audience").code === 1,
  );

  const packed = slides("pack", fixture("sample"));
  const packageFile = join(out, "slides-out", `${SLUG}.deck.json`);
  check(
    "pack: writes <slug>.deck.json",
    packed.code === 0 && existsSync(packageFile),
    packed.stderr.trim(),
  );
  // The built library, as a server would load it: what it exports is looked at, not assumed.
  const built: unknown = await import(pathToFileURL(library).href);
  const parsePackage = isRecord(built) ? built.parsePackage : undefined;
  let roundTrip = false;
  if (typeof parsePackage === "function" && existsSync(packageFile)) {
    const deck: unknown = Reflect.apply(parsePackage, undefined, [
      await readFile(packageFile, "utf8"),
    ]);
    const source = await readFile(join(fixture("sample"), "deck.tsx"), "utf8");
    roundTrip =
      isRecord(deck) &&
      deck.entry === "deck.tsx" &&
      isRecord(deck.files) &&
      deck.files["deck.tsx"] === source &&
      isRecord(deck.manifest) &&
      deck.manifest.slug === SLUG &&
      deck.manifest.slides === 10;
  }
  check("pack: the package reads back through parsePackage as the same deck", roundTrip);
  check(
    "library: the three functions of the hub's contract are exported",
    isRecord(built) &&
      ["bundleDeck", "typecheckDeck", "deckHtml"].every(
        (name) => typeof built[name] === "function",
      ),
  );
}

const audienceFile = join(out, "slides-out", `${SLUG}.html`);
const presenterFile = join(out, "slides-out", `${SLUG}.presenter.html`);
const brokenFile = join(out, "slides-out", "kaputt.html");
const picturesFile = join(out, "slides-out", "bilder-und-eigene-bauteile.html");
const motionFile = join(out, "slides-out", "vom-suchen-zum-auftrag.html");
const pdfFile = join(out, "slides-out", `${SLUG}.pdf`);
const audienceUrl = pathToFileURL(audienceFile).href;
const presenterUrl = pathToFileURL(presenterFile).href;

/*
 * 2. The files themselves.
 */
if (existsSync(audienceFile) && existsSync(presenterFile) && existsSync(pdfFile)) {
  const audienceHtml = await readFile(audienceFile, "utf8");
  const presenterHtml = await readFile(presenterFile, "utf8");
  check("audience file: holds no word of the canary", !audienceHtml.includes(CANARY));
  check(
    "audience file: holds no notes of any slide",
    !audienceHtml.includes("Langsam sprechen") && !audienceHtml.includes("Festpreise nennen"),
  );
  check("presenter file: holds the canary", presenterHtml.includes(`${CANARY}-7f3a91`));
  check(
    "audience file: carries a policy that lets it load nothing",
    audienceHtml.includes("default-src 'none'") && !audienceHtml.includes("unsafe"),
  );
  check(
    "audience file: carries the notices of what is inside",
    audienceHtml.trimEnd().endsWith("-->") && audienceHtml.includes("SIL Open Font License"),
  );
  note(
    `audience file ${(Buffer.byteLength(audienceHtml) / 1000).toFixed(1)} kB, presenter file ${(Buffer.byteLength(presenterHtml) / 1000).toFixed(1)} kB`,
  );

  const pdf = (await readFile(pdfFile)).toString("latin1");
  const pages = pdf.match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
  const boxes = [...new Set(pdf.match(/\/MediaBox\s*\[[^\]]+\]/g) ?? [])];
  check("pdf: ten pages", pages === 10, `${pages} page(s)`);
  check(
    "pdf: every page is 1440 by 810pt",
    boxes.length === 1 && /\[\s*0\s+0\s+1440\s+810\s*\]/.test(boxes[0] ?? ""),
    boxes.join(" "),
  );
  check("pdf: holds no word of the canary", !pdf.includes(CANARY));
  const grounds = groundWidths(await readFile(pdfFile));
  check(
    "pdf: every slide fills its page, 1440pt wide",
    grounds.length === 10 && grounds.every((width) => width === 1440),
    grounds.join(" "),
  );
  note(`pdf ${(pdf.length / 1000).toFixed(1)} kB`);

  // A scene's camera on one part of its world leaves the other parts placed past the slide's
  // right edge. They are clipped, and the print must not make room for them: Chromium once
  // shrank every page of such a deck to fit them (slides.css, `contain: size`).
  const motionPdf = join(out, "slides-out", "vom-suchen-zum-auftrag.pdf");
  const motionGrounds = existsSync(motionPdf) ? groundWidths(await readFile(motionPdf)) : [];
  check(
    "pdf motion: a scene with parts past the slide's edge does not shrink the pages",
    motionGrounds.length === 7 && motionGrounds.every((width) => width === 1440),
    motionGrounds.join(" "),
  );
} else {
  // Without the files there is nothing to open: say what was looked at so far, and stop.
  check("the files the walk needs were written", false);
  console.log(results.join("\n"));
  console.log(`\n${failed} check(s) FAILED before a browser was opened`);
  await rm(out, { recursive: true, force: true });
  process.exit(1);
}

/*
 * 3. The walk through a browser.
 */
const asked = process.env.SLIDES_BROWSER?.trim() ?? "";
const browser = await chromium.launch({
  headless: true,
  ...(/[\\/]/.test(asked)
    ? { executablePath: asked }
    : asked === "chromium"
      ? {}
      : { channel: asked === "" ? "chrome" : asked }),
});

const requests: string[] = [];
const problems: string[] = [];
function watch(page: Page): void {
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
}
async function newContext(options: { hasTouch?: boolean } = {}): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...options });
  await context.setOffline(true);
  context.on("page", watch);
  return context;
}

// What the player leaves on `window`, read with functions and never with a line of text: text
// would be run with `eval` in the page, and the files' own policy refuses that.
const whenReady = (page: Page) =>
  page.waitForFunction(() => Reflect.get(window, "__slidesReady") === true);
const globalOf = (page: Page, name: string) =>
  page.evaluate((key): unknown => Reflect.get(window, key), name);
const shownSlide = (page: Page | Frame) =>
  page.evaluate(
    () => document.querySelector('[data-slot="stage"] [data-slot="slide"]')?.id ?? null,
  );
const hashIs = async (page: Page, hash: string) => {
  try {
    // The address follows the slide in an effect, a moment after the key: wait for it.
    await page.waitForFunction((wanted) => window.location.hash === wanted, hash, {
      timeout: 2000,
    });
    return true;
  } catch {
    return false;
  }
};
const shows = async (page: Page | Frame, id: string, timeout = 4000) => {
  try {
    await page.waitForFunction(
      (wanted) => document.querySelector('[data-slot="stage"] [data-slot="slide"]')?.id === wanted,
      id,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
};

const context = await newContext();

// Audience.
{
  const page = await context.newPage();
  await page.goto(audienceUrl);
  await page.waitForSelector('[data-slot="slide"]');
  check("audience: the first slide renders", (await shownSlide(page)) === "cover");
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => face.family);
  });
  check(
    "audience: Sofia Sans is loaded from the file",
    fonts.some((family) => family.includes("Sofia")),
  );
  check(
    "audience: the window takes the slide's ground",
    (await page.getAttribute('[data-slot="player"]', "data-slide-ground")) === "ink",
  );
  check(
    "audience: the slide carries its index and its id",
    (await page.getAttribute('[data-slot="stage"] [data-slot="slide"]', "data-slide-index")) ===
      "0" &&
      (await page.getAttribute('[data-slot="stage"] [data-slot="slide"]', "data-slide-id")) ===
        "cover",
  );
  await whenReady(page);
  check(
    "audience: says it is ready, as a boolean",
    (await globalOf(page, "__slidesReady")) === true,
  );

  await page.keyboard.press("ArrowRight");
  check("audience: ArrowRight moves to #/2", await hashIs(page, "#/2"), page.url());
  check("audience: and shows the second slide", (await shownSlide(page)) === "recherche");
  await page.keyboard.press("PageDown");
  await page.keyboard.press("Space");
  check("audience: PageDown and Space step", await hashIs(page, "#/4"));
  await page.keyboard.press("End");
  check("audience: End goes to the last slide", await hashIs(page, "#/10"));
  await page.keyboard.press("Home");
  check("audience: Home goes to the first", await hashIs(page, "#/1"));

  // A swipe, as the stage's handlers see it.
  const swipe = (dx: number) =>
    page.evaluate((distance) => {
      const stage = document.querySelector('[data-slot="stage"]');
      if (!stage) throw new Error("no stage");
      const send = (type: string, x: number) =>
        stage.dispatchEvent(
          new PointerEvent(type, {
            pointerType: "touch",
            isPrimary: true,
            clientX: x,
            clientY: 300,
            bubbles: true,
          }),
        );
      send("pointerdown", 600);
      send("pointerup", 600 + distance);
    }, dx);
  await swipe(-200);
  check("audience: a swipe to the left steps forward", (await shownSlide(page)) === "recherche");
  await swipe(200);
  check("audience: a swipe to the right steps back", (await shownSlide(page)) === "cover");
  await swipe(-30);
  check("audience: a short swipe does nothing", (await shownSlide(page)) === "cover");

  await page.mouse.click(1000, 400);
  check("audience: a click on the right half steps forward", await hashIs(page, "#/2"));
  await page.mouse.click(200, 400);
  check("audience: a click on the left half steps back", await hashIs(page, "#/1"));

  await page.goto(`${audienceUrl}#/befunde`);
  await page.waitForSelector('[data-slot="slide"]');
  check("audience: a deep link by id opens its slide", (await shownSlide(page)) === "befunde");
  check("audience: and keeps the id in the address", new URL(page.url()).hash === "#/befunde");
  await page.evaluate(() => {
    window.location.hash = "#/9";
  });
  check("audience: a hash typed later moves the deck", await shows(page, "angebote"));

  await page.keyboard.press("b");
  check(
    "audience: B replaces the slide by black",
    (await page.locator('[data-slot="player-blackout"]').count()) === 1 &&
      (await page.locator('[data-slot="slide"]').count()) === 0,
  );
  await page.keyboard.press("b");
  check(
    "audience: the PDF link is offered, by the name the build gave it",
    (await page.getAttribute('[data-slot="player-controls"] a', "href")) === `${SLUG}.pdf`,
  );

  await page.goto(`${audienceUrl}?mode=presenter`);
  await page.waitForSelector('[data-slot="player"]');
  check(
    "audience file: ?mode=presenter is refused",
    (await page.getAttribute('[data-slot="player"]', "data-mode")) === "audience",
  );
  await page.close();
}

// A finger on a touch screen: the browser's own touch, not an event made up in the page.
{
  const touch = await newContext({ hasTouch: true });
  const page = await touch.newPage();
  await page.goto(audienceUrl);
  await page.waitForSelector('[data-slot="slide"]');
  const session = await touch.newCDPSession(page);
  const finger = (type: "touchStart" | "touchMove" | "touchEnd", x?: number) =>
    session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: x === undefined ? [] : [{ x, y: 360 }],
    });
  await finger("touchStart", 900);
  for (const x of [800, 700, 600, 500]) await finger("touchMove", x);
  await finger("touchEnd");
  check(
    "touch: a real swipe to the left moves on",
    await shows(page, "recherche"),
    String(await shownSlide(page)),
  );
  await touch.close();
}

// Print: the mode the PDF was made in.
{
  const page = await context.newPage();
  await page.goto(`${audienceUrl}?mode=print`);
  await whenReady(page);
  check(
    "print: every slide stands on the page",
    (await page.locator('[data-slot="slide"]').count()) === 10,
  );
  check(
    "print: every slide carries its index",
    (await page.locator('[data-slot="slide"][data-slide-index]').count()) === 10 &&
      (await page.getAttribute('[data-slot="slide"] >> nth=9', "data-slide-index")) === "9",
  );
  await page.close();
}

// Check: the mode `slides check` reads.
{
  const page = await context.newPage();
  await page.goto(`${audienceUrl}?mode=check`);
  await whenReady(page);
  const report = await globalOf(page, "__slidesReport");
  check(
    "check: the report is there, whole, as soon as the page is ready",
    isRecord(report) && recordsOf(report.slides).length === 10,
  );
  check(
    "check: data-slides-ready is set",
    (await page.getAttribute("html", "data-slides-ready")) !== null,
  );
  await page.close();
}

// The deck that moves: a key takes a step before it takes a slide, the address carries the
// step, and a scene's camera has arrived where its beat points.
if (existsSync(motionFile)) {
  const page = await context.newPage();
  const motionUrl = pathToFileURL(motionFile).href;
  await page.goto(`${motionUrl}#/rueckruf`);
  await whenReady(page);
  const opacityOf = (selector: string) =>
    page.locator(selector).evaluate((element) => getComputedStyle(element).opacity);
  const settled = async (read: () => Promise<string>, wanted: string) => {
    for (let tries = 0; tries < 20; tries += 1) {
      if ((await read()) === wanted) return true;
      await page.waitForTimeout(100);
    }
    return false;
  };
  // The block a `Step` wraps carries the step; the part inside it knows nothing of it.
  const takeaway = '[data-slot="stage"] [data-slides-at="2"]';
  check(
    "motion: what comes at a later step is not shown yet, and keeps its place",
    (await opacityOf(takeaway)) === "0" &&
      ((await page.locator(takeaway).boundingBox())?.height ?? 0) > 0,
  );
  check(
    "motion: a data-step of the deck's own markup is no step: it is shown from the start",
    (await opacityOf('[data-slot="stage"] [data-step="3"]')) === "1",
  );
  await page.keyboard.press("ArrowRight");
  check("motion: ArrowRight takes a step first", await hashIs(page, "#/rueckruf.1"), page.url());
  await page.keyboard.press("ArrowRight");
  check("motion: and the next", await hashIs(page, "#/rueckruf.2"), page.url());
  check(
    "motion: the last step is shown once its transition has run",
    await settled(() => opacityOf(takeaway), "1"),
  );
  await page.keyboard.press("ArrowRight");
  // Two steps, not three: the deck's own `data-step={3}` on this slide is not counted.
  check("motion: after the last step comes the next slide", await shows(page, "leistungen"));
  await page.keyboard.press("ArrowLeft");
  check(
    "motion: stepping back lands on the last step of the slide before",
    // By number: only an address that was opened by id keeps the id.
    await hashIs(page, "#/2.2"),
    page.url(),
  );

  // A scene: at its first beat the whole world is drawn small, at the second the camera is
  // close. The transform is written by the camera's flight, so it is read once it has landed.
  await page.goto(`${motionUrl}#/weg`);
  await page.reload();
  await whenReady(page);
  const scaleOf = () =>
    page
      .locator('[data-slot="stage"] [data-slot="slide-scene-world"]')
      .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a.toFixed(2));
  const far = await scaleOf();
  await page.keyboard.press("ArrowRight");
  check("motion: a scene's beat is a step", await hashIs(page, "#/weg.1"), page.url());
  await page.waitForTimeout(1400);
  const near = await scaleOf();
  check(
    "motion: the camera has moved in on the group the beat names",
    Number(near) > Number(far) && Number(near) >= 0.75,
    `${far} -> ${near}`,
  );
  await page.close();
}

// The deck that is wrong on purpose, in a context of its own: React reports the slide that
// throws on the console, which is meant here.
if (existsSync(brokenFile)) {
  const broken = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await broken.setOffline(true);
  const page = await broken.newPage();
  await page.goto(`${pathToFileURL(brokenFile).href}?mode=check`);
  await whenReady(page);
  const report = await globalOf(page, "__slidesReport");
  const slidesOf = isRecord(report) ? recordsOf(report.slides) : [];
  const kinds = (id: string) =>
    recordsOf(slidesOf.find((slide) => slide.id === id)?.issues)
      .map(
        (issue) =>
          `${String(issue.kind)}${typeof issue.target === "string" ? `:${issue.target}` : ""}`,
      )
      .join(",");
  const has = (id: string, kind: string) => kinds(id).split(",").includes(kind);
  check("broken deck: the report is not ok", isRecord(report) && report.ok === false);
  check(
    "broken deck: a title on three lines is a wrap",
    has("wrap", "wrap:slide-title"),
    kinds("wrap"),
  );
  check(
    "broken deck: a block below y 920 is an overflow",
    has("overflow", "overflow:div#zu-hoch"),
    kinds("overflow"),
  );
  check(
    "broken deck: a placed part beyond the canvas is an overflow",
    has("placed", "overflow:div#daneben"),
    kinds("placed"),
  );
  check(
    "broken deck: a box that cuts its text is clipped",
    has("clipped", "clipped:p#kasten"),
    kinds("clipped"),
  );
  check(
    "broken deck: a line that runs out of its box is an overflow",
    has("nowrap", "overflow:p#lang"),
    kinds("nowrap"),
  );
  check(
    "broken deck: a slide that throws is a render-error",
    has("throws", "render-error"),
    kinds("throws"),
  );
  check(
    "broken deck: a child that is no slide is a structure issue",
    has("no-slide", "structure"),
    kinds("no-slide"),
  );
  check("broken deck: the slide that is fine is fine", kinds("fine") === "", kinds("fine"));
  const wrap = slidesOf.find((slide) => slide.id === "wrap");
  const overflow = slidesOf.find((slide) => slide.id === "overflow");
  const throws = slidesOf.find((slide) => slide.id === "throws");
  check(
    "broken deck: the report sorts each slide's issues into wraps, overflow and errors",
    listOf(wrap?.wraps).length > 0 &&
      listOf(overflow?.overflow).length > 0 &&
      listOf(throws?.errors).length > 0,
  );

  // The deck goes on past the slide that throws.
  await page.goto(`${pathToFileURL(brokenFile).href}#/throws`);
  await page.waitForSelector('[data-slot="player-slide-error"]');
  check(
    "broken deck: the slide that throws shows a note with the message",
    (await page.textContent('[data-slot="player-slide-error-message"]')) === "Kaputt",
  );
  await page.keyboard.press("End");
  check("broken deck: and the deck goes on", (await shownSlide(page)) === "fine");
  await broken.close();
} else {
  check("the broken deck was built", false);
}

// Pictures: part of the file, and drawn under its policy.
if (existsSync(picturesFile)) {
  const page = await context.newPage();
  await page.goto(`${pathToFileURL(picturesFile).href}?mode=print`);
  await whenReady(page);
  const images = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"), (image) => ({
      data: image.src.startsWith("data:image/"),
      drawn: image.naturalWidth > 0,
    })),
  );
  check(
    "pictures: both are data URLs in the file",
    images.length === 2 && images.every((image) => image.data),
  );
  check("pictures: both are drawn", images.length === 2 && images.every((image) => image.drawn));
  await page.close();
} else {
  check("the deck with pictures was built", false);
}

// The policy holds from a file: a script the page did not come with does not run. In a context
// of its own, because the browser reports the refusal on the console.
{
  const locked = await browser.newContext();
  await locked.setOffline(true);
  const page = await locked.newPage();
  const refused: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") refused.push(message.text());
  });
  await page.goto(audienceUrl);
  await page.waitForSelector('[data-slot="slide"]');
  const ran = await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "document.documentElement.dataset.injected = 'yes'";
    document.head.append(script);
    const style = document.createElement("style");
    style.textContent = "html { outline: 3px solid red }";
    document.head.append(style);
    return {
      script: document.documentElement.dataset.injected === "yes",
      style: getComputedStyle(document.documentElement).outlineStyle === "solid",
    };
  });
  check("policy: an inline script the file did not come with does not run", !ran.script);
  check("policy: a stylesheet the file did not come with does not apply", !ran.style);
  check(
    "policy: the browser says it refused both",
    refused.filter((text) => text.includes("Content Security Policy")).length >= 2,
    String(refused.length),
  );
  await locked.close();
}

// Presenter, with the audience's window it opens.
{
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(presenterUrl);
  await page.waitForSelector('[data-slot="player"]');
  check(
    "presenter file: opens the console",
    (await page.getAttribute('[data-slot="player"]', "data-mode")) === "presenter",
  );
  const heading = () => page.locator("h2").first().textContent();
  check("presenter: starts on slide 1", (await heading()) === "Folie 1 von 10");
  const notes = () => page.locator('[data-slot="player-notes"]').textContent();
  check(
    "presenter: shows the notes of the slide",
    ((await notes()) ?? "").includes("Begrüßung."),
    String(await notes()),
  );

  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Publikumsfenster öffnen" }).click(),
  ]);
  await popup.waitForSelector('[data-slot="slide"]');
  const popupUrl = new URL(popup.url());
  check(
    "presenter: the button opens the audience's window of its session",
    popupUrl.searchParams.get("mode") === "audience" &&
      (popupUrl.searchParams.get("session") ?? "") !== "",
    popupUrl.search,
  );
  check(
    "presenter: says how to place the window when it cannot",
    (await page.getByText("Fenster auf den Beamer ziehen, dann F für Vollbild.").count()) === 1,
  );
  // What the window draws: it is the presenter's file, so its script holds the notes, and
  // nothing of them may reach the page.
  const drawn = () => popup.locator('[data-slot="player"]').innerText();
  check(
    "two windows: the audience's window shows no notes",
    (await popup.locator('[data-slot="player-notes"]').count()) === 0 &&
      !(await drawn()).includes("Begrüßung."),
  );

  await page.bringToFront();
  await page.keyboard.press("ArrowRight");
  check("two windows: ArrowRight moves the console", (await heading()) === "Folie 2 von 10");
  check(
    "two windows: and the audience's window",
    await shows(popup, "recherche"),
    String(await shownSlide(popup)),
  );
  await page.keyboard.press("PageDown");
  check("two windows: PageDown in the console moves it on", (await heading()) === "Folie 3 von 10");
  check("two windows: and the audience's window again", await shows(popup, "erster-eindruck"));
  await page.keyboard.press("ArrowRight");
  check(
    "two windows: the canary's notes show in the console only",
    ((await notes()) ?? "").includes(`${CANARY}-7f3a91`) &&
      (await shows(popup, "vertrauen")) &&
      !(await drawn()).includes(CANARY),
  );

  await popup.bringToFront();
  await popup.keyboard.press("PageDown");
  check("two windows: a clicker in the audience's window moves it", await shows(popup, "befunde"));
  check(
    "two windows: and the console, once",
    (await heading()) === "Folie 5 von 10",
    String(await heading()),
  );

  await page.bringToFront();
  await page.keyboard.press("b");
  let black = true;
  try {
    await popup.waitForSelector('[data-slot="player-blackout"]', { timeout: 4000 });
  } catch {
    black = false;
  }
  check("two windows: B turns the audience's window black", black);
  check(
    "two windows: the console keeps the slide and says so",
    (await page.locator('[data-slot="player-console-current"] [data-slot="slide"]').count()) ===
      1 && (await page.getByText("Das Publikum sieht Schwarz").count()) === 1,
  );
  await page.keyboard.press("b");

  // A presenter that is reloaded finds its audience again: the audience says hello again
  // after five seconds of silence, asked every two.
  await page.reload();
  await page.waitForSelector('[data-slot="player"]');
  await page.keyboard.press("End");
  check(
    "two windows: after a reload of the console the audience follows again",
    await shows(popup, "analyse", 12_000),
  );

  await page.keyboard.press("g");
  let grid = true;
  try {
    await page.waitForSelector('[data-slot="player-grid"]', { timeout: 4000 });
  } catch {
    grid = false;
  }
  check("presenter: G opens the grid of all slides", grid);
  await popup.close();
  await page.close();
}

// Framed by another page, as the hub frames it: `sandbox="allow-scripts"` gives the frame an
// origin that cannot be named, and the two pages talk over postMessage alone.
{
  const wrapper = join(out, "wrapper.html");
  const frameOf = (file: string) =>
    [
      "<!doctype html>",
      '<meta charset="utf-8">',
      "<title>A page that frames a deck</title>",
      `<iframe sandbox="allow-scripts" src="${pathToFileURL(file).href}" style="width:960px;height:540px;border:0"></iframe>`,
      "<script>",
      "  window.received = [];",
      '  window.addEventListener("message", (event) => {',
      '    if (event.source === document.querySelector("iframe").contentWindow) window.received.push(event.data);',
      "  });",
      "</script>",
      "",
    ].join("\n");
  await writeFile(wrapper, frameOf(audienceFile));
  const page = await context.newPage();
  const popups: Page[] = [];
  context.on("page", (opened) => popups.push(opened));
  await page.goto(pathToFileURL(wrapper).href);
  const messages = async (): Promise<Record<string, unknown>[]> =>
    recordsOf(await globalOf(page, "received")).filter((message) => message.lfSlides === "embed");
  const until = async (test: (all: Record<string, unknown>[]) => boolean) => {
    for (let waited = 0; waited < 5000; waited += 100) {
      if (test(await messages())) return true;
      await page.waitForTimeout(100);
    }
    return false;
  };
  const last = async (type: string) =>
    (await messages()).findLast((message) => message.type === type);
  const send = (message: object) =>
    page.evaluate(
      (data) => document.querySelector("iframe")?.contentWindow?.postMessage(data, "*"),
      message,
    );

  check("embed: the frame says ready first", await until((all) => all[0]?.type === "ready"));
  const ready = await last("ready");
  check(
    "embed: ready counts the slides and names their ids",
    ready?.count === 10 &&
      recordsOf(ready.slides)
        .map((slide) => slide.id)
        .join(",")
        .startsWith("cover,recherche,"),
    JSON.stringify(ready),
  );
  check(
    "embed: then says its state",
    await until((all) => all.some((message) => message.type === "state")),
  );
  const first = await last("state");
  check(
    "embed: the state names the slide, the count and the black screen",
    first?.index === 0 && first.count === 10 && first.id === "cover" && first.blackout === false,
    JSON.stringify(first),
  );
  await send({ lfSlides: "embed", type: "go", index: 3 });
  check(
    "embed: go moves the deck, and the state follows",
    await until((all) => all.at(-1)?.index === 3 && all.at(-1)?.id === "vertrauen"),
  );
  await send({ lfSlides: "embed", type: "intent", intent: "next" });
  check(
    "embed: an intent steps, and the state follows",
    await until((all) => all.at(-1)?.index === 4 && all.at(-1)?.id === "befunde"),
  );
  await send({ lfSlides: "embed", type: "intent", intent: "blackout" });
  check(
    "embed: the black screen travels in the state",
    await until((all) => all.at(-1)?.blackout === true),
  );
  await send({ lfSlides: "embed", type: "intent", intent: "blackout" });
  const before = (await messages()).length;
  await send({ lfSlides: "other", type: "go", index: 8 });
  await send({ lfSlides: "embed", type: "go", index: "8" });
  await send({ lfSlides: "embed", type: "intent", intent: "fullscreen" });
  await page.waitForTimeout(400);
  const after = await messages();
  check(
    "embed: a message that is none of the two commands moves nothing",
    after.at(-1)?.index === 4 &&
      after.filter((message) => message.type === "state" && message.index === 8).length === 0,
    `${after.length - before} message(s) after`,
  );
  const framed = page.frames().find((frame) => frame !== page.mainFrame());
  check(
    "embed: the frame's deck is where the state says",
    framed !== undefined && (await shownSlide(framed)) === "befunde",
  );

  // The presenter's console in a frame: its button asks the framing page for the window.
  await writeFile(wrapper, frameOf(presenterFile));
  await page.goto(pathToFileURL(wrapper).href);
  check("embed: the framed console says ready too", await until((all) => all[0]?.type === "ready"));
  const framedConsole = page.frames().find((frame) => frame !== page.mainFrame());
  const button = framedConsole?.getByRole("button", { name: "Publikumsfenster öffnen" });
  if (button && (await button.count()) === 1) {
    await button.click();
    check(
      "embed: the console's button asks the framing page for the audience's window",
      await until((all) =>
        all.some((message) => message.type === "intent" && message.intent === "audience-window"),
      ),
    );
  } else {
    check(
      "embed: the framed console offers no window of its own to open",
      (await button?.count()) === 0,
    );
  }
  await page.waitForTimeout(300);
  check("embed: a framed player opens no window", popups.length === 0, `${popups.length} opened`);
  await page.close();
}

await browser.close();

// Nothing but the files themselves: a data URL is part of the file.
const loaded = requests.filter(
  (url) => !url.startsWith("data:") && !url.startsWith(pathToFileURL(out).href),
);
check("no request left the files", loaded.length === 0, loaded.join(", "));
check(
  "every file was opened from a disk",
  requests.some((url) => url.startsWith("file:")),
);
check("no error on any page", problems.length === 0, problems.join(" | "));

console.log(results.join("\n"));
const passed = results.filter((line) => line.startsWith("ok  ")).length;
console.log(
  failed === 0
    ? `\nall ${passed} checks passed`
    : `\n${failed} of ${passed + failed} check(s) FAILED`,
);
if (process.env.SLIDES_E2E_KEEP === undefined) await rm(out, { recursive: true, force: true });
else console.log(`kept: ${out}`);
process.exitCode = failed === 0 ? 0 : 1;
