import type { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactNode } from "react";

import { ActionArrow } from "@/internal/arrow";
import { renderAs } from "@/internal/render-as";
import { cn } from "@/lib/cn";
import { Localized } from "@/locale/localized";

export type PagerProps = ComponentProps<"nav"> & {
  /** The name of the navigation for assistive tech. */
  label?: string;
};

/**
 * The way on at the end of a page that is one of a sequence: the page before and the page after,
 * each named by its title. Put a `PagerLink` with `direction="previous"` and one with `"next"`;
 * at either end of the sequence leave that one out, and the other keeps its side.
 */
export function Pager({ label = "Weitere Seiten", className, children, ...props }: PagerProps) {
  return (
    <nav
      data-slot="pager"
      aria-label={label}
      className={cn("grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2 sm:gap-6", className)}
      {...props}
    >
      {children}
    </nav>
  );
}

export type PagerLinkProps = Omit<useRender.ComponentProps<"a">, "title"> & {
  direction: "previous" | "next";
  /** The title of the page it leads to. */
  title: ReactNode;
  /** The small line above the title. */
  label?: ReactNode;
};

/**
 * One way on: a small line that says which way, and the title of the page. The whole block is
 * the link; its arrow leads when it is pointed at. For a router's link, pass it as `render`.
 */
export function PagerLink({
  direction,
  title,
  label,
  render,
  className,
  ...props
}: PagerLinkProps) {
  const next = direction === "next";
  return renderAs("a", render, {
    ...props,
    "data-slot": "pager-link",
    "data-direction": direction,
    rel: next ? "next" : "prev",
    className: cn(
      // Flat like the text it ends: only a wash under the pointer says it is one block.
      "group/pager -mx-3 flex min-w-0 flex-col gap-1 rounded-lg px-3 py-3 transition-colors duration-150 ease-out hover:bg-hover",
      "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
      // On a phone both stand one over the other on the left edge, where the eye already is;
      // side by side, the next one takes the right.
      next && "sm:col-start-2 sm:items-end sm:text-right",
      className,
    ),
    children: (
      <>
        <span
          data-slot="pager-label"
          className={cn(
            "flex items-center gap-1.5 text-sm text-fg-muted",
            next && "sm:flex-row-reverse",
          )}
        >
          <ActionArrow direction={next ? "right" : "left"} size={14} />
          {label ?? <Localized ns="pager" name={direction} />}
        </span>
        <span
          data-slot="pager-title"
          className="max-w-full text-lg font-medium text-pretty text-fg"
        >
          {title}
        </span>
      </>
    ),
  });
}
