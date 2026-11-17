"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Spinner } from "@/components/spinner/spinner";
import { disclosureChevron, disclosurePanel } from "@/internal/disclosure";
import { ChevronRightGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/** Where a step stands: not begun, being worked on, finished, or failed. */
export type TraceStatus = "pending" | "running" | "done" | "error";

const defaultStatusLabels: Record<TraceStatus, string> = {
  pending: "Steht aus",
  running: "Läuft",
  done: "Erledigt",
  error: "Fehlgeschlagen",
};

/** What stands in front of a finished step: the system's disc, or the step's own symbol. */
export type TraceMarks = "dots" | "symbols";

type TraceContextValue = { labels: Record<TraceStatus, string>; marks: TraceMarks };

const TraceContext = createContext<TraceContextValue>({
  labels: defaultStatusLabels,
  marks: "dots",
});

export type TraceProps = ComponentProps<"ol"> & {
  /**
   * `dots` keeps to the system's marks: ring, arc and disc. It is the quieter list. `symbols`
   * shows a finished step's `icon` in place of its disc, so the kind of step can be read down
   * the rail: a search, a file, a mail. A step without an `icon` keeps its disc.
   */
  marks?: TraceMarks;
  /** What each state is called for assistive tech, where the mark alone would say it. */
  statusLabels?: Partial<Record<TraceStatus, string>>;
};

/**
 * What an assistant is doing, step by step: the searches, the files, the tools, in the order
 * they happen. It is read, not operated, so it is flat: a list of lines, each with the system's
 * mark in front, joined by a hairline. An open ring waits, the spinner's arc works (it is the
 * ring before it has closed), and the disc is done; a step that failed carries the danger
 * symbol and says so in words.
 *
 * Put `TraceStep`s inside. A step that joins a list already on screen fades in, and its title
 * is announced; the steps that are there when the list first shows do not move. For one line
 * that stands for the whole of it and opens the steps, wrap the list in a `TraceSummary`.
 */
export function Trace({ marks = "dots", statusLabels, className, ...props }: TraceProps) {
  // Page load does not animate: only a step that mounts after the list stands fades in.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const context = useMemo(
    () => ({ labels: { ...defaultStatusLabels, ...statusLabels }, marks }),
    [statusLabels, marks],
  );
  return (
    <TraceContext value={context}>
      <ol
        data-slot="trace"
        data-live={live ? "" : undefined}
        // A new step is said once, when it joins; a change of its state is not said again.
        aria-live="polite"
        aria-relevant="additions"
        className={cn("flex flex-col text-control", className)}
        {...props}
      />
    </TraceContext>
  );
}

type RowProps = {
  /** Where the step stands. Done unless said otherwise. */
  status?: TraceStatus;
  /**
   * What is being done, as a short line: in the present while it runs ("Zahlungen werden
   * abgeglichen"), in the past once it is done ("Zahlungen abgeglichen").
   */
  title: ReactNode;
  /** A second, quieter fact after the title: how long it took, how much was found. */
  meta?: ReactNode;
  /**
   * A symbol for the kind of step. A list with `marks="symbols"` shows it in place of the disc
   * once the step is done. Give every step one or none.
   */
  icon?: IconSvgElement;
  /** Whether the detail shows (controlled). */
  open?: boolean;
  /** Whether the detail shows at first. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** The mark in front of a line: ring, arc, disc, or the danger symbol. */
function TraceMark({ status, icon }: { status: TraceStatus; icon?: IconSvgElement }) {
  return (
    <span
      aria-hidden
      data-slot="trace-mark"
      className="flex size-4 shrink-0 items-center justify-center"
    >
      {status === "running" ? (
        <Spinner size={14} className="text-fg" />
      ) : status === "error" ? (
        <Icon icon={Alert02Icon} size={14} className="text-danger" />
      ) : icon && status === "done" ? (
        // A step that has just finished: its symbol comes in where the arc was, as the disc
        // closes in the other form.
        <Icon
          icon={icon}
          size={14}
          className="text-fg-muted transition-opacity spring-settle in-data-live:starting:opacity-0"
        />
      ) : (
        // A step that has just finished closes from the ring into the disc (marks.css).
        <span className={cn("mark", status === "done" && "mark-on in-data-live:mark-closes")} />
      )}
    </span>
  );
}

const titleTone: Record<TraceStatus, string> = {
  pending: "text-fg-muted",
  // The light passes through the line for as long as the step is worked on (shimmer.css).
  running: "shimmer",
  done: "text-fg-body",
  error: "text-fg",
};

/** The line itself: the mark, the title, the quieter fact, and a chevron if it opens. */
function TraceLine({
  status,
  title,
  meta,
  icon,
  opens,
}: Required<Pick<RowProps, "status" | "title">> &
  Pick<RowProps, "meta" | "icon"> & { opens: boolean }) {
  const { labels, marks } = useContext(TraceContext);
  return (
    <>
      <TraceMark status={status} icon={marks === "symbols" ? icon : undefined} />
      <span data-slot="trace-title" className={cn("min-w-0 truncate", titleTone[status])}>
        <span className="sr-only">{labels[status]}: </span>
        {title}
      </span>
      {meta !== undefined && (
        <span data-slot="trace-meta" className="shrink-0 text-sm text-fg-muted tabular-nums">
          {meta}
        </span>
      )}
      {opens && (
        <ChevronRightGlyph
          data-slot="trace-chevron"
          width={10}
          height={10}
          className={cn(disclosureChevron, "group-data-panel-open:rotate-90")}
        />
      )}
    </>
  );
}

const line = "flex min-h-7 items-center gap-2.5";

/** A line that opens: the whole of it is the button. */
const trigger = [
  line,
  // The padding is room for the focus outline; the margin takes it back, so the mark still
  // stands on the edge of the list.
  "group -mx-1.5 max-w-[calc(100%+0.75rem)] rounded-sm px-1.5 text-left select-none",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
].join(" ");

/** What a step or a summary opens: set under the title, a size smaller. */
function TraceDetail({ children }: { children: ReactNode }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="trace-detail"
      // As wide as the step or the summary, not as its longest line: a line that is too long
      // then shortens its title, instead of pushing the panel past the edge of the page.
      className={cn("h-(--collapsible-panel-height) self-stretch", disclosurePanel)}
    >
      {/* The panel clips, so what stands inside keeps a little room to its edge. */}
      <div className="flex flex-col gap-2 pt-1 pr-1 pb-2 pl-[1.625rem] text-sm text-fg-body">
        {children}
      </div>
    </CollapsiblePrimitive.Panel>
  );
}

export type TraceStepProps = Omit<ComponentProps<"li">, "title"> & RowProps;

/**
 * One step. With children it opens: the line becomes a button, and what it did stands under it
 * (the command, the result, the sources as `Badge`s, the steps of a helper as a `Trace` of its
 * own). Without children it is a plain line and not a tab stop.
 */
export function TraceStep({
  status = "done",
  title,
  meta,
  icon,
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: TraceStepProps) {
  const opens = children !== undefined && children !== null && children !== false;
  const content = <TraceLine status={status} title={title} meta={meta} icon={icon} opens={opens} />;
  return (
    <li
      data-slot="trace-step"
      data-status={status}
      className={cn(
        "relative flex flex-col",
        // A step that joins later rises into place; under reduced motion it only fades.
        "transition-[opacity,translate] spring-settle in-data-live:starting:translate-y-(--motion-enter-offset) in-data-live:starting:opacity-0",
        // The rail: a hairline from under this mark to above the next, 5px clear of a disc.
        "before:absolute before:top-[1.4375rem] before:-bottom-[0.3125rem] before:left-[0.46875rem] before:w-px before:bg-hairline last:before:hidden forced-colors:before:bg-[CanvasText]",
        className,
      )}
      {...props}
    >
      {opens ? (
        <CollapsiblePrimitive.Root
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          className="flex flex-col items-start"
        >
          <CollapsiblePrimitive.Trigger data-slot="trace-trigger" className={trigger}>
            {content}
          </CollapsiblePrimitive.Trigger>
          <TraceDetail>{children}</TraceDetail>
        </CollapsiblePrimitive.Root>
      ) : (
        <div className={line}>{content}</div>
      )}
    </li>
  );
}

export type TraceSummaryProps = Omit<ComponentProps<"div">, "title"> &
  Omit<RowProps, "icon"> & {
    /** The steps: a `Trace`. */
    children: ReactNode;
  };

/**
 * One line that stands for a whole piece of work and opens its steps: "Arbeitet …" while it
 * goes on, "In 14 Sekunden erledigt" afterwards, the number of steps as its second fact. It is
 * what a chat shows above an answer.
 *
 * It follows the work: open while the work is running, so the steps can be watched, and closed
 * once it is done, so the answer has the room. From the moment the reader opens or closes it,
 * it stays as they left it. `open` and `defaultOpen` fix it from outside.
 */
export function TraceSummary({
  status = "done",
  title,
  meta,
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: TraceSummaryProps) {
  // What the reader chose, once they have; until then the state of the work decides.
  const [chosen, setChosen] = useState<boolean | undefined>(defaultOpen);
  const shown = open ?? chosen ?? status === "running";
  return (
    <CollapsiblePrimitive.Root
      data-slot="trace-summary"
      data-status={status}
      aria-busy={status === "running" || undefined}
      open={shown}
      onOpenChange={(next) => {
        setChosen(next);
        onOpenChange?.(next);
      }}
      className={cn("flex flex-col items-start text-control", className)}
      {...props}
    >
      <CollapsiblePrimitive.Trigger data-slot="trace-trigger" className={trigger}>
        <TraceLine status={status} title={title} meta={meta} opens />
      </CollapsiblePrimitive.Trigger>
      <TraceDetail>{children}</TraceDetail>
    </CollapsiblePrimitive.Root>
  );
}
