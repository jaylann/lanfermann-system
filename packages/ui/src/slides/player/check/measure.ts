/**
 * Measures the slides of a deck as they are drawn and says what does not hold: a part beyond the
 * content box or the canvas, a box that cuts off its content, a text on more lines than it may
 * take. The geometry is plain numbers (tested without a browser); the walk over the page reads
 * boxes and nothing else.
 */
import { countLines, excerpt } from "./lines";
import type { Sides, SlideIssue } from "./report";

/** A box by its edges, in px. */
export type Box = { top: number; right: number; bottom: number; left: number };

/** The canvas of a slide. */
export const CANVAS: Box = { top: 0, right: 1920, bottom: 1080, left: 0 };
/** Where flow content stands: inside the 128px margins, above the footer row (y 920). */
export const CONTENT: Box = { top: 128, right: 1792, bottom: 920, left: 128 };
/**
 * Up to this far beyond an edge is rounding, in canvas px: the browser rounds a font's ascent and
 * descent to whole px, so a line of text may seem to sit most of a px off the block it fills.
 */
export const TOLERANCE = 1;

/** The smallest box around both. */
export function union(a: Box | null, b: Box | null): Box | null {
  if (!a) return b;
  if (!b) return a;
  return {
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
    left: Math.min(a.left, b.left),
  };
}

/** What of `box` lies inside `clip`, or `null` when nothing does. Without a clip, all of it. */
export function clipTo(box: Box, clip: Box | null): Box | null {
  if (!clip) return box;
  const clipped = {
    top: Math.max(box.top, clip.top),
    right: Math.min(box.right, clip.right),
    bottom: Math.min(box.bottom, clip.bottom),
    left: Math.max(box.left, clip.left),
  };
  return clipped.right > clipped.left && clipped.bottom > clipped.top ? clipped : null;
}

/**
 * A box on the page in the px of its slide's canvas: measured from the slide's corner and divided
 * by the share the slide is drawn at, so a scaled page reports the same numbers.
 */
export function toCanvas(box: Box, slide: Box, scale: number): Box {
  return {
    top: (box.top - slide.top) / scale,
    right: (box.right - slide.left) / scale,
    bottom: (box.bottom - slide.top) / scale,
    left: (box.left - slide.left) / scale,
  };
}

/** How far `box` reaches beyond `limit` per side, in whole tenths of a px, or `null` when it
 * stays inside (give or take `tolerance`). */
export function beyond(box: Box, limit: Box, tolerance = TOLERANCE): Sides | null {
  const by = {
    top: limit.top - box.top,
    right: box.right - limit.right,
    bottom: box.bottom - limit.bottom,
    left: limit.left - box.left,
  };
  if (Object.values(by).every((side) => side <= tolerance)) return null;
  const tenths = (side: number) => (side <= tolerance ? 0 : Math.round(side * 10) / 10);
  return {
    top: tenths(by.top),
    right: tenths(by.right),
    bottom: tenths(by.bottom),
    left: tenths(by.left),
  };
}

/**
 * The box a piece of text takes in its line. The browser reports the box of the font (ascender
 * to descender), which is taller than the line wherever type is set tight: a 72px title on a
 * line of 1.06 would seem to stand 6px above its own block. So a box taller than the line is cut
 * to the line's height around its middle; a shorter one, and a line of no fixed height, stay.
 */
export function lineBox(box: Box, lineHeight: number): Box {
  const height = box.bottom - box.top;
  if (!Number.isFinite(lineHeight) || lineHeight <= 0 || height <= lineHeight) return box;
  const middle = (box.top + box.bottom) / 2;
  return { ...box, top: middle - lineHeight / 2, bottom: middle + lineHeight / 2 };
}

/** Whether a box holds more than it shows: its content is larger by more than 1px. */
export function cutsOff(scroll: number, client: number): boolean {
  return scroll - client > 1;
}

function boxOf(rect: DOMRect): Box | null {
  if (rect.width === 0 && rect.height === 0) return null;
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
}

/** How a report names an element: its `data-slot`, or its tag, and its id. */
export function targetOf(element: Element): string {
  const name = element.getAttribute("data-slot") ?? element.tagName.toLowerCase();
  return element.id ? `${name}#${element.id}` : name;
}

/**
 * The box of everything `element` draws: itself, its text and what stands inside it, each cut to
 * the boxes around it that clip. A part that may leave the canvas (`data-bleed`) and what is not
 * drawn at all count for nothing.
 */
function drawnBox(element: Element, clip: Box | null, scale: number): Box | null {
  if (element.hasAttribute("data-bleed")) return null;
  const style = getComputedStyle(element);
  if (style.display === "none") return null;

  // "normal" is not a number: such a line keeps the box the browser reports.
  const lineHeight = parseFloat(style.lineHeight) * scale;
  const linesOf = (rects: DOMRectList) =>
    Array.from(rects).reduce<Box | null>((all, rect) => {
      const box = boxOf(rect);
      return box ? union(all, lineBox(box, lineHeight)) : all;
    }, null);

  const own =
    style.display === "inline"
      ? linesOf(element.getClientRects())
      : boxOf(element.getBoundingClientRect());
  let drawn = style.visibility === "hidden" || !own ? null : clipTo(own, clip);
  // A drawing is one box: what its shapes do inside it is its own affair.
  if (element instanceof SVGElement) return drawn;

  let inner = clip;
  if (own && (style.overflowX !== "visible" || style.overflowY !== "visible")) {
    const far = Number.POSITIVE_INFINITY;
    const opening: Box = {
      top: style.overflowY === "visible" ? -far : own.top,
      bottom: style.overflowY === "visible" ? far : own.bottom,
      left: style.overflowX === "visible" ? -far : own.left,
      right: style.overflowX === "visible" ? far : own.right,
    };
    inner = clipTo(opening, clip);
    // Clipped away entirely by a box further out: nothing inside can show.
    if (!inner) return drawn;
  }

  for (const child of element.childNodes) {
    if (child instanceof Element) {
      drawn = union(drawn, drawnBox(child, inner, scale));
    } else if (child instanceof Text && /\S/.test(child.data) && style.visibility !== "hidden") {
      // An element's box does not grow with a line that runs out of it; the text's own boxes do.
      const range = document.createRange();
      range.selectNodeContents(child);
      const text = linesOf(range.getClientRects());
      if (text) drawn = union(drawn, clipTo(text, inner));
    }
  }
  return drawn;
}

function isPlaced(element: Element): boolean {
  const { position } = getComputedStyle(element);
  return position === "absolute" || position === "fixed";
}

/** Parts beyond the content box (in the flow) or beyond the canvas (placed, and the footer row). */
function overflowIssues(slide: Element, slideBox: Box, scale: number): SlideIssue[] {
  const issues: SlideIssue[] = [];
  for (const child of slide.children) {
    const drawn = drawnBox(child, null, scale);
    if (!drawn) continue;
    // The footer row is placed on the bottom margin by the frame itself.
    const limit = isPlaced(child) || child.matches('[data-slot="slide-footer"]') ? CANVAS : CONTENT;
    const by = beyond(toCanvas(drawn, slideBox, scale), limit);
    if (by) issues.push({ kind: "overflow", target: targetOf(child), by });
  }
  return issues;
}

/**
 * Boxes inside the slide that hide a part of their own content. Not a box that shows a part of
 * something larger on purpose (`data-crop`: a scene's view onto its world), nor anything inside
 * one: what the camera leaves out is meant to be out.
 */
function clippedIssues(slide: Element): SlideIssue[] {
  const issues: SlideIssue[] = [];
  for (const element of slide.querySelectorAll("*")) {
    if (!(element instanceof HTMLElement) || element.closest("[data-bleed], [data-crop]")) continue;
    const style = getComputedStyle(element);
    const cutX = style.overflowX !== "visible" && cutsOff(element.scrollWidth, element.clientWidth);
    const cutY =
      style.overflowY !== "visible" && cutsOff(element.scrollHeight, element.clientHeight);
    if (cutX || cutY) issues.push({ kind: "clipped", target: targetOf(element) });
  }
  return issues;
}

/** Texts that may take `data-lines` lines and take more. */
function wrapIssues(slide: Element, scale: number): SlideIssue[] {
  const issues: SlideIssue[] = [];
  for (const element of slide.querySelectorAll("[data-lines]")) {
    const maxLines = Number(element.getAttribute("data-lines"));
    if (!Number.isInteger(maxLines) || maxLines < 1) continue;
    const range = document.createRange();
    range.selectNodeContents(element);
    const tops = Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => rect.top);
    // Half the text's size apart is another line. The boxes are the page's, so the size is
    // taken at the share the slide is drawn at.
    const size = parseFloat(getComputedStyle(element).fontSize) * scale;
    const lines = countLines(tops, size / 2);
    if (lines > maxLines) {
      issues.push({
        kind: "wrap",
        target: targetOf(element),
        lines,
        maxLines,
        text: excerpt(element.textContent ?? ""),
      });
    }
  }
  return issues;
}

/** Everything that does not hold on one drawn slide (`data-slot="slide"`). */
export function measureSlide(slide: Element): SlideIssue[] {
  const rect = slide.getBoundingClientRect();
  const slideBox = boxOf(rect);
  if (!slideBox) return [{ kind: "structure", message: "The slide has no size." }];
  const scale = rect.width / CANVAS.right;
  return [
    ...overflowIssues(slide, slideBox, scale),
    ...clippedIssues(slide),
    ...wrapIssues(slide, scale),
  ];
}

/**
 * The steps the parts inside a box are marked with, as the page holds them: the kit's own
 * `data-slides-at` and nothing else. A `data-step` in a deck's markup is the deck's.
 */
export function markedSteps(box: {
  querySelectorAll(selector: string): Iterable<Pick<Element, "getAttribute">>;
}): number[] {
  return Array.from(box.querySelectorAll("[data-slides-at]"), (element) =>
    Number(element.getAttribute("data-slides-at")),
  );
}

/**
 * A part that asks for a step the slide does not have, given the steps its parts are marked
 * with (`markedSteps`) and the steps the player counted for the slide. Such a part would never
 * be shown: the player stops at the slide's last step. It happens where a deck's own component
 * draws a stepped part inside and the slide does not name `steps`.
 */
export function stepIssue(
  marked: readonly number[],
  steps: number,
): Extract<SlideIssue, { kind: "structure" }> | undefined {
  const highest = marked.reduce(
    (most, step) => (Number.isFinite(step) ? Math.max(most, step) : most),
    0,
  );
  if (highest <= steps) return undefined;
  return {
    kind: "structure",
    message: `A part asks for step ${highest}, but the slide has ${steps} ${steps === 1 ? "step" : "steps"}: name \`steps\` on the slide.`,
  };
}

/**
 * The issues of one child of the deck, from the box the check mode puts around it
 * (`data-slides-entry`): it has to be exactly one slide, that slide has to hold, and no part of it
 * may ask for more steps than the player counted for it (`steps`).
 */
export function measureEntry(entry: Element, steps: number): SlideIssue[] {
  const failed = entry.querySelector('[data-slot="player-slide-error-message"]');
  if (failed) return [{ kind: "render-error", message: failed.textContent ?? "" }];
  const slides = entry.querySelectorAll('[data-slot="slide"]');
  const [slide] = slides;
  if (!slide) {
    return [{ kind: "structure", message: 'The child renders no element with data-slot="slide".' }];
  }
  const issues = measureSlide(slide);
  const unreachable = stepIssue(markedSteps(entry), steps);
  if (unreachable) issues.unshift(unreachable);
  if (slides.length > 1) {
    issues.unshift({
      kind: "structure",
      message: `The child renders ${slides.length} slides; one child of a deck is one slide.`,
    });
  }
  return issues;
}
