"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/icon/icon";
import { actionOfIntent } from "@/slides/player/actions";
import { DeckSlide } from "@/slides/player/deck-slide";
import { askForAudienceWindow, useEmbed } from "@/slides/player/embed";
import {
  type PlayerStart,
  useHash,
  useKeys,
  useLatest,
  useNow,
  usePlayerState,
  useReady,
} from "@/slides/player/hooks";
import type { PlayerIntent } from "@/slides/player/input";
import { fill } from "@/slides/player/labels";
import { placeOnOtherScreen } from "@/slides/player/screens";
import { elapsed } from "@/slides/player/state";
import { HEARTBEAT, isNewer, type Link, openLink, sessionOfWindow } from "@/slides/player/sync";
import { Stage } from "@/slides/stage/stage";

import {
  BlockHead,
  controlButton,
  iconButton,
  KeyHint,
  textButton,
  type ViewProps,
} from "./chrome";
import { Grid } from "./grid";

/** The time of day as „14:05“. */
const clock = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

type PresenterViewProps = ViewProps & {
  /** The session the audience's window joins. A new one by default, kept while the tab lives. */
  session?: string;
  start?: PlayerStart;
  now: () => number;
  /** Whether the address follows the slide, and moves it. */
  hash: boolean;
  /**
   * In a frame: the framing page owns the audience's window. It is told where the deck is, may
   * move it, and is asked for the window when the button is pressed (see embed.ts).
   */
  embedded: boolean;
};

/** What the console says under its buttons about the audience's window. */
type Notice = "drag" | "blocked" | null;

/**
 * The presenter's console, on Ink: the current slide large, the next one and the notes beside
 * it, the time since the talk began and the time of day, and the buttons for the grid, the black
 * screen and the audience's window. This window says where the deck is; the audience's follows.
 */
export function PresenterView({
  entries,
  labels,
  lang,
  session: given,
  start,
  now,
  hash,
  embedded,
}: PresenterViewProps) {
  const [state, dispatch] = usePlayerState(entries.length, start);
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const time = useNow(now, 1000);
  const [notice, setNotice] = useState<Notice>(null);
  // Made in the browser only: a server has no tab to keep it in, and nothing drawn depends on it.
  const [ownSession] = useState(
    () => given ?? (typeof window === "undefined" ? "" : sessionOfWindow()),
  );
  // A frame has no second window to speak to: its page relays (embed.ts).
  const session = embedded ? "" : ownSession;
  const root = useRef<HTMLDivElement>(null);
  useReady(root);

  const audience = useRef<Window | null>(null);
  const link = useRef<Link | null>(null);
  const seq = useRef(0);
  const latest = useLatest({ state, now });

  useEffect(() => {
    if (!session) return;
    let lastIntent: number | null = null;
    // Counted from the time, so this window is newer than itself before a reload.
    seq.current = Date.now();
    const opened = openLink({
      session,
      peer: () => (audience.current && !audience.current.closed ? audience.current : null),
      adopt(source) {
        audience.current = source;
        return true;
      },
      onMessage(message) {
        if (message.type === "hello") {
          say();
          return;
        }
        if (message.type !== "intent" || !isNewer(message.seq, lastIntent)) return;
        lastIntent = message.seq;
        const action = actionOfIntent(message.intent, latest.current.now());
        if (action) dispatch(action);
      },
    });
    const say = () => {
      const { index, blackout } = latest.current.state;
      opened.send({ type: "state", seq: seq.current, index, blackout });
    };
    link.current = opened;
    const beat = window.setInterval(say, HEARTBEAT);
    return () => {
      window.clearInterval(beat);
      link.current = null;
      opened.close();
    };
  }, [session, dispatch, latest]);

  // Every change is said at once, under a new number.
  useEffect(() => {
    seq.current += 1;
    link.current?.send({
      type: "state",
      seq: seq.current,
      index: state.index,
      blackout: state.blackout,
    });
  }, [state.index, state.blackout]);

  const act = useCallback(
    (intent: PlayerIntent) => {
      // The full screen is for the audience's window; the console stays a window.
      const action = actionOfIntent(intent, now());
      if (action) dispatch(action);
    },
    [now, dispatch],
  );
  useKeys(act);

  const go = useCallback((index: number) => dispatch({ type: "go", index }), [dispatch]);
  useHash(state.index, ids, go, hash);

  useEmbed({
    enabled: embedded,
    ids,
    index: state.index,
    blackout: state.blackout,
    onCommand(command) {
      if (command.type === "intent") act(command.intent);
      else if (command.blackout === undefined) go(command.index);
      else dispatch({ type: "sync", index: command.index, blackout: command.blackout });
    },
  });

  // When the grid closes, the focus goes back to the button that opened it.
  const gridButton = useRef<HTMLButtonElement>(null);
  const gridWasOpen = useRef(state.grid);
  useEffect(() => {
    if (gridWasOpen.current && !state.grid) gridButton.current?.focus();
    gridWasOpen.current = state.grid;
  }, [state.grid]);

  const openAudience = () => {
    if (embedded) {
      // A frame can open no window: the page around it does, and relays the state.
      askForAudienceWindow();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "audience");
    url.searchParams.set("session", session);
    url.hash = "";
    // In the click itself: a window opened later is a pop-up the browser blocks.
    const popup = window.open(url, "lf-slides-audience", "popup");
    if (!popup) {
      setNotice("blocked");
      return;
    }
    audience.current = popup;
    // What can go wrong here by design (no such API, refused, one screen) comes back as false.
    void placeOnOtherScreen(popup).then((placed) => setNotice(placed ? null : "drag"));
  };

  const count = entries.length;
  const page = state.index + 1;
  const entry = entries[state.index];
  const following = entries[state.index + 1];

  return (
    <div
      ref={root}
      data-slot="player"
      data-mode="presenter"
      data-theme="ink"
      lang={lang}
      className="relative flex h-dvh w-dvw flex-col overflow-hidden font-sans text-base text-fg-body"
    >
      <div
        inert={state.grid}
        role="region"
        aria-label={labels.console}
        className="flex min-h-0 flex-1 flex-col gap-6 p-6"
      >
        <div data-slot="player-console-main" className="min-h-0 flex-1">
          <div data-slot="player-console-columns" className="grid h-full gap-x-8">
            <div className="flex min-h-0 min-w-0 flex-col">
              <BlockHead
                aside={
                  <p role="status" className="truncate text-sm font-medium text-accent">
                    {state.blackout ? labels.blackoutOn : null}
                  </p>
                }
              >
                {fill(labels.slide, { page, count })}
              </BlockHead>
              <div data-slot="player-console-current" className="border border-line">
                <Stage>
                  {entry && (
                    <DeckSlide entry={entry} index={state.index} errorLabel={labels.slideError} />
                  )}
                </Stage>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-x-8 pt-6">
                <div>
                  <BlockHead
                    aside={
                      <button
                        type="button"
                        className={`${textButton} -mr-2`}
                        onClick={() => dispatch({ type: "resetTimer", at: now() })}
                      >
                        {labels.resetTimer}
                      </button>
                    }
                  >
                    {labels.timer}
                  </BlockHead>
                  <p
                    data-slot="player-timer"
                    suppressHydrationWarning
                    className="text-3xl font-medium text-fg tabular-nums"
                  >
                    {elapsed(state.startedAt, time)}
                  </p>
                </div>
                <div>
                  <BlockHead>{labels.clock}</BlockHead>
                  <p
                    data-slot="player-clock"
                    suppressHydrationWarning
                    className="text-3xl font-medium text-fg tabular-nums"
                  >
                    {clock.format(time)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-6">
              <div>
                <BlockHead>{labels.nextSlide}</BlockHead>
                {following ? (
                  <div inert className="border border-line">
                    <Stage>
                      <DeckSlide
                        entry={following}
                        index={state.index + 1}
                        errorLabel={labels.slideError}
                      />
                    </Stage>
                  </div>
                ) : (
                  // The same box as a slide's picture, so the notes under it do not move.
                  <div className="border border-line">
                    <p className="flex aspect-video items-end bg-surface p-4 text-sm text-fg-muted">
                      {labels.end}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <BlockHead>{labels.notes}</BlockHead>
                <div
                  data-slot="player-notes"
                  data-player-scroll=""
                  role="region"
                  aria-label={labels.notes}
                  tabIndex={0}
                  className="min-h-0 flex-1 overflow-y-auto text-lg whitespace-pre-wrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {entry?.notes == null || entry.notes === "" ? (
                    <span className="text-fg-muted">{labels.noNotes}</span>
                  ) : (
                    entry.notes
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line pt-4">
          <button
            ref={gridButton}
            type="button"
            className={controlButton}
            aria-keyshortcuts="G"
            aria-expanded={state.grid}
            onClick={() => dispatch({ type: "grid" })}
          >
            {labels.grid}
            <KeyHint>G</KeyHint>
          </button>
          <button
            type="button"
            className={controlButton}
            aria-keyshortcuts="B"
            aria-pressed={state.blackout}
            onClick={() => dispatch({ type: "blackout" })}
          >
            {labels.blackout}
            <KeyHint>B</KeyHint>
          </button>
          <button type="button" className={controlButton} onClick={openAudience}>
            {labels.openAudience}
          </button>
          <p role="status" className="min-w-0 flex-1 truncate px-2 text-sm text-fg-muted">
            {notice === "drag"
              ? labels.dragHint
              : notice === "blocked"
                ? labels.popupBlocked
                : null}
          </p>
          <button
            type="button"
            className={iconButton}
            aria-label={labels.previous}
            aria-disabled={state.index === 0 ? true : undefined}
            onClick={() => act("previous")}
          >
            <Icon icon={ArrowLeft01Icon} size={18} />
          </button>
          <button
            type="button"
            // The arrow, not the button's box, ends on the rule above.
            className={`${iconButton} -mr-2`}
            aria-label={labels.next}
            aria-disabled={page === count ? true : undefined}
            onClick={() => act("next")}
          >
            <Icon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>
      </div>

      {state.grid && (
        <Grid
          entries={entries}
          labels={labels}
          lang={lang}
          current={state.index}
          onPick={go}
          onClose={() => dispatch({ type: "escape" })}
        />
      )}
    </div>
  );
}
