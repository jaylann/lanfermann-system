"use client";

import {
  type Dispatch,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { keyBelongsToTarget } from "./actions";
import { hashOfSlide, slideFromHash } from "./hash";
import { intentOfKey, type PlayerIntent } from "./input";
import { initialState, type PlayerAction, type PlayerState, reduce } from "./state";

/** Where a player starts, for an app that brings a talk back and for the workshop's stories. */
export type PlayerStart = Partial<Pick<PlayerState, "index" | "blackout" | "grid" | "startedAt">>;

/** The deck's state, from where `start` says. */
export function usePlayerState(
  count: number,
  start: PlayerStart | undefined,
): [PlayerState, Dispatch<PlayerAction>] {
  return useReducer(reduce, undefined, () => {
    const { index, ...rest } = start ?? {};
    return { ...initialState(count, index), ...rest };
  });
}

/**
 * Keeps the address and the slide together: the hash at load and a hash typed or linked to move
 * the deck, and from the first step on the hash follows the slide (replaced, so the back button
 * leaves the deck instead of walking it).
 */
export function useHash(
  index: number,
  ids: readonly (string | undefined)[],
  go: (index: number) => void,
  enabled: boolean,
): void {
  const mounted = useRef(false);

  // Before the first paint, so a deep link never shows the first slide for a moment. Read here
  // and not as the state's first value: a page drawn on a server knows no hash.
  useLayoutEffect(() => {
    if (!enabled) return;
    const read = () => {
      const linked = slideFromHash(window.location.hash, ids);
      if (linked !== undefined) go(linked);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [ids, go, enabled]);

  useEffect(() => {
    // Not at load: the address is left as it was opened until the deck moves.
    if (!enabled || !mounted.current) return;
    // An id in the address stays while it names this slide: it is the better link.
    if (slideFromHash(window.location.hash, ids) === index) return;
    try {
      window.history.replaceState(window.history.state, "", hashOfSlide(index));
    } catch (error) {
      // Some browsers refuse to rewrite the address of a file opened from disk. The deck goes
      // on without its deep link; anything else is a real error.
      if (!(error instanceof DOMException)) throw error;
    }
  }, [index, ids, enabled]);

  // After the effect above, so that one skips its first run (also when effects run twice).
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
}

/**
 * The player's keys, on the window: a clicker has no idea what has the focus. A key that belongs
 * to the focused element (a field, Enter on a button) and a key something else already handled
 * are left alone. Held down, the stepping keys repeat and the switches do not.
 */
export function useKeys(onIntent: (intent: PlayerIntent) => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const belongs = keyBelongsToTarget(
        event.key,
        target && {
          tagName: target.tagName,
          isContentEditable: target.isContentEditable,
          scrolls: target.hasAttribute("data-player-scroll"),
        },
      );
      if (belongs) return;
      const intent = intentOfKey(event);
      if (!intent) return;
      const steps = intent === "next" || intent === "previous";
      if (event.repeat && !steps) return;
      event.preventDefault();
      onIntent(intent);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onIntent]);
}

/** The time, read again every `interval` ms. With a clock that stands still it never changes. */
export function useNow(now: () => number, interval: number): number {
  const [time, setTime] = useState(now);
  useEffect(() => {
    const id = window.setInterval(() => setTime(now()), interval);
    return () => window.clearInterval(id);
  }, [now, interval]);
  return time;
}

/**
 * Whether someone is at the controls: true from a pointer move, a press or a key until `delay` ms
 * have passed without one. True at first, so the controls are seen once.
 */
export function useActivity(delay: number): boolean {
  const [active, setActive] = useState(true);
  useEffect(() => {
    let timer = window.setTimeout(() => setActive(false), delay);
    const wake = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(false), delay);
      setActive(true);
    };
    const events = ["pointermove", "pointerdown", "keydown"] as const;
    for (const name of events) window.addEventListener(name, wake);
    return () => {
      window.clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, wake);
    };
  }, [delay]);
  return active;
}

function subscribeToFullscreen(onChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/**
 * The window's full screen. `available` is false where a page cannot ask for it (an iPhone, a
 * frame that is not allowed to), and there the button is not drawn.
 */
export function useFullscreen(): { available: boolean; active: boolean; toggle: () => void } {
  const active = useSyncExternalStore(
    subscribeToFullscreen,
    () => document.fullscreenElement !== null,
    () => false,
  );
  // Known only in the browser, so it is read after the first paint: the server draws no button.
  const available = useSyncExternalStore(
    subscribeToNothing,
    () =>
      document.fullscreenEnabled &&
      typeof document.documentElement.requestFullscreen === "function",
    () => false,
  );
  const toggle = useCallback(() => {
    if (!document.fullscreenEnabled) return;
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    // The browser refuses a request that no key or click stands behind. Nothing is lost then:
    // the window stays as it is, and the next press asks again.
    request.catch((error: unknown) => {
      if (!(error instanceof TypeError || error instanceof DOMException)) throw error;
    });
  }, []);
  return { available, active, toggle };
}

function subscribeToNothing(): () => void {
  return () => {};
}

/** A value that is always the latest, for a handler that must not be set up again when it changes. */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
