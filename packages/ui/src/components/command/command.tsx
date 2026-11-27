"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Chip } from "@/components/chip/chip";
import { useGround } from "@/components/ground/ground";
import { Grow } from "@/components/grow/grow";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { Shortcut, useShortcut } from "@/components/shortcut/shortcut";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { overlayBackdrop } from "@/internal/overlay";
import { listGroupLabel, listItem, listItemDetail } from "@/internal/popup";
import { cn, mergeClassName } from "@/lib/cn";

/** One thing the palette offers: a page to go to, or something to do. */
export type CommandEntry = {
  /** Tells the entries apart. */
  value: string;
  /** What is shown and typed against. */
  label: string;
  /**
   * What leads up to the label, muted, on the same line: the folders above a folder
   * („Bewerbung / Check24 / 2026 / “, with its separator and space). Where the row is too
   * narrow for both it gives way first, from its start, so the label and the nearest of what
   * leads to it stay readable. It is typed against together with the label.
   */
  prefix?: string;
  /** Stands before the label. Give every entry of a list one or none. */
  icon?: IconSvgElement;
  /** Other words it is found by: "neu" and "erstellen" for "Angebot schreiben". */
  keywords?: readonly string[];
  /** A quiet fact at the end of the row: where it belongs, how many there are. */
  detail?: ReactNode;
  /** The shortcut that does the same without the palette, written as `Shortcut` writes one. */
  shortcut?: string;
  /** What choosing it does. The palette closes afterwards. */
  onSelect?: () => void;
  /**
   * Entries of its own. Choosing it then opens them as a second list in the same sheet,
   * instead of closing: "Kunde zuweisen …" opens the customers.
   */
  page?: CommandItems;
  /** The placeholder of the field while its page is open: an example of one of its entries. */
  pagePlaceholder?: string;
  /**
   * Shown, but not to be chosen: where the thing already is, what its state rules out. Say why
   * in `detail` („Hier“). The highlight never starts on it.
   */
  disabled?: boolean;
};

/** Entries that belong together, under their name (`value`). */
export type CommandSection = { value: string; items: readonly CommandEntry[] };

/** What a list holds: entries, or sections of entries. */
export type CommandItems = readonly CommandEntry[] | readonly CommandSection[];

type CommandState = {
  label: string;
  locale: Intl.LocalesArgument | undefined;
  /** The entries of the list that shows: the palette's own, or those of the page that is open. */
  items: CommandItems;
  /** The entries whose pages were opened, the last one being the page that shows. */
  trail: readonly CommandEntry[];
  /** Which way the last change of page went, so the new list comes in from that side. */
  direction: "forward" | "back";
  query: string;
  setQuery: (query: string) => void;
  choose: (entry: CommandEntry) => void;
  back: () => void;
  close: () => void;
  /** Called once the sheet has left: the palette starts from its first list next time. */
  reset: () => void;
};

const CommandContext = createContext<CommandState | null>(null);

function useCommand(part: string): CommandState {
  const state = useContext(CommandContext);
  if (!state) throw new Error(`<${part}> must be used inside a <Command>.`);
  return state;
}

export type CommandProps = {
  /** What the palette offers: entries, or sections of entries. */
  items: CommandItems;
  /** Whether the palette is open (controlled). */
  open?: boolean;
  /** Whether the palette is open at first. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The shortcut that opens and closes it, written as `Shortcut` writes one. `false` for none. */
  shortcut?: string | false;
  /** What stands in the field when the palette opens. Nothing unless set. */
  defaultQuery?: string;
  /** Called with what is typed, for a palette that fetches its entries. */
  onQueryChange?: (query: string) => void;
  /** The name of the palette and of its field for assistive tech. */
  label?: string;
  /** The language entries are compared in while typing (`"de-DE"`). The machine's unless set. */
  locale?: Intl.LocalesArgument;
  /**
   * Whether the page behind is inert. Leave it on: the palette is a dialog. `false` is for a
   * palette that is shown standing open, as in a picture of it.
   */
  modal?: boolean;
  children: ReactNode;
};

/**
 * The command palette: every page and every action of an app, reached by typing a few letters.
 * It opens on ⌘K over whatever one is doing, and leaves as soon as something is chosen. It is
 * for people who know what they want; everything in it must also be reachable by pointing.
 *
 * Give it the entries as `items` and put a `CommandContent` inside, with a `CommandInput`, a
 * `CommandList` and a `CommandFooter`. An entry does something (`onSelect`) or opens a list of
 * its own (`page`). Typing filters by label, `prefix` and keywords, ignoring case and accents.
 *
 * Word an entry like a button, the thing first and the action last ("Angebot schreiben"), or
 * as the place it leads to ("Einstellungen"). An entry that opens a second list ends in an
 * ellipsis ("Kunde zuweisen …").
 */
export function Command({
  items,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  shortcut = "mod+k",
  defaultQuery = "",
  onQueryChange,
  label = "Befehle",
  locale,
  modal = true,
  children,
}: CommandProps) {
  const [kept, setKept] = useState(defaultOpen);
  const open = controlled ?? kept;
  const [trail, setTrail] = useState<readonly CommandEntry[]>([]);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [query, setTyped] = useState(defaultQuery);

  const setOpen = useCallback(
    (next: boolean) => {
      setKept(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const setQuery = useCallback(
    (next: string) => {
      setTyped(next);
      onQueryChange?.(next);
    },
    [onQueryChange],
  );

  useShortcut(shortcut || "mod+k", () => setOpen(!open), { enabled: shortcut !== false });

  const state = useMemo<CommandState>(
    () => ({
      label,
      locale,
      items: trail[trail.length - 1]?.page ?? items,
      trail,
      direction,
      query,
      setQuery,
      choose: (entry) => {
        if (entry.page) {
          setTrail((pages) => [...pages, entry]);
          setDirection("forward");
          setQuery("");
          return;
        }
        entry.onSelect?.();
        setOpen(false);
      },
      back: () => {
        setTrail((pages) => pages.slice(0, -1));
        setDirection("back");
        setQuery("");
      },
      close: () => setOpen(false),
      reset: () => {
        setTrail([]);
        setDirection("forward");
        setQuery("");
      },
    }),
    [label, locale, items, trail, direction, query, setQuery, setOpen],
  );

  return (
    <CommandContext value={state}>
      <DialogPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        modal={modal}
        // Not while it is still fading out: its list would change under the reader's eyes.
        onOpenChangeComplete={(shown) => {
          if (!shown) state.reset();
        }}
      >
        {children}
      </DialogPrimitive.Root>
    </CommandContext>
  );
}

/**
 * A button that opens the palette, for those who do not know the shortcut yet. Render a
 * `Button` through it and show the shortcut inside:
 * `<CommandTrigger render={<Button />}>Suchen <Shortcut keys="mod+k" /></CommandTrigger>`.
 */
export function CommandTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="command-trigger" {...props} />;
}

/**
 * Base UI highlights the first row of a list by itself (when the palette opens, after each
 * letter, on a new page), disabled or not, and Enter then does nothing. It has no prop to steer
 * the highlight, so the first row that can be taken is pointed at instead: a pointer moving
 * onto a row is how Base UI sets the highlight anyway (`highlightItemOnHover`).
 *
 * Only Base UI's own choice is corrected. A disabled row the reader went to with the arrows or
 * the pointer keeps the highlight, as it does in every list of Base UI: the arrows stop on
 * every row, so a screen reader hears the disabled ones and why („Hier“).
 *
 * `rows` is an element around the list; what is returned goes to the autocomplete's root as
 * `onItemHighlighted`.
 */
function useFirstEnabledHighlight(rows: RefObject<HTMLElement | null>) {
  const { query, trail } = useCommand("CommandContent");
  // The row the reader went to by key or pointer, and the list it was in.
  const visited = useRef<{ value: string; query: string; page: number } | null>(null);
  return (entry: CommandEntry | undefined, reason: string) => {
    const here = { query, page: trail.length };
    if (reason !== "none") {
      visited.current = entry ? { value: entry.value, ...here } : null;
      return;
    }
    if (!entry?.disabled) return;
    const kept = visited.current;
    if (kept?.value === entry.value && kept.query === here.query && kept.page === here.page) return;
    // After this commit: Base UI numbers the rows of a new list in a commit of its own.
    queueMicrotask(() => {
      const box = rows.current;
      if (!box?.querySelector('[data-slot="command-item"][data-highlighted][data-disabled]'))
        return;
      const row = box.querySelector<HTMLElement>('[data-slot="command-item"]:not([data-disabled])');
      // WebKit takes a pointer to have moved only if the event says by how much.
      row?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, movementX: 1 }));
    });
  };
}

export type CommandContentProps = DialogPrimitive.Popup.Props;

/**
 * The sheet, with its scrim: the page behind is dimmed as it is behind a dialog. It stands in
 * the upper third of the window, where the eyes are and where a phone's keyboard leaves it
 * alone.
 *
 * It is opened many times a day, mostly from the keyboard, so it does not make an entrance: it
 * is there on `snap`, grown by a fiftieth and without travel, and it leaves by fading.
 */
export function CommandContent({ className, children, ...props }: CommandContentProps) {
  const ground = useGround();
  const { label, locale, items, query, setQuery, close } = useCommand("CommandContent");
  // Base UI's own matcher, set to compare letters by their base: "gart" finds "Gärtnerei". Its
  // default is the locale's search collation, and the German one keeps "ä" apart from "a".
  const { contains } = AutocompletePrimitive.useFilter({
    locale,
    usage: "sort",
    sensitivity: "base",
  });
  const matches = useCallback(
    (entry: CommandEntry, typed: string) =>
      // With what leads up to it: a folder is found by a folder above it, or by a piece of path.
      contains((entry.prefix ?? "") + entry.label, typed) ||
      (entry.keywords?.some((keyword) => contains(keyword, typed)) ?? false),
    [contains],
  );
  const rows = useRef<HTMLDivElement>(null);
  const highlightFirstEnabled = useFirstEnabledHighlight(rows);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="command-backdrop" className={overlayBackdrop} />
      <DialogPrimitive.Viewport
        ref={rows}
        data-slot="command-viewport"
        className="fixed inset-0 z-50 flex max-h-dvh items-start justify-center overflow-hidden px-3 pt-[min(18dvh,9rem)] pb-3"
      >
        <DialogPrimitive.Popup
          data-slot="command-content"
          data-theme={ground}
          aria-label={label}
          className={mergeClassName(
            [
              "relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-sheet text-control text-fg-body depth-overlay outline-hidden",
              "origin-top transition-[opacity,scale] spring-snap",
              // Half of what a popup grows by; none of it under reduced motion.
              "data-starting-style:scale-[calc(1-(1-var(--motion-enter-scale))/2)] data-starting-style:opacity-0",
              "data-ending-style:opacity-0 data-ending-style:spring-leave",
            ],
            className,
          )}
          {...props}
        >
          <AutocompletePrimitive.Root
            // The list is part of the sheet, not a popup of its own, and it always shows.
            open
            inline
            // Entries or sections of entries: Base UI takes both, under two signatures.
            items={items as readonly CommandEntry[]}
            filter={matches}
            locale={locale}
            // Enter always has something to take, and the pointer leaving the list changes nothing.
            autoHighlight="always"
            keepHighlight
            onItemHighlighted={(entry: CommandEntry | undefined, details) =>
              highlightFirstEnabled(entry, details.reason)
            }
            value={query}
            onValueChange={(value, details) => {
              // Choosing an entry would write its label into the field.
              if (details.reason !== "item-press") setQuery(value);
            }}
            onOpenChange={(shown, details) => {
              if (!shown && details.reason === "escape-key") close();
            }}
          >
            {children}
          </AutocompletePrimitive.Root>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

export type CommandInputProps = Omit<AutocompletePrimitive.Input.Props, "className"> & {
  className?: string;
};

/**
 * The field one types into. It has no frame of its own: it is the head of the sheet. A page
 * that was opened stands before the text as a small plug, and Backspace in the empty field
 * goes back out of it.
 *
 * The placeholder is an example of what can be typed ("z. B. Angebot schreiben"), not an
 * instruction.
 */
export function CommandInput({ className, placeholder, onKeyDown, ...props }: CommandInputProps) {
  const { label, trail, query, back } = useCommand("CommandInput");
  const page = trail[trail.length - 1];
  return (
    <div
      data-slot="command-input-row"
      className="flex h-12 shrink-0 items-center gap-2.5 border-b border-hairline px-4"
    >
      <Icon icon={Search01Icon} size={16} className="text-fg-muted" />
      {trail.map((opened) => (
        // The page that was opened, as what was chosen: a chip. It seats in as it appears.
        <Chip
          key={opened.value}
          data-slot="command-page"
          className="max-w-40 shrink-0 delay-0 starting:scale-90 starting:opacity-0"
        >
          {/* The ellipsis said that more follows. Here it has followed. */}
          {opened.label.replace(/\s*…$/, "")}
        </Chip>
      ))}
      <AutocompletePrimitive.Input
        data-slot="command-input"
        aria-label={label}
        // Inside a page the example is one of the page's entries, or there is none.
        placeholder={page ? page.pagePlaceholder : placeholder}
        // The field is the only thing in the sheet that is typed into, and it has the focus for
        // as long as the sheet is there: the caret says so.
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-control text-fg outline-hidden placeholder:text-fg-muted placeholder:italic pointer-coarse:text-base",
          className,
        )}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Backspace" && query === "" && trail.length > 0) {
            event.preventDefault();
            back();
          }
        }}
        {...props}
      />
    </div>
  );
}

/**
 * How a prefix gives way where the row is too narrow for it and the label. `start`: it keeps its
 * end and fades out at its start, so the nearest of what leads to the label stays
 * („…eck24 / 2026 / Zweitgespräch“). `end`: it is cut at its end with an ellipsis, as text
 * usually is („Bewerbung / Che… Zweitgespräch“), which loses the separator before the label.
 */
const PREFIX_GIVES_WAY: "start" | "end" = "start";

/** The prefix, cut at its end: one line with an ellipsis. */
function PrefixCutAtEnd({ text }: { text: string }) {
  return (
    <span
      data-slot="command-item-prefix"
      className="min-w-0 truncate whitespace-pre text-fg-muted group-data-disabled:text-on-disabled"
    >
      {text}
    </span>
  );
}

/**
 * The prefix, keeping its end. A box read from the right starts scrolled to its end, so what
 * does not fit leaves at the left, where the library's own fade says that more came before
 * (`scroll-fade.css`); a box that fits has no fade.
 */
function PrefixFadingAtStart({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null);
  useScrollEdges(box, "x", text);
  return (
    <span
      ref={box}
      dir="rtl"
      data-slot="command-item-prefix"
      data-scroll-fade="x"
      // The fade's side is named here: the stylesheet tells a box read from the right by its
      // language, and this one has none of its own.
      className="min-w-0 overflow-hidden whitespace-pre text-fg-muted [--scroll-fade-size:1.5rem] [--scroll-fade-to:left] group-data-disabled:text-on-disabled"
    >
      <span dir="ltr" className="inline-block">
        {text}
      </span>
    </span>
  );
}

/**
 * A label with what leads up to it, on one line: the prefix is muted and gives way first, the
 * label keeps its whole width for as long as the row has it and is cut at its end only when
 * even it does not fit.
 */
function CommandPath({ prefix, label }: { prefix: string; label: string }) {
  // Cut at its end, the prefix loses its last space to the ellipsis: that one goes with the label.
  const lead = PREFIX_GIVES_WAY === "start" ? prefix : prefix.trimEnd();
  return (
    <span data-slot="command-item-path" className="flex min-w-0 flex-1 overflow-hidden">
      {PREFIX_GIVES_WAY === "start" ? (
        <PrefixFadingAtStart text={lead} />
      ) : (
        <PrefixCutAtEnd text={lead} />
      )}
      <span data-slot="command-item-label" className="max-w-full shrink-0 truncate whitespace-pre">
        {prefix.slice(lead.length)}
        {label}
      </span>
    </span>
  );
}

function CommandRow({ entry }: { entry: CommandEntry }) {
  const { choose } = useCommand("CommandList");
  return (
    <AutocompletePrimitive.Item
      value={entry}
      disabled={entry.disabled}
      onClick={() => choose(entry)}
      data-slot="command-item"
      data-page={entry.page ? "" : undefined}
      className={cn(listItem, "group min-h-(--control-md) scroll-my-1")}
    >
      {entry.icon && (
        <Icon
          icon={entry.icon}
          size={16}
          className="text-fg-muted group-data-disabled:text-on-disabled group-data-highlighted:text-fg"
        />
      )}
      {entry.prefix ? (
        <CommandPath prefix={entry.prefix} label={entry.label} />
      ) : (
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      )}
      {entry.detail !== undefined && <span className={listItemDetail}>{entry.detail}</span>}
      {entry.shortcut && <Shortcut keys={entry.shortcut} className="ml-auto pl-3" />}
      {entry.page && (
        <ChevronRightGlyph
          width={10}
          height={10}
          className="ml-auto text-fg-muted group-data-highlighted:text-fg"
        />
      )}
    </AutocompletePrimitive.Item>
  );
}

function isSection(item: CommandEntry | CommandSection): item is CommandSection {
  return "items" in item;
}

export type CommandListProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * What stands there when nothing matches: one sentence that names the kind of thing that was
   * looked for ("Zu dieser Suche wurde nichts gefunden.").
   */
  empty?: ReactNode;
};

/**
 * The entries that match what was typed, in their sections. The first one that can be chosen is
 * highlighted, so Enter takes it; the arrows move the highlight, which is instant like a menu's,
 * and stop on a disabled entry too, so its reason is read. The list is as tall as what it
 * holds, up to a limit, and the sheet follows it instead of jumping.
 */
export function CommandList({ empty, className, ...props }: CommandListProps) {
  const { trail, direction } = useCommand("CommandList");
  const list = (
    <ScrollFade
      axis="y"
      data-slot="command-scroll"
      className={cn(
        "max-h-[min(22.5rem,calc(100dvh-16rem))] scroll-py-1 overscroll-contain p-1",
        className,
      )}
      {...props}
    >
      <div
        // A page that opens comes in from the side it lies on, by the 4px a popup travels.
        key={trail.length}
        data-slot="command-page-list"
        data-direction={trail.length > 0 || direction === "back" ? direction : undefined}
        className="transition-[opacity,translate] spring-settle data-direction:starting:opacity-0 data-[direction=back]:starting:-translate-x-(--motion-enter-offset) data-[direction=forward]:starting:translate-x-(--motion-enter-offset)"
      >
        <AutocompletePrimitive.Empty data-slot="command-empty">
          <p className="px-2.5 py-6 text-center text-fg-muted">{empty}</p>
        </AutocompletePrimitive.Empty>
        <AutocompletePrimitive.List data-slot="command-list" className="outline-hidden">
          {(item: CommandEntry | CommandSection) =>
            isSection(item) ? (
              <AutocompletePrimitive.Group
                key={item.value}
                items={item.items as CommandEntry[]}
                data-slot="command-group"
                className="not-first:mt-1"
              >
                <AutocompletePrimitive.GroupLabel
                  data-slot="command-group-label"
                  className={listGroupLabel}
                >
                  {item.value}
                </AutocompletePrimitive.GroupLabel>
                <AutocompletePrimitive.Collection>
                  {(entry: CommandEntry) => <CommandRow key={entry.value} entry={entry} />}
                </AutocompletePrimitive.Collection>
              </AutocompletePrimitive.Group>
            ) : (
              <CommandRow key={item.value} entry={item} />
            )
          }
        </AutocompletePrimitive.List>
      </div>
    </ScrollFade>
  );
  // The sheet follows the list's height as it changes while one types, instead of jumping.
  return <Grow data-slot="command-grow">{list}</Grow>;
}

function Hint({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Shortcut keys={keys} />
      {children}
    </span>
  );
}

export type CommandFooterProps = ComponentProps<"div"> & {
  /** What Enter does with the highlighted entry. */
  chooseLabel?: string;
  /** What the arrow keys do. */
  moveLabel?: string;
  /** What Backspace does inside a page. */
  backLabel?: string;
  /** What Escape does. */
  closeLabel?: string;
};

/**
 * The foot of the sheet: the keys that work here, said once. It is for the eye only, and it is
 * not there on a touch screen, which has no keys. Pass children to put something else there.
 */
export function CommandFooter({
  chooseLabel = "Auswählen",
  moveLabel = "Bewegen",
  backLabel = "Zurück",
  closeLabel = "Schließen",
  className,
  children,
  ...props
}: CommandFooterProps) {
  const { trail } = useCommand("CommandFooter");
  return (
    <div
      data-slot="command-footer"
      aria-hidden={children === undefined ? true : undefined}
      className={cn(
        "flex h-10 shrink-0 items-center gap-4 border-t border-hairline bg-well px-4 text-sm text-fg-muted pointer-coarse:hidden",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <Hint keys="enter">{chooseLabel}</Hint>
          <span className="flex items-center gap-1.5">
            <span className="flex gap-1">
              <Shortcut keys="up" />
              <Shortcut keys="down" />
            </span>
            {moveLabel}
          </span>
          {trail.length > 0 && <Hint keys="backspace">{backLabel}</Hint>}
          <span className="ml-auto">
            <Hint keys="esc">{closeLabel}</Hint>
          </span>
        </>
      )}
    </div>
  );
}
