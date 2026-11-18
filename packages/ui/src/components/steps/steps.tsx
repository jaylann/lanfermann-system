import type { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactNode } from "react";

import { linkVariants } from "@/components/link/link-variants";
import { TickGlyph } from "@/internal/glyphs";
import { renderAs } from "@/internal/render-as";
import { cn } from "@/lib/cn";

/** Where a step stands: behind one, the one being worked on, or still ahead. */
export type StepStatus = "done" | "current" | "upcoming";

const statusWords: Record<StepStatus, string> = {
  done: "Erledigt",
  current: "Aktueller Schritt",
  upcoming: "Steht aus",
};

export type StepsProps = ComponentProps<"ol"> & {
  /**
   * In a row (the default), with each step's name under its mark; in a place too narrow for
   * the names only the current one is written out, under the row. Or one under the other, for
   * a column beside a form.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * `dots` (the default): the system's marks, ring and disc. `numbers`: each step's number in
   * its ring, and a tick once it is done, for a set-up whose length matters.
   */
  marks?: "dots" | "numbers";
};

/**
 * Where one stands in a set-up of a few steps: an order, an onboarding, a form in parts. It is
 * read, not operated, so it is flat: the system's marks joined by a hairline. An open ring is
 * ahead, the heavier ring is where one stands, the disc is done, and the line behind a finished
 * step is filled in the text colour.
 *
 * Put `Step`s inside, each with its `status`; exactly one is `current`. Name the list
 * (`aria-label`: "Einrichtung"). It shows the way and does not walk it: the buttons that go on
 * and back belong to the form below. Three to five steps; a longer way is better told as
 * "Schritt 4 von 9" in words.
 */
export function Steps({
  orientation = "horizontal",
  marks = "dots",
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

/** The piece of line from this mark to the next: a hairline, filled once the step is done. */
const line = [
  "relative flex-1 bg-hairline [--fill:0] group-last/step:hidden group-data-[status=done]/step:[--fill:1] forced-colors:bg-[GrayText]",
  // In a row: a pixel high, 8px clear of the marks.
  "mx-2 h-px group-data-[orientation=vertical]/steps:mx-0 group-data-[orientation=vertical]/steps:my-1.5 group-data-[orientation=vertical]/steps:h-auto group-data-[orientation=vertical]/steps:min-h-3 group-data-[orientation=vertical]/steps:w-px",
  // The fill is always there and is pushed out from the line's start by `scale`: nothing is
  // laid out while it grows. Square ends, so the scale distorts nothing.
  "after:absolute after:inset-0 after:origin-left after:[scale:var(--fill)_1] after:bg-fg after:transition-[scale] after:spring-settle rtl:after:origin-right forced-colors:after:bg-[CanvasText]",
  "group-data-[orientation=vertical]/steps:after:origin-top group-data-[orientation=vertical]/steps:after:[scale:1_var(--fill)]",
].join(" ");

/** The system's mark: ring ahead, the heavier ring in the accent now, the disc when done. */
const dot = [
  "mark hidden group-data-[marks=dots]/steps:block",
  "group-data-[status=current]/step:mark-now group-data-[status=done]/step:mark-on",
].join(" ");

/** The step's number in its ring; done, the ring is filled and a tick is drawn in it. */
const number = [
  "relative hidden size-5 items-center justify-center rounded-full text-xs font-medium text-fg-muted tabular-nums inset-ring-[1.5px] inset-ring-line group-data-[marks=numbers]/steps:flex",
  "transition-[background-color,box-shadow,color] spring-settle before:content-[counter(step)]",
  "group-data-[status=current]/step:text-fg group-data-[status=current]/step:inset-ring-accent",
  "group-data-[status=done]/step:bg-accent group-data-[status=done]/step:text-on-accent group-data-[status=done]/step:inset-ring-accent group-data-[status=done]/step:before:hidden",
  "forced-colors:outline forced-colors:outline-[CanvasText]",
].join(" ");

/**
 * One step. Its mark stands on the line, its name under it (beside it when the steps stand one
 * under the other). The current step says so to assistive tech (`aria-current="step"`) and has
 * its name in the strong text colour.
 */
export function Step({
  status = "upcoming",
  title,
  description,
  href,
  render,
  statusLabel = statusWords[status],
  className,
  ...props
}: StepProps) {
  const linked = href !== undefined || render !== undefined;
  const name = (
    <>
      {/* The current step is announced by `aria-current`; the other two by a word. */}
      {status !== "current" && <span className="sr-only">{statusLabel}: </span>}
      {title}
    </>
  );
  return (
    <li
      data-slot="step"
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn(
        "group/step flex min-w-0 flex-1 basis-0 flex-col gap-2 [counter-increment:step]",
        "group-data-[orientation=vertical]/steps:flex-none group-data-[orientation=vertical]/steps:basis-auto group-data-[orientation=vertical]/steps:flex-row group-data-[orientation=vertical]/steps:gap-3",
        // Room under the row for the one name that is written out where the row is narrow.
        "group-data-[orientation=horizontal]/steps:@max-md/steps:pb-8",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="step-rail"
        className="flex h-5 items-center group-data-[orientation=vertical]/steps:h-auto group-data-[orientation=vertical]/steps:w-5 group-data-[orientation=vertical]/steps:flex-col"
      >
        <span
          data-slot="step-mark"
          className="flex size-5 shrink-0 items-center justify-center group-data-[marks=dots]/steps:w-2 group-data-[orientation=vertical]/steps:group-data-[marks=dots]/steps:w-5"
        >
          <span className={dot} />
          <span className={number}>
            {/* Always there, like a checkbox's tick: it draws in when the step is done. */}
            <TickGlyph className="absolute opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[status=done]/step:opacity-100 group-data-[status=done]/step:[stroke-dashoffset:0]" />
          </span>
        </span>
        <span data-slot="step-line" className={line} />
      </span>
      <span
        data-slot="step-text"
        className={cn(
          "flex min-w-0 flex-col gap-0.5 pr-4 group-last/step:pr-0",
          "group-data-[orientation=vertical]/steps:pr-0 group-data-[orientation=vertical]/steps:pb-5 group-data-[orientation=vertical]/steps:group-last/step:pb-0",
          // Too narrow for every name: only the current one is written out, under the row, from
          // the row's start. The others stay for assistive tech.
          "group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=done]/step:sr-only group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=upcoming]/step:sr-only",
          "group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:absolute group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:top-7 group-data-[orientation=horizontal]/steps:@max-md/steps:group-data-[status=current]/step:left-0",
        )}
      >
        {linked ? (
          renderAs("a", render, {
            href,
            "data-slot": "step-title",
            className: cn(
              linkVariants({ variant: "quiet" }),
              "w-fit max-w-full truncate text-control leading-5 text-fg-body",
            ),
            children: name,
          })
        ) : (
          <span
            data-slot="step-title"
            className={cn(
              "truncate text-control leading-5 text-fg-muted transition-colors duration-150 ease-out",
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
