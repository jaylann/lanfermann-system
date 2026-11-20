"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  type ReactNode,
  type SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { ButtonGroup } from "@/components/button-group/button-group";
import { Icon } from "@/components/icon/icon";
import { MenuContent, MenuItem, MenuLinkItem } from "@/components/menu/menu";
import { ActionArrow } from "@/internal/arrow";
import { writeClipboard } from "@/internal/clipboard";
import { COPY_SHOWN_MS } from "@/internal/copy";
import { ChevronDownGlyph, TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

export type CopyPageProps = Omit<
  ComponentProps<"div">,
  "children" | "aria-label" | "aria-labelledby"
> & {
  /** The page as Markdown, on this site: what is copied, and what "view" opens. */
  href: string;
  /** The button, and the first entry of the menu: the thing, then the action ("Seite kopieren"). */
  label: string;
  /** Under it in the menu: what the copy is, and for whom ("Als Markdown, für eine KI"). */
  description: string;
  /** The second entry: "Als Markdown ansehen". */
  viewLabel: string;
  /** Under it: "Die Seite als reiner Text". */
  viewDescription: string;
  /** The name of the button that opens the menu ("Weitere Möglichkeiten"). */
  moreLabel: string;
  /** Read out once the page is on the clipboard: a full sentence ("Die Seite ist kopiert."). */
  copied: string;
  /** Read out when the clipboard refused or the page could not be loaded. */
  failed: string;
  /** Called once the page has reached the clipboard. */
  onCopied?: () => void;
  /** Opens the menu on the first render: for stories and screenshots. */
  defaultOpen?: boolean;
};

/**
 * Hands a docs page on as Markdown: one raised fitting split in two, the copy and the menu. The
 * copy fetches the page's Markdown and puts it on the clipboard, for a model or an agent; the
 * menu repeats it with a line on what it is, and opens the Markdown in a new tab. Put it at the
 * end of the row above the page's title.
 *
 * It is a `ButtonGroup`, named by its `label`: one part with two keys. Under the pointer the whole
 * fitting lifts and the key under it takes the hover wash; a press moves only the pressed key,
 * which takes the inner shade and goes down while the fitting and the other key stay where they
 * are. A copy is confirmed in the key, as in a code block: the copy symbol
 * shrinks away and the tick draws itself, short leg first, then fades where it stands while the
 * symbol seats back. There is no toast; a screen reader hears one sentence.
 *
 * The chevron turns over while the menu is open, settling with a small bounce; the sheet grows
 * out of it and leaves by fading, as every sheet does. The menu's rows carry a tile with their
 * symbol, and the row under the pointer or the keyboard highlights at once. Copying from the
 * menu closes it and confirms in the key, where the eye goes back to.
 *
 * The Markdown is fetched as soon as a pointer or the keyboard reaches the fitting, so the copy
 * that follows is immediate; where the browser takes a promise for the clipboard (Safari, Chrome)
 * the fetch can finish inside the press. Word the labels as the thing, then the action.
 */
export function CopyPage({
  href,
  label,
  description,
  viewLabel,
  viewDescription,
  moreLabel,
  copied: copiedSentence,
  failed: failedSentence,
  onCopied,
  defaultOpen,
  className,
  onPointerEnter,
  onFocus,
  ...props
}: CopyPageProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // One fetch per page view, started early; a failed one is forgotten so the next try refetches.
  const markdown = useRef<Promise<string>>(undefined);
  const load = () => {
    markdown.current ??= fetch(href).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`);
      return response.text();
    });
    return markdown.current;
  };

  const settle = (next: "copied" | "failed") => {
    clearTimeout(timer.current);
    setState(next);
    timer.current = setTimeout(() => setState("idle"), COPY_SHOWN_MS);
  };

  async function copy() {
    try {
      // The promise keeps the write inside the press while the text may still be on its way.
      await writeClipboard(load());
      settle("copied");
      onCopied?.();
    } catch {
      markdown.current = undefined;
      settle("failed");
    }
  }

  const isCopied = state === "copied";

  return (
    <ButtonGroup
      size="sm"
      aria-label={label}
      data-slot="copy-page"
      // A small fitting with the corners of a default one: it stands alone above a title.
      className={cn("rounded-md", className)}
      onPointerEnter={(event) => {
        void load().catch(() => {});
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        void load().catch(() => {});
        onFocus?.(event);
      }}
      {...props}
    >
      <Button
        data-slot="copy-page-copy"
        data-copied={isCopied ? "" : undefined}
        onClick={() => void copy()}
        className="pr-2.5"
      >
        <span className="relative flex size-4 shrink-0 items-center justify-center">
          <Icon data-slot="copy-page-symbol" icon={Copy01Icon} size={16} className="absolute" />
          {/* The checkbox's tick, a size larger at the same weight: it draws itself in. */}
          <TickGlyph
            data-slot="copy-page-tick"
            width={20}
            height={20}
            strokeWidth={(1.75 * 12) / 20}
            className="absolute"
          />
        </span>
        {label}
      </Button>

      <MenuPrimitive.Root modal={false} defaultOpen={defaultOpen}>
        <MenuPrimitive.Trigger
          render={
            <Button
              data-slot="copy-page-more"
              aria-label={moreLabel}
              className="group/more px-1.5 pointer-coarse:px-2.5"
            />
          }
        >
          <ChevronDownGlyph
            width={12}
            height={12}
            className="text-fg-muted transition-[rotate,color] spring-seat group-hover/more:text-fg group-data-popup-open/more:rotate-180 group-data-popup-open/more:text-fg motion-reduce:transition-none"
          />
        </MenuPrimitive.Trigger>
        <MenuContent align="end" className="w-76 p-1.5">
          <MenuItem onClick={() => void copy()} className={row}>
            <Tile>
              <Icon icon={Copy01Icon} size={16} />
            </Tile>
            <RowText title={label} description={description} />
          </MenuItem>
          <MenuLinkItem href={href} target="_blank" rel="noopener" className={row}>
            <Tile>
              <MarkdownGlyph />
            </Tile>
            <RowText
              title={
                <>
                  {viewLabel}
                  <ActionArrow direction="out" size={12} className="text-fg-muted" />
                </>
              }
              description={viewDescription}
            />
          </MenuLinkItem>
        </MenuContent>
      </MenuPrimitive.Root>

      <span role="status" className="sr-only">
        {state === "copied" ? copiedSentence : state === "failed" ? failedSentence : ""}
      </span>
    </ButtonGroup>
  );
}

/** A row of the menu: a tile, then two lines. It keeps the list's instant highlight. */
const row = "group/row items-center gap-3 px-2 py-2";

function Tile({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      data-slot="copy-page-tile"
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface text-fg-muted inset-ring inset-ring-hairline group-data-highlighted/row:text-fg forced-colors:inset-ring-[CanvasText]"
    >
      {children}
    </span>
  );
}

function RowText({ title, description }: { title: ReactNode; description: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1 text-control leading-tight text-fg">{title}</span>
      <span className="text-sm leading-snug text-fg-muted">{description}</span>
    </span>
  );
}

/** The Markdown mark (an M and a down arrow in a frame), drawn at the icons' weight. */
function MarkdownGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M6 15V9l2.5 3L11 9v6" />
      <path d="M16.5 9v6m-2.5-2.5 2.5 2.5 2.5-2.5" />
    </svg>
  );
}
