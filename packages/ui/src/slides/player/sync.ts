/**
 * How the presenter's window and the audience's window stay on the same slide.
 *
 * The presenter is authoritative. It says where the deck is (`state`): on every change, in answer
 * to a `hello`, and every two seconds, so a window that missed one catches up. The audience's
 * window never moves by itself: a key or a clicker that lands there is sent across as an `intent`,
 * and the window waits for the state that comes back.
 *
 * Every message goes out twice, on a `BroadcastChannel` and with `postMessage` to the other
 * window, because neither works everywhere: a file opened from disk has an origin of its own per
 * page, which no channel crosses, and a window without its opener cannot be posted to. So a
 * message may arrive twice, and both kinds that change something carry a number that only counts
 * up (`seq`): the receiver drops what is not newer than the last it took.
 */
import type { PlayerIntent } from "./input";

/** What a window in a session may ask the presenter for. The grid and the full screen stay local. */
export type RemoteIntent = Extract<
  PlayerIntent,
  "next" | "previous" | "first" | "last" | "blackout" | "escape"
>;

const REMOTE_INTENTS: readonly string[] = [
  "next",
  "previous",
  "first",
  "last",
  "blackout",
  "escape",
] satisfies RemoteIntent[];

export type PlayerMessage =
  /** Audience to presenter: I am here, tell me where the deck is. */
  | { type: "hello" }
  /** Presenter to audience: the slide shown, and whether the screen is black. */
  | { type: "state"; seq: number; index: number; blackout: boolean }
  /** Audience to presenter: a key was pressed here. */
  | { type: "intent"; seq: number; intent: RemoteIntent };

/** How often the presenter repeats the state, in ms. */
export const HEARTBEAT = 2000;
/** After this long without a state, an audience window says hello again, in ms. */
export const SILENCE = 5000;

export function isRemoteIntent(intent: unknown): intent is RemoteIntent {
  return typeof intent === "string" && REMOTE_INTENTS.includes(intent);
}

/** The name of a session's channel. */
export function channelName(session: string): string {
  return `lf-slides:${session}`;
}

/**
 * Whether a numbered message is news: its number is higher than the last one taken, or none was
 * taken yet. The second copy of a message, and one that arrives late, are not.
 */
export function isNewer(seq: number, last: number | null): boolean {
  return last === null || seq > last;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Reads what arrived from another window. Anything that is not a message of this session, in
 * exactly one of the three shapes, is `undefined`: other scripts post to windows too.
 */
export function parseMessage(data: unknown, session: string): PlayerMessage | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const record = data as Record<string, unknown>;
  if (record.lfSlides !== session) return undefined;
  switch (record.type) {
    case "hello":
      return { type: "hello" };
    case "state":
      if (!isCount(record.seq) || !isCount(record.index)) return undefined;
      if (typeof record.blackout !== "boolean") return undefined;
      return { type: "state", seq: record.seq, index: record.index, blackout: record.blackout };
    case "intent":
      if (!isCount(record.seq) || !isRemoteIntent(record.intent)) return undefined;
      return { type: "intent", seq: record.seq, intent: record.intent };
    default:
      return undefined;
  }
}

function isWindow(source: MessageEventSource | null): source is Window {
  return source !== null && "closed" in source;
}

/** The window that opened this one, if there is one and it is still open. */
export function openerWindow(): Window | null {
  const opener: unknown = window.opener;
  if (typeof opener !== "object" || opener === null) return null;
  if (!("postMessage" in opener) || !("closed" in opener)) return null;
  // Checked above: the two members a window is used for here. A window of another origin shows
  // little more than these.
  const other = opener as Window;
  return other.closed ? null : other;
}

export type Link = {
  send(message: PlayerMessage): void;
  close(): void;
};

type LinkOptions = {
  session: string;
  /** The other window, if this one knows it and it is still open. */
  peer: () => Window | null;
  /**
   * Asked when a message of this session arrives from a window that is not the known peer while
   * there is none: true takes it as the peer from now on (a presenter that was reloaded has lost
   * the window it opened, and finds it again by its hello).
   */
  adopt?: (source: Window) => boolean;
  onMessage: (message: PlayerMessage) => void;
};

/** Joins a session: listens on both ways, and sends on both. */
export function openLink({ session, peer, adopt, onMessage }: LinkOptions): Link {
  // A file opened from disk: every page has an opaque origin, written "null".
  const fromDisk = window.location.protocol === "file:";
  const channel =
    typeof BroadcastChannel === "function" ? new BroadcastChannel(channelName(session)) : null;

  const onChannel = (event: MessageEvent<unknown>) => {
    const message = parseMessage(event.data, session);
    if (message) onMessage(message);
  };

  const onWindow = (event: MessageEvent<unknown>) => {
    // Between two pages of one site the origin says who is speaking. From disk it cannot (it is
    // "null" for every page), so there the window the message came from is what is checked.
    if (!fromDisk && event.origin !== window.location.origin) return;
    const message = parseMessage(event.data, session);
    if (!message) return;
    const known = peer();
    if (known) {
      if (event.source !== known) return;
    } else if (!isWindow(event.source) || !adopt?.(event.source)) {
      return;
    }
    onMessage(message);
  };

  channel?.addEventListener("message", onChannel);
  window.addEventListener("message", onWindow);

  return {
    send(message) {
      const wire = { lfSlides: session, ...message };
      channel?.postMessage(wire);
      const other = peer();
      // An opaque origin cannot be named as the target, so from disk the message is addressed to
      // "*". It holds a slide number and nothing else, and the receiver checks its sender.
      other?.postMessage(wire, fromDisk ? "*" : window.location.origin);
    },
    close() {
      channel?.removeEventListener("message", onChannel);
      channel?.close();
      window.removeEventListener("message", onWindow);
    },
  };
}

/** A session's name: short, and not to be guessed by another page. */
export function newSession(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const SESSION_KEY = "lf-slides:session";

/**
 * The session of a presenter's window. It is kept for as long as the tab lives, so a presenter
 * who reloads by accident keeps the audience's window: that one says hello again and is found.
 */
export function sessionOfWindow(): string {
  try {
    const kept = window.sessionStorage.getItem(SESSION_KEY);
    if (kept) return kept;
    const fresh = newSession();
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch (error) {
    // Storage is switched off (a private window, a frame without it): the session then lasts
    // until the page is reloaded, and the audience's window is opened again.
    if (error instanceof DOMException) return newSession();
    throw error;
  }
}
