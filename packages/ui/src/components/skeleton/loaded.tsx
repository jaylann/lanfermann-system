"use client";

import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/** How long a `SkeletonGroup` waits before it shows itself. The same number as its class. */
const SHOW_AFTER_MS = 200;
/** How long a skeleton that has shown itself stays at least, so it does not flicker. */
const STAY_MS = 350;

export type LoadedProps = Omit<ComponentProps<"div">, "children"> & {
  /** The content is there. */
  ready: boolean;
  /** What stands in for the content until then: a `SkeletonGroup` in the content's shape. */
  skeleton: ReactNode;
  /** The content. It is not rendered before it is `ready`. */
  children: ReactNode;
};

/**
 * Content that may still be on its way, with the skeleton that stands in for it. It keeps the
 * two from flickering:
 *
 *   an answer within a fifth of a second   the skeleton never shows, the content is simply there
 *   an answer after that                   the skeleton has shown itself, so it stays for a
 *                                          moment longer, and the content fades in over it
 *
 * Where the framework holds content back itself (a `Suspense` boundary), a `SkeletonGroup`
 * alone is the fallback and this is not needed.
 */
export function Loaded({ ready, skeleton, className, children, ...props }: LoadedProps) {
  const [showing, setShowing] = useState<"content" | "skeleton">(ready ? "content" : "skeleton");
  // Whether the content came after a skeleton that was seen: then it fades in.
  const [arrived, setArrived] = useState(false);
  const seenAt = useRef<number | null>(null);

  // Waiting again (a list that is reloaded): the skeleton stands in at once.
  const [wasReady, setWasReady] = useState(ready);
  if (ready !== wasReady) {
    setWasReady(ready);
    if (!ready) setShowing("skeleton");
  }

  useEffect(() => {
    if (ready) return;
    seenAt.current = null;
    const timer = setTimeout(() => {
      seenAt.current = performance.now();
    }, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!ready || showing === "content") return;
    const seen = seenAt.current;
    const wait = seen === null ? 0 : Math.max(0, STAY_MS - (performance.now() - seen));
    const timer = setTimeout(() => {
      setArrived(seen !== null);
      setShowing("content");
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, showing]);

  if (showing === "skeleton") return skeleton;
  return (
    <div
      data-slot="loaded"
      data-arrived={arrived ? "" : undefined}
      className={cn("transition-opacity spring-settle data-arrived:starting:opacity-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}
