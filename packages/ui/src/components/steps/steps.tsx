import type { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactNode } from "react";

import { linkVariants } from "@/components/link/link-variants";
import { TickGlyph } from "@/internal/glyphs";
import { renderAs } from "@/internal/render-as";
import { cn } from "@/lib/cn";
import { Localized } from "@/locale/localized";

/** Where a step stands: behind one, the one being worked on, or still ahead. */
export type StepStatus = "done" | "current" | "upcoming";

export type StepsProps = ComponentProps<"ol"> & {
  /**
   * In a row (the default), with each step's name centred under its mark; in a place too narrow
   * for the names only the current one is written out. Or one under the other, for a column
   * beside a form.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * `numbers` (the default): each step's number in a socket like a checkbox's, which takes the
   * accent plug and a tick once the step is done. `dots`: the system's flat marks, ring and
   * disc, as a `Trace` draws them, for a quieter place.
   */
  marks?: "numbers" | "dots";
};

/**
 * Where one stands in a set-up of a few steps: an order, an onboarding, a form in parts. Its
 * marks are a checkbox's: an empty socket with the step's number is ahead, the socket with the
 * accent ring is where one stands, and a finished step is the accent plug with its tick. A line
 * with round ends joins them, filled in the text colour behind a finished step.
 *
 * Going on is one movement along the way: the plug seats and its tick draws, the line draws on
 * to the next mark, and that mark takes the ring as the line arrives. Going back runs it in
 * reverse. Where the steps first show, the finished ones draw themselves in (`steps.css`).
 *
 * Put `Step`s inside, each with its `status`; exactly one is `current`. Name the list
 * (`aria-label`: "Einrichtung"). It shows the way and does not walk it: the buttons that go on
 * and back belong to the form below. Three to five steps; a longer way is better told as
 * "Schritt 4 von 9" in words.
 */
export function Steps({
  orientation = "horizontal",
  marks = "numbers",
  className,
  ...props
}: StepsProps) {
  return (
    <ol
      data-slot="steps"
      data-orientation={orientation}
      data-marks={marks}
      className={cn(
        // A row is as wide as its place and asks that place how wide it is (a container query
        // gives an element no width of its own, so only the row is one).
        "group/steps relative flex [counter-reset:step] data-[orientation=horizontal]:@container/steps data-[orientation=horizontal]:w-full data-[orientation=vertical]:flex-col",
        // How far a line keeps from the middle of a mark: half the mark and 8px.
        "[--line-gap:1.125rem] data-[marks=dots]:[--line-gap:0.75rem]",
        className,
      )}
      {...props}
    />
  );
}

export type StepProps = Omit<ComponentProps<"li">, "title"> & {
  /** Where the step stands. Ahead unless said otherwise. */
  status?: StepStatus;
  /** The step, in a word or two: "Konto", "Tarif wählen". */
  title: ReactNode;
  /** A second, quieter line: what happens in this step. */
  description?: ReactNode;
  /**
   * Where the step can be opened again. Give it to a finished step only: its name is then a
   * link back. A step that is ahead is not a link.
   */
  href?: string;
  /** A router's link in place of the `<a>`: `render={<Link href="…" />}`. */
  render?: useRender.RenderProp;
  /** What the state is called for assistive tech, where the mark alone would say it. */
  statusLabel?: string;
};

/**
 * The order of a step that changes. A transition takes the delay of the state it goes to, so
 * going on and going back are both one movement along the line: a mark that becomes current
 * waits until the line has reached it (or, going back, has left the mark after it), and a line
 * fills once the plug behind it has seated.
 */
const timing =
  "[--mark-delay:0ms] [--line-delay:0ms] data-[status=current]:[--mark-delay:350ms] data-[status=done]:[--line-delay:100ms]";

/**
 * The piece of line from this mark to the next: a trough 2px high with round ends, and in it a
 * fill as long as the trough that is pushed out of it at the start (`translate`), so both ends
 * stay round while it draws and nothing is laid out. In a row it lies between the middles of
 * two marks, 8px clear of each.
 */
const line = [
  "absolute start-[calc(50%+var(--line-gap))] top-[calc(50%-1px)] h-0.5 w-[calc(100%-2*var(--line-gap))] overflow-hidden rounded-full bg-hairline group-last/step:hidden forced-colors:bg-[GrayText]",
  "group-data-[orientation=vertical]/steps:static group-data-[orientation=vertical]/steps:my-1.5 group-data-[orientation=vertical]/steps:h-auto group-data-[orientation=vertical]/steps:min-h-3 group-data-[orientation=vertical]/steps:w-0.5 group-data-[orientation=vertical]/steps:flex-1",
].join(" ");

// Empty, it stands 2px clear of the trough: exactly at its edge, the fill's soft end showed as
// a fleck where the trough began between two pixels.
const fill = [
  "block size-full rounded-full bg-fg forced-colors:bg-[CanvasText]",
  "translate-x-[calc((var(--fill)-1)*(100%+2px))] rtl:translate-x-[calc((1-var(--fill))*(100%+2px))]",
  "group-data-[orientation=vertical]/steps:translate-x-0 group-data-[orientation=vertical]/steps:translate-y-[calc((var(--fill)-1)*(100%+2px))]",
  "transition-[translate] spring-glide delay-(--line-delay) motion-reduce:transition-none",
].join(" ");

/** The system's mark: ring ahead, the heavier ring in the accent now, the disc when done. */
const dot = [
  "mark hidden delay-(--mark-delay) group-data-[marks=dots]/steps:block",
  "group-data-[status=current]/step:mark-now group-data-[status=done]/step:mark-on",
].join(" ");

/**
 * The step's number in a checkbox's socket (checkbox.tsx), so the three states are one part:
 * ahead it is the empty socket, where one stands its rim is the accent, and done the accent plug
 * seats into it with the tick.
 */
const number = [
  "relative hidden size-5 items-center justify-center rounded-full bg-surface text-xs font-medium text-fg-muted tabular-nums depth-socket group-data-[marks=numbers]/steps:flex",
  "transition-[background-color,box-shadow,color,outline-color] spring-settle delay-(--mark-delay)",
  // The line box of the digits sets them a pixel above the middle of the socket. The digit
  // fades with the mark's state, so it never stands beside the tick.
  "before:translate-y-px before:transition-opacity before:duration-150 before:ease-out before:delay-(--mark-delay) before:content-[counter(step)]",
  // Where one stands, the socket's rim is the accent and twice as heavy: one 2px outline over
  // the rim's pixel and the pixel inside it, so the mark keeps its size. (Two rings, one out
  // and one in, left a light seam between them in Firefox.) It is always there, clear, so its
  // colour can ease.
  "outline-2 -outline-offset-1 outline-transparent",
  "group-data-[status=current]/step:text-fg group-data-[status=current]/step:outline-accent",
  "group-data-[status=done]/step:bg-accent group-data-[status=done]/step:text-on-accent group-data-[status=done]/step:depth-plug group-data-[status=done]/step:depth-tone-accent group-data-[status=done]/step:before:opacity-0",
  "forced-colors:outline-1 forced-colors:outline-offset-0 forced-colors:outline-[CanvasText] forced-colors:group-data-[status=current]/step:outline-2",
].join(" ");

/**
 * One step. Its mark stands on the line and its name is centred under it (beside it when the
 * steps stand one under the other). The current step says so to assistive tech
 * (`aria-current="step"`) and has its name in the strong text colour.
 */
export function Step({
  status = "upcoming",
  title,
  description,
  href,
  render,
  statusLabel,
  className,
  ...props
}: StepProps) {
  const linked = href !== undefined || render !== undefined;
  const name = (
    <>
      {/* The current step is announced by `aria-current`; the other two by a word. */}
      {status !== "current" && (
        <span className="sr-only">{statusLabel ?? <Localized ns="steps" name={status} />}: </span>
      )}
      {title}
    </>
  );
  return (
    <li
      data-slot="step"
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn(
        "group/step relative flex min-w-0 flex-1 basis-0 flex-col items-center gap-2 [--fill:0] [counter-increment:step] data-[status=done]:[--fill:1]",
        timing,
        "group-data-[orientation=vertical]/steps:flex-none group-data-[orientation=vertical]/steps:basis-auto group-data-[orientation=vertical]/steps:flex-row group-data-[orientation=vertical]/steps:items-stretch group-data-[orientation=vertical]/steps:gap-3",
        // Room under the row for the one name that is written out where the row is narrow, and
        // how wide it may be: as far as the marks beside, and inside the row at either end.
        "[--name-room:200%] first:[--name-room:100%] last:[--name-room:100%] group-data-[orientation=horizontal]/steps:@max-md/steps:pb-8",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="step-rail"
        className="relative flex h-5 w-full items-center justify-center group-data-[orientation=vertical]/steps:h-auto group-data-[orientation=vertical]/steps:w-5 group-data-[orientation=vertical]/steps:flex-col group-data-[orientation=vertical]/steps:justify-start"
      >
        <span
          data-slot="step-mark"
          className="flex size-5 shrink-0 items-center justify-center group-data-[marks=dots]/steps:w-2 group-data-[orientation=vertical]/steps:group-data-[marks=dots]/steps:w-5"
        >
          <span className={dot} />
          <span className={number}>
            {/* Always there, like a checkbox's tick: it draws in when the step is done. Its
                drawing sits half a pixel low in its box; in a round plug that shows. */}
            <TickGlyph
              data-slot="step-tick"
              className="absolute -translate-y-[0.5px] opacity-0 transition-[stroke-dashoffset,opacity] delay-[calc(var(--mark-delay)+60ms)] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[status=done]/step:opacity-100 group-data-[status=done]/step:[stroke-dashoffset:0]"
            />
          </span>
        </span>
        <span data-slot="step-line" className={line}>
          <span data-slot="step-fill" className={fill} />
        </span>
      </span>
      <span
        data-slot="step-text"
        className={cn(
          "flex max-w-full min-w-0 flex-col items-center gap-0.5 px-2 text-center",
          "group-data-[orientation=vertical]/steps:items-start group-data-[orientation=vertical]/steps:px-0 group-data-[orientation=vertical]/steps:pb-5 group-data-[orientation=vertical]/steps:text-start group-data-[orientation=vertical]/steps:group-last/step:pb-0",
          // Too narrow for every name: only the current one is written out, centred under its
          // own mark. The others stay for assistive tech.
          "group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=done]/step:sr-only group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=upcoming]/step:sr-only",
          "group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:absolute group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:top-7 group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:left-1/2 group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:-translate-x-1/2",
          "group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:w-max group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:max-w-(--name-room)",
        )}
      >
        {linked ? (
          renderAs("a", render, {
            href,
            "data-slot": "step-title",
            className: cn(
              linkVariants({ variant: "quiet" }),
              "w-fit max-w-full min-w-0 text-control leading-5 text-fg-body",
            ),
            // The name is cut inside the link, not on it, and only sideways: clipped on the
            // link's rounded box (there for its focus ring), the underline, which runs in the
            // line's last pixels, lost both its ends.
            children: (
              <span className="block overflow-x-clip text-ellipsis whitespace-nowrap">{name}</span>
            ),
          })
        ) : (
          <span
            data-slot="step-title"
            className={cn(
              "max-w-full truncate text-control leading-5 text-fg-muted",
              // The name takes its state with its mark; the weight changes at once, then.
              "[transition:color_150ms_ease-out_var(--mark-delay),font-weight_0s_linear_var(--mark-delay)]",
              "group-data-[status=current]/step:font-medium group-data-[status=current]/step:text-fg group-data-[status=done]/step:text-fg-body",
            )}
          >
            {name}
          </span>
        )}
        {description !== undefined && (
          <span data-slot="step-description" className="text-sm text-pretty text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </li>
  );
}
