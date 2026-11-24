import type { SlideInfo } from "./deck-structure";
import { type Diagnostic, quote } from "./types";

/**
 * Turns what the player measured in check mode (`window.__slidesReport`) into lines of the
 * check. The report comes from a page, so nothing about its form is taken for granted: what is
 * not in the form this reads is left out, and a report that is no report at all is one error.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);
const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** `12px at the bottom, 3.5px on the right` */
function sides(by: unknown): string {
  if (!isRecord(by)) return "";
  const words: Record<string, string> = {
    top: "at the top",
    right: "on the right",
    bottom: "at the bottom",
    left: "on the left",
  };
  return Object.entries(words)
    .flatMap(([side, where]) => {
      const amount = count(by[side]);
      return amount !== undefined && amount > 0 ? [`${amount}px ${where}`] : [];
    })
    .join(", ");
}

function issueOf(issue: Record<string, unknown>): { code: string; message: string } {
  const target = quote(text(issue.target) ?? "a part");
  switch (issue.kind) {
    case "overflow": {
      const by = sides(issue.by);
      return {
        code: "layout-overflow",
        // The report does not say which of the two bounds a part broke: a part in the flow
        // is held to the content box, a placed one to the canvas.
        message: `${target} reaches beyond its bounds on the slide${by ? `: ${by}` : ""}`,
      };
    }
    case "clipped":
      return { code: "layout-clipped", message: `${target} cuts off its own content` };
    case "wrap":
      return {
        code: "layout-wrap",
        message:
          `${target} runs to ${count(issue.lines) ?? "too many"} lines, ` +
          `${count(issue.maxLines) ?? "fewer"} at most: ${quote(text(issue.text) ?? "")}`,
      };
    case "render-error":
      return {
        code: "render-error",
        message: `the slide threw while it was drawn: ${quote(text(issue.message) ?? "")}`,
      };
    case "structure":
      return {
        code: "structure",
        message: text(issue.message) ?? "the child of <Deck> is not exactly one slide",
      };
    default:
      return { code: "layout", message: `the player reports ${quote(String(issue.kind))}` };
  }
}

/**
 * The lines of a report. A slide's issues stand at the slide's element in the entry file, which
 * the static reading knows; the report itself counts slides and names their ids.
 */
export function layoutDiagnostics(
  report: unknown,
  slides: readonly SlideInfo[],
  entry: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const add = (place: { line: number; column: number }, code: string, message: string) => {
    const { line, column } = place;
    diagnostics.push({ file: entry, line, column, code, message, severity: "error" });
  };
  const top = { line: 1, column: 1 };
  if (!isRecord(report) || !Array.isArray(report.slides)) {
    add(top, "render-error", "the player wrote no report: the deck did not start");
    return diagnostics;
  }

  report.slides.forEach((slide: unknown, position) => {
    if (!isRecord(slide) || !Array.isArray(slide.issues)) return;
    const index = count(slide.index) ?? position;
    const known = slides[index];
    const name = `slide ${index + 1}${known?.id === undefined ? "" : ` (${quote(known.id)})`}`;
    for (const issue of slide.issues) {
      if (!isRecord(issue)) continue;
      const { code, message } = issueOf(issue);
      add(known ?? top, code, `${name}: ${message}`);
    }
  });

  if (Array.isArray(report.errors)) {
    for (const error of report.errors) {
      if (!isRecord(error)) continue;
      add(top, "render-error", `the page threw: ${quote(text(error.message) ?? "")}`);
    }
  }

  const fonts = isRecord(report.fonts) ? report.fonts : {};
  if (Array.isArray(fonts.missing)) {
    for (const family of fonts.missing) {
      add(top, "font-missing", `the face ${quote(String(family))} did not load`);
    }
  }
  if (fonts.ready === false) add(top, "font-missing", "the page's fonts were not ready");

  // A report that says no and names nothing must not pass as fine.
  if (report.ok === false && diagnostics.length === 0) {
    add(top, "layout", "the player's report is not ok, and it names no issue this tool reads");
  }
  return diagnostics;
}
