/**
 * Visual capture for the Storybook workshop: the loop every design change goes through.
 *
 *   node scripts/visual/capture.ts [shots|states|motion|all] [options]
 *
 *   shots   one PNG per story and variant, plus a contact sheet per component (default)
 *   states  rest / hover / keyboard focus / pressed of each story's main control, as one strip
 *   motion  frame strips of the transitions a story declares in `parameters.visual.motion`
 *
 * Options
 *   --url <origin>       a running Storybook (default http://127.0.0.1:6006)
 *   --static <dir>       serve a `storybook build` from disk instead (no port, no server)
 *   --only a,b           keep stories whose id or title contains one of these
 *   --grounds a,b|all    grounds to render (default paper,ink)
 *   --vary key=a,b       add a toolbar global as a further variant axis (repeatable)
 *   --set key=value      pin a toolbar global for the whole run (repeatable)
 *   --frames <n>         frames per motion strip (default 8)
 *   --scale <n>          device pixel ratio (default 2)
 *   --out <dir>          output directory (default .visual)
 *   --smoke              render everything, fail on story or console errors, write nothing
 *   --verbose            print each step (for finding out where a run hangs)
 *   --viewport WxH       override every story's viewport (to check a layout at a real window size)
 *   --touch              a phone: 390 by 844, touch input, `pointer: coarse`; shots show the whole page
 *   --device <name>      a Playwright device descriptor instead ("iPhone 14"); implies --touch
 *   --full-page          shoot the whole scrollable page, not only the viewport
 *   --no-sheets          write the single shots only, no contact sheets
 *   --stable             retake each shot until two in a row are identical (for baselines)
 *   --include-skipped    also take stories tagged `visual-skip` (the Lab boards)
 *
 * Engines: VISUAL_BROWSER=chromium|chrome|webkit|firefox, or a comma list of them. With several,
 * every story is drawn by each engine in turn and the sheet gets one column per engine and ground.
 * `chrome` is the system's Chrome; the others are Playwright's own builds
 * (`bunx playwright install chromium webkit firefox`).
 *
 * Stories steer the capture through `parameters.visual`:
 *   viewport  { width, height }       the iframe size (default 720 by 480)
 *   clip      "content" | "viewport"  crop to the rendered content (default) or keep the viewport
 *   target    CSS selector            the control used for `states` (default: first control)
 *   motion    [{ name, click | hover | press: selector, frames? }]
 *   skip      true                    leave the story out
 *
 * Stories with a `play` function (Storybook tags them `play-fn`) are interaction tests, not
 * pictures: they are left out, as are stories tagged `visual-skip`.
 *
 * Runs under Node's type stripping (not bun), which is what Playwright supports.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  chromium,
  devices,
  firefox,
  type Page,
  webkit,
} from "playwright";

type Mode = "shots" | "states" | "motion" | "all";
/** Stills (shots, states) and motion strips are taken in separate browser contexts. */
type Pass = "stills" | "motion";
type Clip = { x: number; y: number; width: number; height: number };
type MotionSpec = { name: string; click?: string; hover?: string; press?: string; frames?: number };
type VisualParams = {
  viewport?: { width: number; height: number };
  clip?: "content" | "viewport";
  target?: string;
  motion?: MotionSpec[];
  skip?: boolean;
};
type IndexEntry = { id: string; title: string; name: string; type: string; tags?: string[] };
type Variant = { label: string; globals: Record<string, string> };
type Tile = { label: string; png: Buffer; width: number };
/** A strip of tiles (states, motion frames) that still has to be laid out as one image. */
type Strip = { file: string; title: string; tiles: Tile[] };

const ENGINES = ["chromium", "chrome", "webkit", "firefox"] as const;
type Engine = (typeof ENGINES)[number];

const ALL_GROUNDS = ["paper", "tint", "ink", "indigo"];
const DEFAULT_VIEWPORT = { width: 720, height: 480 };
const PHONE_VIEWPORT = { width: 390, height: 844 };
// localhost, because it is a secure context: the clipboard (a copy button) exists only there.
const STATIC_ORIGIN = "http://localhost";
const CONTROL_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="combobox"], a[href]';
const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

// --- arguments -----------------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const options = {
    mode: "shots" as Mode,
    url: "http://127.0.0.1:6006",
    staticDir: undefined as string | undefined,
    only: [] as string[],
    grounds: ["paper", "ink"],
    vary: [] as { key: string; values: string[] }[],
    set: {} as Record<string, string>,
    frames: 8,
    scale: 2,
    scaleGiven: false,
    out: ".visual",
    smoke: false,
    verbose: false,
    viewport: undefined as { width: number; height: number } | undefined,
    touch: false,
    device: undefined as string | undefined,
    fullPage: false,
    sheets: true,
    stable: false,
    includeSkipped: false,
  };
  const args = [...argv];
  const next = (flag: string) => {
    const value = args.shift();
    if (value === undefined) throw new Error(`${flag} needs a value`);
    return value;
  };
  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "shots" || arg === "states" || arg === "motion" || arg === "all")
      options.mode = arg;
    else if (arg === "--url") options.url = next(arg).replace(/\/$/, "");
    else if (arg === "--static") options.staticDir = resolve(next(arg));
    else if (arg === "--only") options.only = next(arg).split(",").filter(Boolean);
    else if (arg === "--grounds") {
      const value = next(arg);
      options.grounds = value === "all" ? ALL_GROUNDS : value.split(",");
    } else if (arg === "--vary") {
      const [key, values] = next(arg).split("=");
      if (!key || !values) throw new Error("--vary expects key=a,b");
      options.vary.push({ key, values: values.split(",") });
    } else if (arg === "--set") {
      const [key, value] = next(arg).split("=");
      if (!key || value === undefined) throw new Error("--set expects key=value");
      options.set[key] = value;
    } else if (arg === "--frames") options.frames = Number(next(arg));
    else if (arg === "--scale") {
      options.scale = Number(next(arg));
      options.scaleGiven = true;
    } else if (arg === "--out") options.out = next(arg);
    else if (arg === "--smoke") options.smoke = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--viewport") {
      const [width, height] = next(arg).split("x").map(Number);
      if (!width || !height) throw new Error("--viewport expects WIDTHxHEIGHT");
      options.viewport = { width, height };
    } else if (arg === "--touch") options.touch = true;
    else if (arg === "--device") options.device = next(arg);
    else if (arg === "--full-page") options.fullPage = true;
    else if (arg === "--no-sheets") options.sheets = false;
    else if (arg === "--stable") options.stable = true;
    else if (arg === "--include-skipped") options.includeSkipped = true;
    else if (arg !== "--") throw new Error(`unknown argument: ${arg}`);
  }
  if (options.device) {
    const descriptor = devices[options.device];
    if (!descriptor) throw new Error(`--device: Playwright knows no "${options.device}"`);
    options.touch = true;
    options.viewport ??= descriptor.viewport;
    if (!options.scaleGiven) options.scale = descriptor.deviceScaleFactor;
  }
  if (options.touch) {
    // A phone is narrow and its pages are long: lay out at phone width and keep the whole page.
    options.viewport ??= PHONE_VIEWPORT;
    options.fullPage = true;
  }
  return options;
}

function parseEngines(value: string | undefined): Engine[] {
  const names = (value ?? "chromium")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const name of names) {
    if (!ENGINES.includes(name as Engine))
      throw new Error(`VISUAL_BROWSER: unknown engine "${name}" (use ${ENGINES.join(", ")})`);
  }
  return names as Engine[];
}

function buildVariants(options: ReturnType<typeof parseArgs>): Variant[] {
  let variants: Variant[] = options.grounds.map((ground) => ({
    label: ground,
    globals: { ...options.set, ground },
  }));
  for (const { key, values } of options.vary) {
    variants = variants.flatMap((variant) =>
      values.map((value) => ({
        label: `${variant.label} ${value}`,
        globals: { ...variant.globals, [key]: value },
      })),
    );
  }
  return variants;
}

// --- browsers ------------------------------------------------------------------------------------

function launch(engine: Engine): Promise<Browser> {
  if (engine === "webkit") return webkit.launch();
  if (engine === "firefox") return firefox.launch();
  return chromium.launch({
    channel: engine === "chrome" ? "chrome" : undefined,
    // Repeatable pixels. On a GPU, soft shadows come out one colour level apart from run to run;
    // and with partial raster, a region repainted late (a thumb placed after measuring) leaves
    // different anti-aliasing at its border than a full paint. No eye sees either, every
    // comparison trips over both.
    args: ["--disable-gpu", "--disable-partial-raster"],
  });
}

/**
 * Sheets are always laid out by Chromium, so a sheet reads the same whichever engine drew its
 * tiles. Falls back to the system's Chrome where Playwright's own build is not installed.
 */
function launchComposer(engines: Engine[]): Promise<Browser> {
  const useChrome = engines.includes("chrome") || !existsSync(chromium.executablePath());
  return chromium.launch({ channel: useChrome ? "chrome" : undefined });
}

function contextOptions(engine: Engine, pass: Pass): BrowserContextOptions {
  const base: BrowserContextOptions = {
    viewport: options.viewport ?? DEFAULT_VIEWPORT,
    deviceScaleFactor: options.scale,
    // Stills show the settled state; motion strips need the real durations and scrub them.
    reducedMotion: pass === "motion" ? "no-preference" : "reduce",
    // Pinned, so number and date formatting do not depend on the machine that takes the shot.
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    // A copy button shows what happens when the copy worked; headless Chromium refuses the
    // clipboard unless it is granted. The other engines allow it on a click.
    permissions:
      engine === "chromium" || engine === "chrome" ? ["clipboard-read", "clipboard-write"] : [],
  };
  if (!options.touch) return base;
  const descriptor = options.device ? devices[options.device] : undefined;
  return {
    ...base,
    userAgent: descriptor?.userAgent,
    // `hasTouch` is what makes `pointer: coarse` match. Firefox has no mobile emulation.
    hasTouch: true,
    isMobile: engine === "firefox" ? undefined : true,
  };
}

// --- page helpers --------------------------------------------------------------------------------

/** Serves a static Storybook build by intercepting requests, so no port has to be opened. */
async function serveStatic(context: BrowserContext, dir: string) {
  await context.route(`${STATIC_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(dir, pathname === "/" ? "index.html" : decodeURIComponent(pathname));
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "not found" });
    return route.fulfill({
      status: 200,
      contentType: MIME[extname(file)] ?? "application/octet-stream",
      body: await readFile(file),
    });
  });
}

/** The story index: from disk for a static build, from the running Storybook otherwise. */
async function readIndex(): Promise<{ entries: Record<string, IndexEntry> }> {
  if (options.staticDir) {
    const file = join(options.staticDir, "index.json");
    if (!existsSync(file))
      throw new Error(
        `no Storybook build in ${options.staticDir} (run \`bun run build-storybook\`)`,
      );
    return JSON.parse(await readFile(file, "utf8")) as { entries: Record<string, IndexEntry> };
  }
  const response = await fetch(`${options.url}/index.json`).catch(() => undefined);
  if (!response?.ok) {
    throw new Error(
      `no Storybook at ${options.url} (start \`bun run storybook\`, or pass --static storybook-static)`,
    );
  }
  return (await response.json()) as { entries: Record<string, IndexEntry> };
}

function storyUrl(origin: string, id: string, globals: Record<string, string>) {
  const encoded = Object.entries(globals)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return `${origin}/iframe.html?id=${id}&viewMode=story&globals=${encodeURIComponent(encoded)}`;
}

/** Loads a story and waits until it has rendered with its fonts. Returns its visual parameters. */
async function openStory(page: Page, url: string): Promise<VisualParams> {
  await page.setViewportSize(options.viewport ?? DEFAULT_VIEWPORT);
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(
    () =>
      document.body.classList.contains("sb-show-errordisplay") ||
      (document.body.classList.contains("sb-show-main") &&
        (document.getElementById("storybook-root")?.childElementCount ?? 0) > 0),
    undefined,
    { timeout: 20_000 },
  );
  const failed = await page.evaluate(() =>
    document.body.classList.contains("sb-show-errordisplay"),
  );
  if (failed) {
    const message = await page.evaluate(
      () => document.getElementById("error-message")?.textContent ?? "story failed to render",
    );
    throw new Error(message.trim().slice(0, 400));
  }
  const visual = await page.evaluate(
    () => JSON.parse(document.documentElement.dataset.visual ?? "{}") as VisualParams,
  );
  const viewport = options.viewport ?? visual.viewport;
  if (viewport) await page.setViewportSize(viewport);
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 16px "Sofia Sans Variable"'),
      document.fonts.load('italic 400 16px "Sofia Sans Variable"'),
      document.fonts.load('400 13px "JetBrains Mono Variable"'),
    ]);
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
  return visual;
}

/** The box around everything the story drew, including popups portaled to <body>. */
async function contentClip(page: Page, visual: VisualParams): Promise<Clip | undefined> {
  if (visual.clip === "viewport") return undefined;
  return page.evaluate((fullPage) => {
    const pad = 28;
    const roots = [
      ...document.querySelectorAll("#storybook-root > * > *, #storybook-root > * > * *"),
      ...document.querySelectorAll("body > :not(#storybook-root):not(script):not(style) *"),
    ];
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const element of roots) {
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      left = Math.min(left, box.left);
      top = Math.min(top, box.top);
      right = Math.max(right, box.right);
      bottom = Math.max(bottom, box.bottom);
    }
    if (!Number.isFinite(left)) return undefined;
    // A full-page shot may reach below the fold; otherwise the viewport is the limit.
    const root = document.documentElement;
    const maxWidth = fullPage ? Math.max(window.innerWidth, root.scrollWidth) : window.innerWidth;
    const maxHeight = fullPage
      ? Math.max(window.innerHeight, root.scrollHeight)
      : window.innerHeight;
    const x = Math.max(0, Math.floor(left + window.scrollX - pad));
    const y = Math.max(0, Math.floor(top + window.scrollY - pad));
    return {
      x,
      y,
      width: Math.min(maxWidth, Math.ceil(right + window.scrollX + pad)) - x,
      height: Math.min(maxHeight, Math.ceil(bottom + window.scrollY + pad)) - y,
    };
  }, options.fullPage);
}

/**
 * One still. With `--stable` it is retaken until two in a row are byte-identical, which rides out
 * a late image decode or a focus that lands a frame after render.
 */
async function still(page: Page, clip: Clip | undefined, animations: "disabled" | "allow") {
  const take = () =>
    page.screenshot({ clip, fullPage: options.fullPage, animations, caret: "hide" });
  let png = await take();
  if (!options.stable) return png;
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.waitForTimeout(60);
    const again = await take();
    if (again.equals(png)) return again;
    png = again;
  }
  problems.push(`${current}: the picture never settled (five retakes all differed)`);
  return png;
}

/** Lays tiles out as a labelled grid and screenshots it; no image library needed. */
async function composeSheet(
  page: Page,
  title: string,
  columns: string[],
  rows: { label: string; tiles: (Tile | undefined)[] }[],
  scale: number,
): Promise<Buffer> {
  const cell = (tile: Tile | undefined) =>
    tile
      ? `<td><img width="${tile.width / scale}" src="data:image/png;base64,${tile.png.toString("base64")}"></td>`
      : "<td></td>";
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; background: #d9d9de; font: 12px/1.3 ui-monospace, Menlo, monospace; color: #13121c; }
    table { border-collapse: separate; border-spacing: 6px; padding: 6px; }
    th { text-align: left; font-weight: 600; padding: 2px 4px; }
    td { vertical-align: top; }
    td.label { padding: 4px; white-space: nowrap; }
    img { display: block; }
    caption { text-align: left; font-weight: 700; padding: 4px 10px 0; font-size: 13px; }
  </style><table><caption>${title}</caption>
  <tr><th></th>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>
  ${rows
    .map((row) => `<tr><td class="label">${row.label}</td>${row.tiles.map(cell).join("")}</tr>`)
    .join("")}
  </table>`;
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.setContent(html, { waitUntil: "load" });
  return page.locator("table").screenshot();
}

/** Width in pixels, read from the PNG header. */
function pngWidth(png: Buffer) {
  return png.readUInt32BE(16);
}

function withWidth(tiles: { label: string; png: Buffer }[]): Tile[] {
  return tiles.map((tile) => ({ ...tile, width: pngWidth(tile.png) }));
}

// --- capture modes -------------------------------------------------------------------------------

async function captureStates(page: Page, visual: VisualParams, clip: Clip | undefined) {
  // Storybook's own chrome (error display, docs wrapper) holds hidden controls: stay inside the
  // story root and take the first control that is actually visible.
  const target = page
    .locator("#storybook-root")
    .locator(visual.target ?? CONTROL_SELECTOR)
    .filter({ visible: true })
    .first();
  if ((await target.count()) === 0) return undefined;
  // A control that cannot be pointed at (disabled, or a hidden native input) has no states to
  // show. Find that out in a moment instead of waiting for the hover below to time out.
  try {
    await target.hover({ trial: true, timeout: 1500 });
  } catch {
    return undefined;
  }
  const shoot = (label: string) => {
    trace(`  state ${label}`);
    return still(page, clip, "disabled");
  };
  const tiles: { label: string; png: Buffer }[] = [];

  tiles.push({ label: "rest", png: await shoot("rest") });

  await target.hover();
  tiles.push({ label: "hover", png: await shoot("hover") });

  await page.mouse.move(0, 0);
  // Tab switches the page to keyboard modality. Safari does not tab to buttons by default, so the
  // target is then focused directly, asking for the visible ring where the engine lets us.
  await page.keyboard.press("Tab");
  await target.evaluate((element) => {
    if (document.activeElement !== element) (element as HTMLElement).focus({ focusVisible: true });
  });
  tiles.push({ label: "focus", png: await shoot("focus") });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await target.hover();
  await page.mouse.down();
  tiles.push({ label: "pressed", png: await shoot("pressed") });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  return tiles;
}

/**
 * Frame strip of one transition. CSS transitions and Motion's WAAPI animations are paused and
 * scrubbed by `currentTime`, so frames are exact and repeatable. Values Motion drives from
 * JavaScript (layout projection, drag) do not appear in `getAnimations()` and are not covered.
 */
async function captureMotion(page: Page, spec: MotionSpec, visual: VisualParams, frames: number) {
  if (spec.hover) await page.locator(spec.hover).first().hover();
  if (spec.press) {
    await page.locator(spec.press).first().hover();
    await page.mouse.down();
  }
  if (spec.click) await page.locator(spec.click).first().click();

  const duration = await page.evaluate(async () => {
    const deadline = performance.now() + 600;
    while (document.getAnimations().length === 0 && performance.now() < deadline) {
      await new Promise((done) => requestAnimationFrame(done));
    }
    // A few more frames: Base UI removes `data-starting-style` a frame after mount, and a popup
    // that opens on click mounts after the press has already started a transition of its own.
    for (let frame = 0; frame < 3; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
    let end = 0;
    for (const animation of document.getAnimations()) {
      animation.pause();
      end = Math.max(end, Number(animation.effect?.getComputedTiming().endTime ?? 0));
    }
    return end;
  });
  if (duration === 0) return undefined;

  const scrub = (time: number) =>
    page.evaluate(async (t) => {
      for (const animation of document.getAnimations()) {
        // Whatever started since the first pause is held as well.
        animation.pause();
        const end = Number(animation.effect?.getComputedTiming().endTime ?? 0);
        // Stay just short of the end, or the transition finishes and Base UI unmounts the popup.
        animation.currentTime = Math.min(t, Math.max(0, end - 0.5));
      }
      await new Promise((done) => requestAnimationFrame(done));
    }, time);

  await scrub(duration);
  const clip = await contentClip(page, visual);
  const count = spec.frames ?? frames;
  const tiles: { label: string; png: Buffer }[] = [];
  for (let index = 0; index < count; index++) {
    const time = (duration * index) / (count - 1);
    await scrub(time);
    tiles.push({
      label: `${Math.round(time)}ms`,
      png: await page.screenshot({ clip, fullPage: options.fullPage }),
    });
  }
  if (spec.press) await page.mouse.up();
  return tiles;
}

// --- main ----------------------------------------------------------------------------------------

const options = parseArgs(process.argv.slice(2));
function trace(message: string) {
  if (options.verbose) console.error(message);
}
const engines = parseEngines(process.env.VISUAL_BROWSER);
const several = engines.length > 1;
const variants = buildVariants(options);
/** One sheet column per engine and variant; with a single engine the engine is not named. */
const columns = engines.flatMap((engine) =>
  variants.map((variant) => (several ? `${engine} ${variant.label}` : variant.label)),
);
const origin = options.staticDir ? STATIC_ORIGIN : options.url;
const outDir = resolve(options.out);
const want = (mode: Mode) => options.mode === mode || options.mode === "all";

const index = await readIndex();
const stories = Object.values(index.entries).filter(
  (entry) =>
    entry.type === "story" &&
    (options.includeSkipped || !entry.tags?.includes("visual-skip")) &&
    !entry.tags?.includes("play-fn") &&
    (options.only.length === 0 ||
      options.only.some((needle) =>
        `${entry.id} ${entry.title}`.toLowerCase().includes(needle.toLowerCase()),
      )),
);
if (stories.length === 0) throw new Error("no stories match");

if (!options.smoke) {
  for (const folder of ["shots", "sheets", "states", "motion"]) {
    if (want(folder === "sheets" ? "shots" : (folder as Mode))) {
      if (options.only.length === 0)
        await rm(join(outDir, folder), { recursive: true, force: true });
      await mkdir(join(outDir, folder), { recursive: true });
    }
  }
}

const problems: string[] = [];
let current = "";
/** Shot tiles per story, one slot per column, filled engine by engine. */
const shotTiles = new Map<string, (Tile | undefined)[]>();
const strips: Strip[] = [];
const written: string[] = [];
const versions: Record<string, string> = {};

const passes: Pass[] = [];
if (want("shots") || want("states")) passes.push("stills");
if (want("motion") && !options.smoke) passes.push("motion");
/** What the stills pass learned about each story's motion, so the motion pass skips the rest. */
const motionOf = new Map<string, MotionSpec[]>();

for (const [engineIndex, engine] of engines.entries()) {
  const browser = await launch(engine);
  versions[engine] = browser.version();

  for (const pass of passes) {
    const context = await browser.newContext(contextOptions(engine, pass));
    if (options.staticDir) await serveStatic(context, options.staticDir);

    const page = await context.newPage();
    page.on("pageerror", (error) => problems.push(`${current}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`${current}: console.error ${message.text()}`);
    });
    if (options.verbose && options.touch) {
      await page.goto("about:blank");
      const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
      trace(`${engine}: pointer: coarse ${coarse ? "matches" : "does NOT match"}`);
    }

    for (const story of stories) {
      // Known from the stills pass to have nothing to animate: not worth loading again.
      if (pass === "motion" && motionOf.get(story.id)?.length === 0) continue;
      for (const [variantIndex, variant] of variants.entries()) {
        const slug = `${several ? `${engine}-` : ""}${variant.label.replaceAll(" ", "-")}`;
        current = `${story.id} [${several ? `${engine} ` : ""}${variant.label}]`;
        trace(pass === "motion" ? `${current} motion` : current);
        try {
          const visual = await openStory(page, storyUrl(origin, story.id, variant.globals));
          motionOf.set(story.id, visual.skip ? [] : (visual.motion ?? []));
          if (visual.skip) continue;

          if (pass === "motion") {
            for (const [specIndex, spec] of (visual.motion ?? []).entries()) {
              // Every strip starts from a freshly loaded story.
              if (specIndex > 0) {
                await openStory(page, storyUrl(origin, story.id, variant.globals));
              }
              const tiles = await captureMotion(page, spec, visual, options.frames);
              if (!tiles) {
                problems.push(
                  `${current}: motion "${spec.name}" started no CSS or WAAPI animation`,
                );
                continue;
              }
              strips.push({
                file: join(outDir, "motion", `${story.id}--${spec.name}--${slug}.png`),
                title: `${story.title} / ${story.name} · ${spec.name} · ${several ? `${engine} · ` : ""}${variant.label}`,
                tiles: withWidth(tiles),
              });
            }
            continue;
          }

          const clip = await contentClip(page, visual);

          if (want("shots")) {
            const png = await still(page, clip, "disabled");
            const row = shotTiles.get(story.id) ?? [];
            row[engineIndex * variants.length + variantIndex] = {
              label: variant.label,
              png,
              width: pngWidth(png),
            };
            shotTiles.set(story.id, row);
            if (!options.smoke) {
              await mkdir(join(outDir, "shots", story.id), { recursive: true });
              await writeFile(join(outDir, "shots", story.id, `${slug}.png`), png);
            }
          }

          if (want("states") && !options.smoke) {
            const tiles = await captureStates(page, visual, clip);
            if (tiles) {
              strips.push({
                file: join(outDir, "states", `${story.id}--${slug}.png`),
                title: `${story.title} / ${story.name} · ${several ? `${engine} · ` : ""}${variant.label}`,
                tiles: withWidth(tiles),
              });
            }
          }
        } catch (error) {
          problems.push(`${current}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    await context.close();
  }
  // One browser at a time: the machine is short on memory.
  await browser.close();
}

if (!options.smoke) {
  await writeFile(
    join(outDir, "meta.json"),
    `${JSON.stringify(
      {
        engines: versions,
        platform: process.platform,
        arch: process.arch,
        scale: options.scale,
        grounds: options.grounds,
        touch: options.touch,
      },
      null,
      2,
    )}\n`,
  );
}

const sheetsWanted = want("shots") && options.sheets && shotTiles.size > 0;
if (!options.smoke && (strips.length > 0 || sheetsWanted)) {
  const composer = await launchComposer(engines);
  const composerContext = await composer.newContext({ deviceScaleFactor: options.scale });
  const sheetPage = await composerContext.newPage();

  for (const strip of strips) {
    const png = await composeSheet(
      sheetPage,
      strip.title,
      strip.tiles.map((tile) => tile.label),
      [{ label: "", tiles: strip.tiles }],
      options.scale,
    );
    await writeFile(strip.file, png);
    written.push(strip.file);
  }

  if (sheetsWanted) {
    const sheets = new Map<string, { label: string; tiles: (Tile | undefined)[] }[]>();
    for (const story of stories) {
      const tiles = shotTiles.get(story.id);
      if (!tiles?.some(Boolean)) continue;
      const rows = sheets.get(story.title) ?? [];
      rows.push({ label: story.name, tiles: columns.map((_, column) => tiles[column]) });
      sheets.set(story.title, rows);
    }
    for (const [title, rows] of sheets) {
      // Keep sheets small enough to stay legible when viewed: six stories each.
      for (let start = 0; start < rows.length; start += 6) {
        const part = rows.length > 6 ? `-${start / 6 + 1}` : "";
        const png = await composeSheet(
          sheetPage,
          title,
          columns,
          rows.slice(start, start + 6),
          options.scale,
        );
        const file = join(
          outDir,
          "sheets",
          `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}${part}.png`,
        );
        await writeFile(file, png);
        written.push(file);
      }
    }
  }
  await composer.close();
}

console.log(
  `${stories.length} stories × ${columns.length} variants (${columns.join(", ")})${
    options.touch ? `, touch at ${options.viewport?.width}px` : ""
  }`,
);
for (const file of written) console.log(file);
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of [...new Set(problems)]) console.error(`  ${problem}`);
  process.exit(1);
}
