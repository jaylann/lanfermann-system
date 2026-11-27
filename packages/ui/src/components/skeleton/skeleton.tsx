import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type SkeletonProps = ComponentProps<"span"> & {
  /**
   * `text` (the default): a line of text. It is exactly as tall as a line of the text around
   * it, so set it in the type the real line will have and nothing shifts when that arrives.
   * Give it a width (`w-40`), about as long as the text will be.
   * `block`: anything else, a picture, an avatar, a button. Give it the size and the corners of
   * what it stands for (`size-7 rounded-sm`).
   */
  shape?: "text" | "block";
};

/**
 * The shape of something that is still on its way. Build the page out of them the way it will
 * be built out of content, line for line and block for block: the reader sees where things
 * will stand, and nothing moves when they arrive.
 *
 * Put them inside a `SkeletonGroup`, which says in words what is being waited for and lets all
 * of them breathe as one. A wait with nothing to show the shape of is a `Spinner`; a wait that
 * has words is a `Shimmer`.
 */
export function Skeleton({ shape = "text", className, ...props }: SkeletonProps) {
  return (
    <span
      data-slot="skeleton"
      data-shape={shape}
      aria-hidden
      className={cn(
        "relative block max-w-full overflow-hidden",
        shape === "text"
          ? // The box is one line tall (`1lh`); the bar inside it is as tall as the letters.
            "h-[1lh] before:absolute before:inset-x-0 before:top-1/2 before:h-[0.7em] before:-translate-y-1/2 before:rounded-xs before:bg-hover forced-colors:before:bg-[GrayText]"
          : "rounded-md bg-hover forced-colors:bg-[GrayText]",
        // The passing light, where a group asks for it: a band the colour of the ground that
        // runs through every block at the same moment.
        "in-data-[light=passing]:after:absolute in-data-[light=passing]:after:inset-y-0 in-data-[light=passing]:after:left-0 in-data-[light=passing]:after:w-2/5 in-data-[light=passing]:after:animate-indeterminate in-data-[light=passing]:after:bg-linear-to-r in-data-[light=passing]:after:from-transparent in-data-[light=passing]:after:via-ground/70 in-data-[light=passing]:after:to-transparent motion-reduce:after:hidden",
        className,
      )}
      {...props}
    />
  );
}

export type SkeletonGroupProps = Omit<ComponentProps<"div">, "aria-label"> & {
  /**
   * `span` where a `div` may not stand: inside a paragraph, a heading or a table's cell (the
   * line under a page's title is a `<p>`). It is laid out as a block all the same.
   */
  as?: "div" | "span";
  /**
   * What is being waited for, as a full sentence in the present ("Die Angebote werden gerade
   * geladen."). It is read out; the shapes themselves are hidden from assistive tech.
   */
  label: string;
  /**
   * How the shapes show that the wait goes on. `breathing` (the default): all of them fade a
   * little and come back, together. `passing`: a light runs through them. `still`: nothing
   * moves.
   */
  light?: "breathing" | "passing" | "still";
};

/**
 * A region that is loading: the `Skeleton`s of what will stand there. It is one light, not one
 * per shape: the region breathes, so every shape in it does so at the same moment.
 *
 * It shows itself only after a fifth of a second. An answer that comes faster than that never
 * flashes a skeleton; the room it takes is there from the start, so nothing shifts either way.
 * To let the content fade in over it and to keep it from flickering, use `Loaded`.
 */
export function SkeletonGroup({
  as: Tag = "div",
  label,
  light = "breathing",
  className,
  children,
  ...props
}: SkeletonGroupProps) {
  return (
    <Tag
      role="status"
      aria-busy="true"
      data-slot="skeleton-group"
      data-light={light}
      // It waits 200ms, then is there within a moment. Page load does not animate, but this is
      // not the page arriving: it is the page saying that part of it has not arrived.
      className={cn(
        "transition-opacity delay-200 duration-150 ease-out starting:opacity-0",
        Tag === "span" && "block",
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <Tag
        data-slot="skeleton-shapes"
        className={cn(Tag === "span" && "block", light === "breathing" && "animate-breathe")}
      >
        {children}
      </Tag>
    </Tag>
  );
}
