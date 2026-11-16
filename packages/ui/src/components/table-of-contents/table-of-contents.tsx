"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/collapsible/collapsible";
import { cn } from "@/lib/cn";

export type TocItem = {
  /** The id of the heading the entry leads to. */
  id: string;
  label: ReactNode;
  /** 2 for a section, 3 for a part of it. */
  depth?: 2 | 3 | 4;
};

/** How long the scroll has to rest after a jump before the reading position counts again. */
const SETTLE_MS = 140;

/**
 * Which section the reader is in: the last heading whose top has passed the line where a jump
 * would put it (the scroll padding of the page, or the heading's scroll margin). Nothing before
 * the first heading. At the very end of the page the last section counts, even if its heading
 * cannot be scrolled up to the line.
 *
 * After a press on an entry the page glides to the heading; until it rests, the pressed entry
 * stays current, so the mark does not sweep over every section on the way.
 */
function useCurrentSection(ids: readonly string[]) {
  const [current, setCurrent] = useState<string | null>(null);
  const held = useRef<string | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (ids.length === 0) return;
    const root = document.documentElement;
    let frame = 0;

    const lineOf = (heading: HTMLElement) =>
      Math.max(
        parseFloat(getComputedStyle(root).scrollPaddingTop) || 0,
        parseFloat(getComputedStyle(heading).scrollMarginTop) || 0,
      );

    let line = 0;
    const measureLine = () => {
      const first = ids.map((id) => document.getElementById(id)).find(Boolean);
      line = first ? lineOf(first) : 0;
    };

    const read = () => {
      frame = 0;
      if (held.current) return;
      let found: string | null = null;
      for (const id of ids) {
        const heading = document.getElementById(id);
        if (!heading) continue;
        // A few pixels of give: a jump lands the heading on the line, give or take rounding.
        if (heading.getBoundingClientRect().top <= line + 4) found = id;
        else break;
      }
      const atEnd = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      if (atEnd && found) found = ids[ids.length - 1] ?? found;
      setCurrent(found);
    };

    const onScroll = () => {
      if (held.current) {
        clearTimeout(settle.current);
        settle.current = setTimeout(() => {
          held.current = null;
          read();
        }, SETTLE_MS);
        return;
      }
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onResize = () => {
      measureLine();
      onScroll();
    };

    measureLine();
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [ids]);

  /** An entry was pressed: it is current at once, and stays so until the page has settled. */
  function hold(id: string) {
    held.current = id;
    setCurrent(id);
    clearTimeout(settle.current);
    // If the page does not move at all (the heading is already there), let go anyway.
    settle.current = setTimeout(() => {
      held.current = null;
    }, SETTLE_MS * 6);
  }

  return [current, hold] as const;
}

/** Brings an entry into view inside the box that scrolls the contents, never the page. */
function keepInView(link: HTMLElement) {
  let box = link.parentElement;
  while (box && box !== document.body) {
    const { overflowY } = getComputedStyle(box);
    if (overflowY === "auto" || overflowY === "scroll") break;
    box = box.parentElement;
  }
  if (!box || box === document.body) return;
  const top = link.offsetTop - box.offsetTop;
  if (top < box.scrollTop + 24) box.scrollTop = Math.max(0, top - 24);
  else if (top + link.offsetHeight > box.scrollTop + box.clientHeight - 24)
    box.scrollTop = top + link.offsetHeight - box.clientHeight + 24;
}

export type TableOfContentsProps = Omit<ComponentProps<"nav">, "children" | "title"> & {
  items: readonly TocItem[];
  /** The visible name of the list, which also names the navigation ("Auf dieser Seite"). */
  title?: string;
  /**
   * Folded under its title, for a narrow window where it stands above the text instead of
   * beside it. It does not follow the reading position there.
   */
  collapsible?: boolean;
  /**
   * The id of the section being read, when the app tracks it itself. Without it the list reads
   * the scroll position of the window.
   */
  current?: string | null;
};

const indent: Record<NonNullable<TocItem["depth"]>, string> = {
  2: "",
  3: "pl-3",
  4: "pl-6",
};

/**
 * The sections of the page the reader is on, beside the text on a wide window. A hairline runs
 * along the list, and a 2px piece of it in the text colour stands by the section being read: it
 * glides from one entry to the next as the page scrolls (`glide`). A press on an entry goes there.
 *
 * Give it the page's second- and third-level headings, worded as they stand. On a narrow window
 * set it `collapsible` above the text.
 */
export function TableOfContents({
  items,
  title = "Auf dieser Seite",
  collapsible = false,
  current: controlled,
  className,
  ...props
}: TableOfContentsProps) {
  const titleId = useId();
  const ids = useStableIds(items);
  // The window is read only when nobody else says where the reader is.
  const readsWindow = controlled === undefined && !collapsible;
  const [read, hold] = useCurrentSection(readsWindow ? ids : NO_IDS);
  const current = controlled !== undefined ? controlled : read;
  const list = useRef<HTMLOListElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const box = list.current;
    if (collapsible || !box) return;
    const link = current
      ? box.querySelector<HTMLElement>(`a[href="#${CSS.escape(current)}"]`)
      : null;
    if (!link) {
      setMark(null);
      return;
    }
    const place = () => setMark({ top: link.offsetTop, height: link.offsetHeight });
    place();
    keepInView(link);
    // Entries change height when the font arrives or the column narrows: place the mark again.
    const resized = new ResizeObserver(place);
    resized.observe(box);
    return () => resized.disconnect();
  }, [current, collapsible]);

  const entries = (
    <ol
      ref={list}
      data-slot="toc-list"
      className={cn("relative flex flex-col", !collapsible && "border-l border-hairline")}
    >
      {items.map((item) => (
        <li key={item.id} className={indent[item.depth ?? 2]}>
          <a
            href={`#${item.id}`}
            data-slot="toc-link"
            aria-current={!collapsible && current === item.id ? "location" : undefined}
            onClick={() => hold(item.id)}
            className={cn(
              "block rounded-xs py-1 text-sm text-pretty text-fg-muted transition-colors duration-150 ease-out hover:text-fg aria-[current=location]:text-fg",
              !collapsible && "pl-3.5",
              "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent",
            )}
          >
            {item.label}
          </a>
        </li>
      ))}
      {!collapsible ? (
        <span
          aria-hidden
          data-slot="toc-mark"
          data-shown={mark ? "" : undefined}
          style={
            {
              "--toc-top": `${mark?.top ?? 0}px`,
              "--toc-height": `${mark?.height ?? 0}px`,
            } as CSSProperties
          }
          // Over the hairline, a pixel to each side of it. Placed from the entry's measured
          // offset and moved by `translate`; its height follows the entry, like a tab highlight's
          // width.
          className="pointer-events-none absolute top-0 -left-px h-(--toc-height) w-0.5 translate-y-(--toc-top) bg-rule opacity-0 transition-[translate,height,opacity] spring-glide data-shown:opacity-100 motion-reduce:transition-[opacity] forced-colors:bg-[CanvasText]"
        />
      ) : null}
    </ol>
  );

  if (collapsible) {
    return (
      <nav data-slot="toc" data-collapsible="" aria-label={title} className={className} {...props}>
        <Collapsible>
          <CollapsibleTrigger>{title}</CollapsibleTrigger>
          <CollapsiblePanel>
            <div className="pt-1 pb-2 pl-5">{entries}</div>
          </CollapsiblePanel>
        </Collapsible>
      </nav>
    );
  }

  return (
    <nav data-slot="toc" aria-labelledby={titleId} className={className} {...props}>
      <p id={titleId} className="pb-3 text-sm font-semibold text-fg">
        {title}
      </p>
      {entries}
    </nav>
  );
}

const NO_IDS: readonly string[] = [];

/** The ids as one array that only changes when they do, so the reader is not set up anew. */
function useStableIds(items: readonly TocItem[]) {
  const key = items.map((item) => item.id).join("\n");
  return useMemo(() => (key ? key.split("\n") : NO_IDS), [key]);
}
