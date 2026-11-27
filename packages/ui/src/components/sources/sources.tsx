"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";

import { HoverCard, HoverCardContent } from "@/components/hover-card/hover-card";
import { Icon } from "@/components/icon/icon";
import { linkVariants } from "@/components/link/link-variants";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

import { entryId, siteOf, type Source, sourceAt } from "./source-list";

export type { Source } from "./source-list";

type SourcesContextValue = {
  items: readonly Source[];
  base: string;
  card: PreviewCardPrimitive.Handle<number>;
};

const SourcesContext = createContext<SourcesContextValue | null>(null);

function useSources(part: string) {
  const context = useContext(SourcesContext);
  if (!context) throw new Error(`${part} belongs inside Sources.`);
  return context;
}

export type SourcesProps = {
  /** The sources of the answer, in the order of their numbers: the first is 1. */
  items: readonly Source[];
  /** The number whose card is open at first, on its first reference: for a still picture. */
  defaultOpen?: number;
  /** The answer with its `SourceReference`s, and the `SourceList` under it. */
  children: ReactNode;
};

/**
 * The sources of one answer: the numbered references in its sentences and the list under it,
 * kept together so that every number leads somewhere. It draws nothing of its own; put the
 * answer's content (with `SourceReference`s) and a `SourceList` inside.
 *
 * One card serves every reference of the answer. It opens on the first after a moment, so a
 * pointer passing over the text does not open it, and then moves to a neighbour at once.
 */
export function Sources({ items, defaultOpen, children }: SourcesProps) {
  const base = useId().replace(/:/g, "");
  const [card] = useState(() => PreviewCardPrimitive.createHandle<number>());
  useEffect(() => {
    if (defaultOpen === undefined) return;
    const first = document.querySelector<HTMLElement>(
      `[data-sources="${base}"][data-n="${defaultOpen}"]`,
    );
    if (first) card.open(first.id);
    // Only at first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <SourcesContext value={{ items, base, card }}>
      {children}
      <HoverCard handle={card}>
        {({ payload }) => {
          const source = payload === undefined ? undefined : items[payload - 1];
          return source ? <SourceCard source={source} /> : null;
        }}
      </HoverCard>
    </SourcesContext>
  );
}

/** What the card shows: the site, the title, a line or two of the text. */
function SourceCard({ source }: { source: Source }) {
  return (
    <HoverCardContent data-slot="source-card" className="w-80 gap-1.5">
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-fg-muted">
        <Icon icon={Globe02Icon} size={14} />
        <span className="truncate">{siteOf(source)}</span>
      </span>
      <span className="line-clamp-2 font-medium text-fg">{source.title}</span>
      {source.excerpt && (
        <span className="line-clamp-3 text-sm text-pretty text-fg-body">{source.excerpt}</span>
      )}
    </HoverCardContent>
  );
}

/**
 * A footnote's digit: small, raised, in the accent, tight after the word or the stop. Chosen
 * over the digit in a small raised plug on the line (Justin, 2026-11-19).
 */
const referenceLook =
  "relative -top-[0.45em] rounded-xs px-[0.12em] text-[0.72em] leading-none font-semibold text-accent hover:text-accent-hover hover:underline";

export type SourceReferenceProps = Omit<ComponentProps<"a">, "href" | "children"> & {
  /** The source's number: its place in `Sources`' items, from 1. */
  n: number;
  /** Its name for assistive tech: „Quelle 1: Preisliste 2026“. */
  label?: (n: number, title: string) => string;
};

/**
 * A numbered reference after a sentence: a small link in tabular digits to the source's entry
 * in the list under the answer. Under the pointer, or with the keyboard on it, a card shows the
 * site, the title and a line of the text; on a touch screen a tap leads to the entry.
 *
 * A number that has no source is an error, said in the console: the number then stands bare.
 */
export function SourceReference({ n, label, className, ...props }: SourceReferenceProps) {
  const { messages } = useLocale();
  const { items, base, card } = useSources("SourceReference");
  const id = useId();
  const source = items[n - 1];
  useEffect(() => {
    if (!source) sourceAt(items, n);
  }, [source, items, n]);
  if (!source) {
    return (
      <span data-slot="source-reference" data-missing="" className={referenceLook}>
        {n}
      </span>
    );
  }
  return (
    <PreviewCardPrimitive.Trigger
      handle={card}
      payload={n}
      delay={450}
      closeDelay={150}
      id={id}
      data-slot="source-reference"
      data-sources={base}
      data-n={n}
      href={`#${entryId(base, n)}`}
      aria-label={(label ?? messages.sources.label)(n, source.title)}
      className={cn(
        // Smaller than a finger: an invisible target of 44px around it (touch.css).
        "touch-target tabular-nums no-underline select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
        referenceLook,
        className,
      )}
      {...props}
    >
      {n}
    </PreviewCardPrimitive.Trigger>
  );
}

export type SourceListProps = Omit<ComponentProps<"div">, "children"> & {
  /** What stands above the list. */
  title?: string;
  /** Said after a title for assistive tech, since the link opens in a new tab. */
  newTabLabel?: string;
};

/**
 * The sources of the answer, under it: numbered, each a plain link with its site beside it. The
 * entry a reference led to stands on the tint. The links open in a new tab, so the conversation
 * stays where it is.
 */
export function SourceList({ title, newTabLabel, className, ...props }: SourceListProps) {
  const { messages } = useLocale();
  const { items, base } = useSources("SourceList");
  const titleId = `${base}-quellen`;
  return (
    <div
      data-slot="source-list"
      className={cn("mt-1 flex w-full max-w-[42rem] flex-col gap-1.5", className)}
      {...props}
    >
      <p id={titleId} className="text-sm font-medium text-fg-muted">
        {title ?? messages.sources.title}
      </p>
      <ol aria-labelledby={titleId} className="flex flex-col">
        {items.map((source, index) => (
          <li
            key={entryId(base, index + 1)}
            id={entryId(base, index + 1)}
            data-slot="source-entry"
            className="-mx-2 flex scroll-mt-12 items-baseline gap-2.5 rounded-md px-2 py-1 text-control target:bg-tint"
          >
            <span className="w-4 shrink-0 text-right text-sm text-fg-muted tabular-nums">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className={cn(linkVariants({ variant: "quiet" }), "min-w-0 text-fg")}
              >
                {source.title}
                <span className="sr-only">, {newTabLabel ?? messages.sources.newTab}</span>
              </a>
              <span className="text-sm text-fg-muted">{siteOf(source)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
