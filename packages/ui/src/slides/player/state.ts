/**
 * What a player knows at any moment, and how it changes. Pure: the views, the keys, a clicker and
 * a second window all speak to the deck through these actions, so they cannot disagree.
 *
 * A slide may show its content click by click (`steps`, see `slides/step/steps.ts`): stepping
 * forward walks the current slide's steps before it leaves the slide, stepping back walks them
 * back and enters the slide before at its last step. A slide without steps is one press.
 */
export type PlayerState = {
  /** The slide shown, counted from 0. */
  index: number;
  /** The step of that slide, from 0 to its `steps`. Always 0 on a slide without steps. */
  step: number;
  /** How many slides the deck has. */
  count: number;
  /** How many steps each slide has, in order (0: it shows everything at once). */
  steps: readonly number[];
  /** The audience sees a black screen. The presenter's console keeps the slide. */
  blackout: boolean;
  /** The grid of all slides is open, to jump. */
  grid: boolean;
  /** When the talk began (ms since the epoch), or `null` before the first step forward. */
  startedAt: number | null;
};

export type PlayerAction =
  /** One step further, or the next slide when this one has no step left. */
  | { type: "next"; at: number }
  /** One step back, or the slide before at its last step. */
  | { type: "previous" }
  | { type: "first" }
  /** The last slide, at its last step. */
  | { type: "last" }
  /** To one slide (at step 0 unless `step` says otherwise): a deep link, the grid, the frame. */
  | { type: "go"; index: number; step?: number }
  | { type: "blackout" }
  | { type: "grid" }
  /** Leaves whatever lies over the slide: the grid first, then the black screen. */
  | { type: "escape" }
  | { type: "resetTimer"; at: number }
  /** What the presenter's window says, taken over as it is by an audience window. */
  | { type: "sync"; index: number; step: number; blackout: boolean };

/**
 * The state of a deck at its start. `slides` is the step count of each slide, or a number of
 * slides that have no steps.
 */
export function initialState(slides: number | readonly number[], index = 0, step = 0): PlayerState {
  const steps = typeof slides === "number" ? Array.from({ length: slides }, () => 0) : slides;
  const empty = {
    index: 0,
    step: 0,
    count: steps.length,
    steps,
    blackout: false,
    grid: false,
    startedAt: null,
  };
  return { ...empty, ...place(empty, index, step) };
}

function clampTo(value: number, highest: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), Math.max(highest, 0));
}

/** The steps of slide `index`, 0 for a slide that has none or is not in the deck. */
export function stepsOf(state: Pick<PlayerState, "steps">, index: number): number {
  return state.steps[index] ?? 0;
}

/** Slide and step inside the deck: the slide clamped to the deck, the step to that slide. */
function place(state: PlayerState, index: number, step: number) {
  const slide = clampTo(index, state.count - 1);
  return { index: slide, step: clampTo(step, stepsOf(state, slide)) };
}

/**
 * A move to another slide or step closes the grid and ends the black screen: one sees where one
 * went.
 */
function at(state: PlayerState, index: number, step: number): PlayerState {
  return { ...state, ...place(state, index, step), grid: false, blackout: false };
}

/** Whether the deck stands on its last slide at that slide's last step: `next` has nowhere to go. */
export function atEnd(state: PlayerState): boolean {
  return state.index >= state.count - 1 && state.step >= stepsOf(state, state.index);
}

/** Whether the deck stands on its first slide at step 0: `previous` has nowhere to go. */
export function atStart(state: PlayerState): boolean {
  return state.index === 0 && state.step === 0;
}

/**
 * Where the next press forward leads: a further step of this slide, or the next slide at step 0.
 * `undefined` at the end of the deck. The console shows it as its preview.
 */
export function upcoming(state: PlayerState): { index: number; step: number } | undefined {
  if (atEnd(state)) return undefined;
  const { index, step } = reduce(state, { type: "next", at: 0 });
  return { index, step };
}

export function reduce(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "next": {
      const moved =
        state.step < stepsOf(state, state.index)
          ? at(state, state.index, state.step + 1)
          : atEnd(state)
            ? at(state, state.index, state.step)
            : at(state, state.index + 1, 0);
      // The clock starts with the first step forward, not when the file is opened.
      return { ...moved, startedAt: state.startedAt ?? action.at };
    }
    case "previous":
      if (state.step > 0) return at(state, state.index, state.step - 1);
      if (state.index === 0) return at(state, 0, 0);
      return at(state, state.index - 1, stepsOf(state, state.index - 1));
    case "first":
      return at(state, 0, 0);
    case "last":
      return at(state, state.count - 1, stepsOf(state, state.count - 1));
    case "go":
      return at(state, action.index, action.step ?? 0);
    case "blackout":
      return { ...state, blackout: !state.blackout, grid: false };
    case "grid":
      return { ...state, grid: !state.grid };
    case "escape":
      return state.grid ? { ...state, grid: false } : { ...state, blackout: false };
    case "resetTimer":
      return { ...state, startedAt: action.at };
    case "sync":
      return { ...state, ...place(state, action.index, action.step), blackout: action.blackout };
  }
}

/** Minutes and seconds since the talk began, as „12:05“, or „0:00“ before it has. */
export function elapsed(startedAt: number | null, now: number): string {
  const seconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
