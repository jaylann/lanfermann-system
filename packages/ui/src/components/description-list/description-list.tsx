import type { ComponentProps, ReactNode } from "react";

import { ruleTop } from "@/internal/rule";
import { cn } from "@/lib/cn";

export type DescriptionListProps = ComponentProps<"dl"> & {
  /**
   * Whether the 2px rule opens the list. It does on a page; inside a `Card`, whose edge already
   * opens it, leave it out.
   */
  rule?: boolean;
};

/**
 * The facts of one record: customer, number, valid until, total. A real `<dl>`: each
 * `DescriptionTerm` is followed by its `DescriptionDetails`. The label stands muted in a column of
 * its own and the value beside it; hairlines divide the rows, and the 2px rule opens the list.
 * On a phone the value goes under its label.
 *
 * Digits are tabular only where they form a column down the list (amounts under each other):
 * give those details `tabular-nums`. The column of labels is 12rem; set `--dl-term` to change
 * it. For the parameters of an API in the docs, use `ParameterList`.
 *
 * Server-safe.
 */
export function DescriptionList({ rule = true, className, ...props }: DescriptionListProps) {
  return (
    // The list goes to two columns by its own width, not the window's: in a narrow card it
    // stacks, in a wide column of a page it does not.
    <div data-slot="description-list-frame" className="@container/dl">
      <dl
        data-slot="description-list"
        className={cn(
          "grid text-control @sm/dl:grid-cols-[minmax(0,var(--dl-term,12rem))_minmax(0,1fr)]",
          // The list ends with its last row: what follows brings its own line.
          "[&>:last-child]:border-b-0 @sm/dl:[&>:nth-last-child(-n+2)]:border-b-0",
          rule && ruleTop,
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** What the value is: „Kunde“, „Gültig bis“. A few words, no colon. */
export function DescriptionTerm({ className, ...props }: ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-term"
      className={cn(
        "min-w-0 pt-3 text-fg-muted @sm/dl:border-b @sm/dl:border-hairline @sm/dl:py-3 @sm/dl:pr-6",
        className,
      )}
      {...props}
    />
  );
}

export type DescriptionDetailsProps = ComponentProps<"dd"> & {
  /**
   * Something to do with the value, at the end of its row: a `CopyButton` for a number someone
   * will paste elsewhere, a link to the record.
   */
  action?: ReactNode;
};

/** The value. It may wrap; a long one (an IBAN, an address) breaks where it must. */
export function DescriptionDetails({
  action,
  className,
  children,
  ...props
}: DescriptionDetailsProps) {
  return (
    <dd
      data-slot="description-details"
      className={cn(
        "min-w-0 border-b border-hairline pt-0.5 pb-3 break-words text-fg @sm/dl:py-3",
        action !== undefined && "flex items-start justify-between gap-3",
        className,
      )}
      {...props}
    >
      {action !== undefined ? (
        <>
          <div className="min-w-0">{children}</div>
          {/* A control beside a line of text: it may stand out of the line's height by a few
              pixels, not push the row taller. */}
          <div className="-my-1 shrink-0">{action}</div>
        </>
      ) : (
        children
      )}
    </dd>
  );
}
