"use client";

import { createContext, type CSSProperties, type ReactNode, useContext, useMemo } from "react";

/** Where a slide stands among its steps, as whoever shows it says. */
export type SlideStep = {
  /**
   * The step shown, from 0. `Infinity` where nobody steps (a plain `Deck`, a print, the check):
   * everything is shown.
   */
  step: number;
  /** How many steps the slide has. 0: it shows everything at once. */
  steps: number;
  /**
   * Whether the slide is being presented: only then does anything move. A preview, a tile of the
   * grid, a print and the check stand still.
   */
  live: boolean;
};

const STILL: SlideStep = { step: Infinity, steps: 0, live: false };

const SlideStepContext = createContext<SlideStep>(STILL);

type SlideStepProviderProps = Partial<SlideStep> & {
  children: ReactNode;
};

/**
 * Shows the slide inside at one of its steps. It draws a box that takes no space and carries the
 * step for both readers: `--slide-step` for the stylesheet (plain markup marked with
 * `stepAttributes`), the context for parts that draw by step, and `data-slides-live` where the
 * slide is being presented, which is what lets the stylesheet move anything.
 *
 * A player wraps every slide it shows in one. Without one, a slide shows all its steps and
 * stands still.
 */
export function SlideStepProvider({
  step = Infinity,
  steps = 0,
  live = false,
  children,
}: SlideStepProviderProps) {
  const value = useMemo(() => ({ step, steps, live }), [step, steps, live]);
  // Left unset where nobody steps: the stylesheet then shows everything.
  const style = Number.isFinite(step) ? ({ "--slide-step": step } as CSSProperties) : undefined;
  return (
    <SlideStepContext value={value}>
      <div
        data-slides-step={Number.isFinite(step) ? step : undefined}
        data-slides-live={live ? "" : undefined}
        className="contents"
        style={style}
      >
        {children}
      </div>
    </SlideStepContext>
  );
}

/** The step of the slide around a part. Everything shown and nothing moving where nobody steps. */
export function useSlideStep(): SlideStep {
  return useContext(SlideStepContext);
}
