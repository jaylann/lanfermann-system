"use client";

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { Chip } from "@/components/chip/chip";
import { useGround, useGroundMode } from "@/components/ground/ground";
import { Grow } from "@/components/grow/grow";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { Shortcut, useShortcut } from "@/components/shortcut/shortcut";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { overlayBackdrop } from "@/internal/overlay";
import { listGroupLabel, listItem, listItemDetail } from "@/internal/popup";
import { cn, mergeClassName } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

/** One thing the palette offers: a page to go to, or something to do. */
export type CommandEntry = {
  /** Tells the entries apart. */
  value: string;
  /** What is shown and typed against. */
  label: string;
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
 * its own (`page`). Typing filters by label and keywords, ignoring case and accents.
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
  label,
  locale,
  modal = true,
  children,
}: CommandProps) {
  const { messages } = useLocale();
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

  const name = label ?? messages.command.label;
  const state = useMemo<CommandState>(
    () => ({
      label: name,
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
    [name, locale, items, trail, direction, query, setQuery, setOpen],
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
  const groundMode = useGroundMode();
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
      contains(entry.label, typed) ||
      (entry.keywords?.some((keyword) => contains(keyword, typed)) ?? false),
    [contains],
  );
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="command-backdrop" className={overlayBackdrop} />
      <DialogPrimitive.Viewport
        data-slot="command-viewport"
        className="fixed inset-0 z-50 flex max-h-dvh items-start justify-center overflow-hidden px-3 pt-[min(18dvh,9rem)] pb-3"
      >
        <DialogPrimitive.Popup
          data-slot="command-content"
          data-theme={ground}
          data-mode={groundMode}
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
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
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
 * The entries that match what was typed, in their sections. The first one is highlighted, so
 * Enter takes it; the arrows move the highlight, which is instant like a menu's. The list is
 * as tall as what it holds, up to a limit, and the sheet follows it instead of jumping.
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
  chooseLabel,
  moveLabel,
  backLabel,
  closeLabel,
  className,
  children,
  ...props
}: CommandFooterProps) {
  const { messages } = useLocale();
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
          <Hint keys="enter">{chooseLabel ?? messages.command.choose}</Hint>
          <span className="flex items-center gap-1.5">
            <span className="flex gap-1">
              <Shortcut keys="up" />
              <Shortcut keys="down" />
            </span>
            {moveLabel ?? messages.command.move}
          </span>
          {trail.length > 0 && <Hint keys="backspace">{backLabel ?? messages.command.back}</Hint>}
          <span className="ml-auto">
            <Hint keys="esc">{closeLabel ?? messages.command.close}</Hint>
          </span>
        </>
      )}
    </div>
  );
}
