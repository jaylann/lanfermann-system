"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useEffectEvent,
  useSyncExternalStore,
} from "react";

import { Kbd } from "@/components/kbd/kbd";
import { cn } from "@/lib/cn";
import {
  dependsOnPlatform,
  detectPlatform,
  hasCommandKey,
  isTypingTarget,
  matchesShortcut,
  type Platform,
  shortcutKeys,
} from "@/lib/shortcut";
import { useLocale } from "@/locale/locale";

const PlatformContext = createContext<Platform | undefined>(undefined);

export type ShortcutProviderProps = {
  /** The kind of keyboard the reader has, as the server knows it. */
  platform: Platform;
  children: ReactNode;
};

/**
 * Tells every `Shortcut` below which keyboard to draw, for an app whose server knows it (from
 * the `Sec-CH-UA-Platform` header, or a cookie set on the first visit). The page then arrives
 * with the right keys. Without it a shortcut finds out in the browser.
 */
export function ShortcutProvider({ platform, children }: ShortcutProviderProps) {
  return <PlatformContext value={platform}>{children}</PlatformContext>;
}

// The keyboard does not change while the page is open: nothing to listen to.
const never = () => () => {};
const unknown = () => undefined;

/** The reader's keyboard, or `undefined` for as long as only the browser could say. */
function useKnownPlatform(): Platform | undefined {
  const given = useContext(PlatformContext);
  const detected = useSyncExternalStore<Platform | undefined>(never, detectPlatform, unknown);
  return given ?? detected;
}

/** The kind of keyboard the reader has: `apple` or `other`. On the server it is `other`. */
export function usePlatform(): Platform {
  return useKnownPlatform() ?? "other";
}

export type ShortcutProps = Omit<ComponentProps<"kbd">, "children"> & {
  /**
   * The shortcut, as its keys joined by a plus: `mod+k`, `mod+shift+p`, `esc`, `/`. `mod` is
   * ⌘ on an Apple device and Strg elsewhere.
   */
  keys: string;
  /** Draw it for this keyboard, whatever the reader has: for a page that documents both. */
  platform?: Platform;
};

/**
 * A keyboard shortcut in the keys of the reader's own keyboard: ⌘ K on a Mac, Strg K on
 * Windows. Put it at the end of the menu entry, the button or the tooltip that the shortcut
 * stands for. It only shows the keys; `useShortcut` listens for them.
 *
 * A page that comes from a server cannot know the keyboard. A shortcut that differs between
 * keyboards therefore keeps its place but stays unseen until the browser has looked, rather
 * than showing the wrong key first. A `ShortcutProvider` spares it the wait.
 */
export function Shortcut({ keys, platform: fixed, className, ...props }: ShortcutProps) {
  const known = useKnownPlatform();
  const { locale } = useLocale();
  const platform = fixed ?? known ?? "other";
  const waits = fixed === undefined && known === undefined && dependsOnPlatform(keys);
  const caps = shortcutKeys(keys, platform, locale);
  return (
    <kbd
      data-slot="shortcut"
      data-platform={waits ? undefined : platform}
      className={cn("inline-flex shrink-0 items-center gap-1", waits && "invisible", className)}
      {...props}
    >
      {/* A symbol is read out differently by every screen reader, or not at all. */}
      <span className="sr-only">{caps.map((cap) => cap.name).join(" ")}</span>
      {caps.map((cap, index) => (
        <Kbd key={index} aria-hidden>
          {cap.label}
        </Kbd>
      ))}
    </kbd>
  );
}

export type UseShortcutOptions = {
  /** Set to `false` while the shortcut should not answer (a dialog is open over its page). */
  enabled?: boolean;
};

/**
 * Calls `onPress` when the shortcut is pressed anywhere in the window, written like the `keys`
 * of a `Shortcut`. The browser's own action for those keys is stopped.
 *
 * A shortcut without ⌘, Strg or Alt (`/`, `g`) does not answer while the reader types into a
 * field. A press that is held down counts once.
 */
export function useShortcut(
  keys: string,
  onPress: (event: KeyboardEvent) => void,
  { enabled = true }: UseShortcutOptions = {},
) {
  const platform = usePlatform();
  const pressed = useEffectEvent(onPress);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (!matchesShortcut(event, keys, platform)) return;
      if (!hasCommandKey(keys) && isTypingTarget(event.target)) return;
      event.preventDefault();
      pressed(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keys, platform, enabled]);
}
