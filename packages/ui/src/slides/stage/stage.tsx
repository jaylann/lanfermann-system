"use client";

import { type ComponentProps, type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/** The canvas every slide is drawn on, in px. */
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

export type StageProps = ComponentProps<"div">;

/**
 * Shows one slide scaled to a box: the 1920 by 1080 canvas keeps its own px and is scaled as a
 * whole, centred, never cropped. The box is 16:9 as wide as its place by default; give it another
 * size with `className` (`h-dvh w-dvw` for a full window) and the slide is letterboxed.
 */
export function Stage({ className, children, ...props }: StageProps) {
  const box = useRef<HTMLDivElement>(null);
  // Until the box is measured the stylesheet's own share applies (slides.css).
  const [scale, setScale] = useState<number>();

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;
      setScale(Math.min(clientWidth / SLIDE_WIDTH, clientHeight / SLIDE_HEIGHT));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} data-slot="stage" className={cn("aspect-video w-full", className)} {...props}>
      <div
        data-slot="stage-canvas"
        style={scale === undefined ? undefined : ({ "--stage-scale": scale } as CSSProperties)}
      >
        {children}
      </div>
    </div>
  );
}
