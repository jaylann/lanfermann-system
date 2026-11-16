import { type ComponentProps, Fragment, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * What a function, a command or a tool takes: one row per parameter, its name and type on the
 * left, what it means on the right. Structured by line like a `Table` (the 2px rule opens it,
 * hairlines divide the rows), but each row reads as a sentence, so it is a description list.
 * Below `sm` the description goes under the name.
 *
 * For values compared column by column (defaults of many settings side by side), use a `Table`.
 */
export function ParameterList({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl
      data-slot="parameter-list"
      className={cn("flex flex-col border-t-2 border-rule", className)}
      {...props}
    />
  );
}

export type ParameterProps = Omit<ComponentProps<"div">, "children" | "defaultValue"> & {
  /** The name as it is written in code. */
  name: string;
  /**
   * Its type as it is written in code (`string`, `"draft" | "open"`). A long union breaks after
   * each `|`, never inside a member.
   */
  type?: string;
  /** Whether it must be given. Shown in words: colour never says it alone. */
  required?: boolean;
  /** What it is when it is left out. */
  defaultValue?: ReactNode;
  /** The words for a required and an optional parameter, and before a default. */
  requiredLabel?: string;
  optionalLabel?: string;
  defaultLabel?: string;
  /** What it means, in one or a few sentences. */
  children?: ReactNode;
};

/** A type written in code, with a place to break after each `|` of a union. */
function TypeText({ type }: { type: string }) {
  const members = type.split(/\s*\|\s*/);
  return (
    <code
      data-slot="parameter-type"
      className="font-mono text-[0.8125rem] leading-5 break-words text-fg-muted [font-variant-ligatures:none]"
    >
      {members.map((member, index) => (
        <Fragment key={`${index}:${member}`}>
          {index > 0 ? (
            <>
              {" | "}
              <wbr />
            </>
          ) : null}
          {member}
        </Fragment>
      ))}
    </code>
  );
}

/**
 * One parameter. Write the description as a sentence that says what the value does, and what
 * happens without it when that is not obvious.
 */
export function Parameter({
  name,
  type,
  required,
  defaultValue,
  requiredLabel = "erforderlich",
  optionalLabel = "optional",
  defaultLabel = "Standard:",
  className,
  children,
  ...props
}: ParameterProps) {
  return (
    <div
      data-slot="parameter"
      className={cn(
        "grid gap-x-6 gap-y-1.5 border-b border-hairline py-3.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]",
        // The list opens with the rule and ends with its last row: whatever follows brings its
        // own line, and two would stand close together.
        "last:border-b-0",
        className,
      )}
      {...props}
    >
      <dt className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <code
            data-slot="parameter-name"
            className="font-mono text-sm font-medium [overflow-wrap:anywhere] text-fg [font-variant-ligatures:none]"
          >
            {name}
          </code>
          {required !== undefined ? (
            <span
              data-slot="parameter-required"
              data-required={required ? "" : undefined}
              className="text-sm text-fg-muted data-required:font-medium data-required:text-fg"
            >
              {required ? requiredLabel : optionalLabel}
            </span>
          ) : null}
        </span>
        {type ? <TypeText type={type} /> : null}
      </dt>
      <dd className="flex min-w-0 flex-col gap-1.5 text-base text-pretty text-fg-body">
        {children}
        {defaultValue !== undefined ? (
          <span data-slot="parameter-default" className="text-sm text-fg-muted">
            {defaultLabel} <span className="text-fg-body">{defaultValue}</span>
          </span>
        ) : null}
      </dd>
    </div>
  );
}
