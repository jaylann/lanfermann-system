/**
 * What a player knows at any moment, and how it changes. Pure: the views, the keys, a clicker and
 * a second window all speak to the deck through these actions, so they cannot disagree.
 */
export type PlayerState = {
  /** The slide shown, counted from 0. */
  index: number;
  /** How many slides the deck has. */
  count: number;
  /** The audience sees a black screen. The presenter's console keeps the slide. */
  blackout: boolean;
  /** The grid of all slides is open, to jump. */
  grid: boolean;
  /** When the talk began (ms since the epoch), or `null` before the first step forward. */
  startedAt: number | null;
};

export type PlayerAction =
  | { type: "next"; at: number }
  | { type: "previous" }
  | { type: "first" }
  | { type: "last" }
  /** To one slide: from a deep link, the grid or a second window. */
  | { type: "go"; index: number }
  | { type: "blackout" }
  | { type: "grid" }
  /** Leaves whatever lies over the slide: the grid first, then the black screen. */
  | { type: "escape" }
  | { type: "resetTimer"; at: number }
  /** What the presenter's window says, taken over as it is by an audience window. */
  | { type: "sync"; index: number; blackout: boolean };

export function initialState(count: number, index = 0): PlayerState {
  return { index: clamp(index, count), count, blackout: false, grid: false, startedAt: null };
}

function clamp(index: number, count: number) {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), Math.max(count - 1, 0));
}

/** A step to another slide closes the grid and ends the black screen: one sees where one went. */
function at(state: PlayerState, index: number): PlayerState {
  return { ...state, index: clamp(index, state.count), grid: false, blackout: false };
}

export function reduce(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "next":
      // The clock starts with the first step forward, not when the file is opened.
      return { ...at(state, state.index + 1), startedAt: state.startedAt ?? action.at };
    case "previous":
      return at(state, state.index - 1);
    case "first":
      return at(state, 0);
    case "last":
      return at(state, state.count - 1);
    case "go":
      return at(state, action.index);
    case "blackout":
      return { ...state, blackout: !state.blackout, grid: false };
    case "grid":
      return { ...state, grid: !state.grid };
    case "escape":
      return state.grid ? { ...state, grid: false } : { ...state, blackout: false };
    case "resetTimer":
      return { ...state, startedAt: action.at };
    case "sync":
      return { ...state, index: clamp(action.index, state.count), blackout: action.blackout };
  }
}

/** Minutes and seconds since the talk began, as „12:05“, or „0:00“ before it has. */
export function elapsed(startedAt: number | null, now: number): string {
  const seconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
