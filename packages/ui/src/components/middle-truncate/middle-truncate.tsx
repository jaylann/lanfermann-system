"use client";

import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";

import { fitName } from "@/components/attachment/kinds";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

export type MiddleTruncateProps = Omit<ComponentProps<"span">, "children"> & {
  /** The whole text, as it is read out: „Angebot_Kowalski_Herbst.pdf“. */
  text: string;
  /** How many letters before the extension stay after the ellipsis. */
  keep?: number;
};

/**
 * A name too long for its place, cut in its middle with an ellipsis as a file manager cuts it:
 * the extension and the last letters before it stay, „Angebot_Ko…bst.pdf“. Chosen by Justin
 * (2026-11-20) over a cut at the end and over a fade before the extension, which "looks odd".
 * For file names and other names whose end tells them apart; running text ends in a plain
 * ellipsis.
 *
 * It is as wide as the whole text where that fits, and narrower where its place runs out: the
 * cut is measured in the text's own font and worked out again when the place changes. Assistive
 * tech hears the whole text, never the ellipsis.
 */
export function MiddleTruncate({ text, keep = 3, className, ref, ...props }: MiddleTruncateProps) {
  const room = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  useLayoutEffect(() => {
    const box = room.current;
    const measuring = probe.current;
    if (!box || !measuring) return;
    let live = true;
    let frame = 0;
    const fit = () => {
      // Measured on the page by an unseen copy in the text's own font: measured on a canvas,
      // the cuts left gaps of up to two letters. Layout pixels, so a part that is still
      // growing in measures at its real size.
      const measure = (each: string) => {
        measuring.textContent = each;
        return measuring.offsetWidth;
      };
      // The room is the whole text's width where it fits, so the whole text is checked against
      // it as it is; a cut keeps a pixel to spare, since a width is read rounded.
      const width = box.clientWidth;
      setShown(measure(text) <= width ? text : fitName(text, width - 1, measure, keep));
    };
    fit();
    // A new room is fitted in the next frame, not while the observer reports it: the cut it
    // renders would be a change of layout inside the report.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(box);
    // The web font changes every width.
    void document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, keep]);
  return (
    <span
      ref={mergeRefs(room, ref)}
      data-slot="middle-truncate"
      className={cn("grid min-w-0 grid-cols-[minmax(0,max-content)]", className)}
      {...props}
    >
      <span aria-hidden className="col-start-1 row-start-1 overflow-hidden whitespace-nowrap">
        {shown}
      </span>
      {/* Unseen and out of the layout: where a cut is measured. */}
      <span ref={probe} aria-hidden className="invisible absolute whitespace-nowrap" />
      {/* Unseen, the whole text: it gives the room its width. */}
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 h-0 overflow-hidden whitespace-nowrap"
      >
        {text}
      </span>
      {/* Read out whole: the cut text would be heard with its ellipsis. */}
      <span className="sr-only">{text}</span>
    </span>
  );
}
