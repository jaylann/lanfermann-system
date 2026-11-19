"use client";

import { type ComponentProps, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

export type GrowProps = ComponentProps<"div"> & {
  /**
   * Classes for the box inside, which holds the content and is the one that is measured. The
   * layout of what the block holds (a flex row, a padding) goes here: on the block itself a
   * padding or a minimum height would be added to the measured height and the block would
   * never come to rest at it.
   */
  contentClassName?: string;
};

/** The transitions of a part inside that already move the content's height by themselves. */
const heightProperties = new Set(["height", "max-height", "grid-template-rows"]);

/** Whether something inside is moving its own height: a panel opening, another `Grow`. */
function movingInside(content: HTMLElement) {
  return content
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation instanceof CSSTransition &&
        heightProperties.has(animation.transitionProperty) &&
        animation.playState !== "finished",
    );
}

/** Whether the box itself is on its way to a height. */
function heightMoving(box: HTMLElement) {
  return box
    .getAnimations()
    .some(
      (animation) =>
        animation instanceof CSSTransition &&
        animation.transitionProperty === "height" &&
        animation.playState === "running",
    );
}

/**
 * A block whose height follows what it holds. When something joins it (a step of a `Trace`, a
 * paragraph that arrives, the next tab's panel), it eases to its new height on `settle`, and
 * what stands below moves down with it instead of jumping. It shrinks the same way.
 *
 * Put it around the part that changes, not around the page: what stands inside below the change
 * still moves at once. Give each part that grows on its own a `Grow` of its own, side by side;
 * one inside another sets its height in the middle of the other's measuring, and the outer one
 * then learns of it a frame late.
 *
 * At rest it is a plain block of the content's height that clips nothing. It clips only while
 * it moves, so a line that joins at its foot is uncovered as the block opens. From rest it does
 * not animate the first height, a resize of the window, or a height that something inside is
 * already animating (an opening `Collapsible`): then it simply follows.
 * Already on its way, it takes a new height as its goal from where it stands. Under reduced
 * motion it always follows.
 */
export function Grow({ className, contentClassName, children, ref, ...props }: GrowProps) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = box.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    /** The content's height when it was last measured. */
    let height = inner.offsetHeight;
    /**
     * The frame in which the window last changed its size. The browser runs the resize event and
     * then the size observers in the same frame, so a measure in that frame was caused by the
     * resize. (A width remembered from the last measure went stale when the window was resized
     * without this content changing, and the next real change was then taken for a resize.)
     */
    const frame = () => Number(document.timeline.currentTime ?? performance.now());
    let resizedIn = Number.NaN;
    const resized = () => {
      resizedIn = frame();
    };
    window.addEventListener("resize", resized);

    const rest = () => {
      delete outer.dataset.moving;
      outer.style.height = "";
    };

    // Called after layout and before paint: the box already has the content's new height, and
    // is set back to where it stood before anyone sees it.
    const observer = new ResizeObserver(() => {
      const nextHeight = inner.offsetHeight;
      const moving = outer.dataset.moving !== undefined;
      // Mid-move the box stands where its transition has brought it.
      const from = moving ? outer.getBoundingClientRect().height : height;
      // A window being resized reflows everything at once; easing each step would lag behind.
      const resizing = frame() === resizedIn;
      const follow = reduced.matches || resizing || movingInside(inner);
      height = nextHeight;
      if (Math.abs(nextHeight - from) < 0.5) {
        if (moving) rest();
        return;
      }
      // At rest the box is as tall as its content anyway. Already on its way, it takes the new
      // height as its goal from where it stands, rather than jumping to it.
      if (follow && (!moving || reduced.matches)) {
        if (moving) rest();
        return;
      }
      outer.dataset.moving = "";
      outer.style.transition = "none";
      outer.style.height = `${from}px`;
      // Lay the box out at the old height, so the transition starts from there.
      void outer.offsetHeight;
      outer.style.transition = "";
      outer.style.height = `${nextHeight}px`;
    });
    observer.observe(inner);

    const arrived = (event: TransitionEvent) => {
      if (event.target !== outer || event.propertyName !== "height") return;
      // Taking a new goal mid-way cancels the transition to the old one; the one to the new goal
      // is already running by the time that is said, and the box has not arrived.
      if (event.type === "transitioncancel" && heightMoving(outer)) return;
      rest();
    };
    outer.addEventListener("transitionend", arrived);
    outer.addEventListener("transitioncancel", arrived);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resized);
      outer.removeEventListener("transitionend", arrived);
      outer.removeEventListener("transitioncancel", arrived);
      rest();
    };
  }, []);

  return (
    <div
      ref={mergeRefs(box, ref)}
      data-slot="grow"
      // The height on `settle`, written out as one declaration so that a box with transitions
      // of its own (a field that grows keeps its halo's) can add them through `--grow-also`
      // instead of replacing this one.
      className={cn(
        "[transition:height_var(--transition-duration-spring-settle)_var(--ease-spring-settle),var(--grow-also,visibility_0s)] data-moving:overflow-clip",
        className,
      )}
      {...props}
    >
      {/* A block of its own, so the margins of what it holds stay inside the measured height. */}
      <div ref={content} data-slot="grow-content" className={cn("flow-root", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
