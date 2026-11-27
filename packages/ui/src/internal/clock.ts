/**
 * One clock for every `RelativeTime` on a page, read through `useSyncExternalStore`: a page with
 * a hundred rows of „vor 5 Minuten“ keeps one timer, not a hundred.
 *
 * It ticks every 15 seconds while someone listens, so a minute is never more than a quarter of a
 * minute late. In a tab that is hidden it stops, and it ticks at once when the tab comes back.
 * Browser only: the server has no clock to read (see `RelativeTime`).
 */

const TICK = 15_000;

let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

function start() {
  if (timer !== undefined || document.visibilityState === "hidden") return;
  timer = setInterval(tick, TICK);
}

function stop() {
  clearInterval(timer);
  timer = undefined;
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    stop();
    return;
  }
  tick();
  start();
}

export function subscribeClock(listener: () => void): () => void {
  // A clock nobody listened to stands still, at 0 on a page that was rendered on the server.
  // The first listener sets it, so what React reads right after subscribing is the present and
  // not a moment that turns every "vor 3 Std." into a date until the first tick.
  if (listeners.size === 0 && Date.now() - now >= TICK) now = Date.now();
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    start();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    document.removeEventListener("visibilitychange", onVisibility);
    stop();
  };
}

/**
 * The moment of the last tick. Between ticks every reader gets the same moment, as React asks of
 * a snapshot; a clock that nobody listened to catches up before it is read.
 */
export function readClock(): number {
  if (listeners.size === 0 && Date.now() - now >= TICK) now = Date.now();
  return now;
}
