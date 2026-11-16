"use client";

import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/button/button";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ChevronDownGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

import { CodeCopy, type CodeCopyLabels } from "./code-copy";
import { CodeScroll } from "./code-scroll";
import { codeHead, codeRoot } from "./code-surface";

/** Inset of the code from the top of its block, and the height of one line. */
const PAD_Y_REM = 0.75;
const LINE_REM = 1.375;

type CodeBlockFrameProps = CodeCopyLabels & {
  /** The highlighted `<code>` (CodeLines), rendered where the block is: usually the server. */
  children: ReactNode;
  copyText: string;
  lineCount: number;
  title?: string;
  icon: IconSvgElement;
  /** A mark of the caller's own in place of the symbol: a product's logo. */
  mark?: ReactNode;
  /** A shell one-liner without a title: one row, a prompt before the command. */
  prompt: boolean;
  /** The region's name when there is no title. */
  label: string;
  fold?: number;
  foldLabel?: string;
  className?: string;
};

/**
 * The client half of a CodeBlock: its header, the scrolling region, the copy button and the
 * fold. The code itself arrives finished as `children`.
 */
export function CodeBlockFrame({
  children,
  copyText,
  lineCount,
  title,
  icon,
  mark,
  prompt,
  label,
  fold,
  foldLabel,
  className,
  ...labels
}: CodeBlockFrameProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const copy = <CodeCopy text={copyText} codeRef={codeRef} {...labels} />;

  if (prompt) {
    return (
      <div
        data-slot="code-block"
        className={cn(codeRoot, "flex-row items-center pr-1.5", className)}
      >
        <span aria-hidden className="pl-(--code-pad-x) text-fg-muted select-none">
          $
        </span>
        <CodeScroll
          label={label}
          codeRef={codeRef}
          className="flex-1 [--code-pad-x:0.625rem]"
          preClassName="py-[0.5625rem]"
        >
          {children}
        </CodeScroll>
        {copy}
      </div>
    );
  }

  return (
    <div data-slot="code-block" className={cn(codeRoot, className)}>
      {title ? (
        <div data-slot="code-block-header" className={codeHead}>
          {mark ?? <Icon icon={icon} size={14} />}
          <span
            data-slot="code-block-title"
            className="min-w-0 flex-1 truncate font-mono text-fg-body"
          >
            {title}
          </span>
          {copy}
        </div>
      ) : (
        <div className="absolute top-1.5 right-1.5 z-10 rounded-md bg-(--code-face)">{copy}</div>
      )}
      <CodeFold lineCount={lineCount} fold={fold} label={foldLabel}>
        <CodeScroll label={title ?? label} codeRef={codeRef} preClassName="py-3">
          {children}
        </CodeScroll>
      </CodeFold>
    </div>
  );
}

/**
 * Long code shows its first lines and a fade; the trigger below opens the rest. Height is the one
 * layout property animated here, because the page below has to make room (motion.md). It moves
 * on `settle` from the folded height to the measured one and is let go to `auto` when it lands.
 */
function CodeFold({
  lineCount,
  fold,
  label,
  children,
}: {
  lineCount: number;
  fold?: number;
  label?: string;
  children: ReactNode;
}) {
  const folds = fold !== undefined && lineCount > fold + 1;
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const id = useId();
  const folded = `${PAD_Y_REM + ((fold ?? 0) + 0.5) * LINE_REM}rem`;

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !folds) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      body.style.height = `${body.scrollHeight}px`;
      if (still) {
        body.style.height = "auto";
        return;
      }
      const land = (event: TransitionEvent) => {
        if (event.target !== body || event.propertyName !== "height") return;
        body.style.height = "auto";
        body.removeEventListener("transitionend", land);
      };
      body.addEventListener("transitionend", land);
      return () => body.removeEventListener("transitionend", land);
    }
    // From `auto` (or mid-flight) back to the fold: pin the height first, so there is a start.
    body.style.height = `${body.getBoundingClientRect().height}px`;
    void body.offsetHeight;
    body.style.height = folded;
  }, [open, folds, folded]);

  if (!folds) return children;

  return (
    <>
      <div
        ref={bodyRef}
        id={id}
        data-slot="code-block-body"
        data-open={open ? "" : undefined}
        className="relative overflow-hidden transition-[height] spring-settle motion-reduce:transition-none"
        style={{ height: folded }}
      >
        {children}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-b from-transparent to-(--code-face)",
            "transition-opacity spring-settle",
            open && "opacity-0 spring-leave",
          )}
        />
      </div>
      <div className="flex justify-center border-t border-hairline px-2 py-1 font-sans">
        <Button
          variant="quiet"
          size="sm"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
          className="text-fg-muted hover:text-fg"
        >
          {label ?? `${lineCount - (fold ?? 0)} weitere Zeilen`}
          <ChevronDownGlyph
            className={cn(
              "transition-[rotate] spring-seat motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </Button>
      </div>
    </>
  );
}
