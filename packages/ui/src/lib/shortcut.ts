/**
 * Keyboard shortcuts as data: how one is written, how it is drawn on a keyboard, and whether a
 * key press is it. Plain functions without a hook, so the server can draw a shortcut too.
 *
 * A shortcut is written as its keys joined by a plus: `mod+k`, `mod+shift+p`, `esc`, `/`. `mod`
 * is the key an operating system uses for its commands: ⌘ on Apple devices, Strg elsewhere.
 * The other names are `ctrl`, `alt`, `shift`, `enter`, `esc`, `tab`, `space`, `backspace`,
 * `delete`, `up`, `down`, `left`, `right` and `plus`; anything else is the character itself.
 */

/** The two kinds of keyboard a shortcut is drawn for. */
export type Platform = "apple" | "other";

/** One key of a shortcut: what stands on its cap, and what it is called when read out. */
export type ShortcutKey = { label: string; name: string };

type Modifier = "mod" | "ctrl" | "alt" | "shift";

const modifiers: ReadonlySet<string> = new Set<Modifier>(["mod", "ctrl", "alt", "shift"]);

/** What stands on the cap, and its name, where the two kinds of keyboard agree. */
const shared: Record<string, ShortcutKey> = {
  shift: { label: "⇧", name: "Umschalttaste" },
  enter: { label: "↵", name: "Eingabetaste" },
  esc: { label: "Esc", name: "Escape" },
  tab: { label: "⇥", name: "Tabulatortaste" },
  space: { label: "Leertaste", name: "Leertaste" },
  backspace: { label: "⌫", name: "Rücktaste" },
  up: { label: "↑", name: "Pfeil nach oben" },
  down: { label: "↓", name: "Pfeil nach unten" },
  left: { label: "←", name: "Pfeil nach links" },
  right: { label: "→", name: "Pfeil nach rechts" },
  plus: { label: "+", name: "Plus" },
};

/** Where they differ: an Apple keyboard prints symbols, the others print German words. */
const perPlatform: Record<Platform, Record<string, ShortcutKey>> = {
  apple: {
    mod: { label: "⌘", name: "Befehlstaste" },
    ctrl: { label: "⌃", name: "Control" },
    alt: { label: "⌥", name: "Wahltaste" },
    delete: { label: "⌦", name: "Entfernen" },
  },
  other: {
    mod: { label: "Strg", name: "Steuerung" },
    ctrl: { label: "Strg", name: "Steuerung" },
    alt: { label: "Alt", name: "Alt" },
    delete: { label: "Entf", name: "Entfernen" },
  },
};

/** The value of `KeyboardEvent.key` for each named key. */
const eventKeys: Record<string, string> = {
  enter: "Enter",
  esc: "Escape",
  tab: "Tab",
  space: " ",
  backspace: "Backspace",
  delete: "Delete",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  plus: "+",
};

function tokens(keys: string): string[] {
  return keys
    .split("+")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

/** The keys of a shortcut in the order they are written, as they stand on that keyboard. */
export function shortcutKeys(keys: string, platform: Platform): ShortcutKey[] {
  return tokens(keys).map((token) => {
    const named = perPlatform[platform][token] ?? shared[token];
    if (named) return named;
    const label = token.length === 1 ? token.toUpperCase() : token;
    return { label, name: label };
  });
}

/** Whether a shortcut holds a key that turns a letter into a command: `mod`, `ctrl` or `alt`. */
export function hasCommandKey(keys: string): boolean {
  return tokens(keys).some((token) => token === "mod" || token === "ctrl" || token === "alt");
}

/** Whether a shortcut is drawn differently on the two kinds of keyboard. */
export function dependsOnPlatform(keys: string): boolean {
  return tokens(keys).some((token) => token in perPlatform.apple);
}

/** The parts of a key press a shortcut is compared with. A `KeyboardEvent` is one. */
export type KeyPress = Pick<
  KeyboardEvent,
  "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/**
 * Whether a key press is the shortcut, on that kind of keyboard.
 *
 * A letter is compared by what the key types, not by where it sits, so the shortcut follows the
 * layout: `mod+z` is the key marked Z on a German keyboard too. Two exceptions. With `alt` held
 * a key types another character (⌥K gives ˚), so there the place of the key decides. And a sign
 * such as `?` needs Shift on some layouts and not on others, so for a sign Shift is not compared.
 */
export function matchesShortcut(press: KeyPress, keys: string, platform: Platform): boolean {
  const parts = tokens(keys);
  const key = parts.find((part) => !modifiers.has(part));
  if (!key) return false;

  const wants = (modifier: Modifier) => parts.includes(modifier);
  const meta = platform === "apple" && wants("mod");
  const ctrl = wants("ctrl") || (platform === "other" && wants("mod"));
  if (press.metaKey !== meta || press.ctrlKey !== ctrl || press.altKey !== wants("alt")) {
    return false;
  }

  const named = eventKeys[key];
  const letter = /^[a-z0-9]$/.test(key);
  if ((named !== undefined || letter) && press.shiftKey !== wants("shift")) return false;

  if (named !== undefined) return press.key === named;
  if (letter && wants("alt")) {
    return press.code === (/[0-9]/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`);
  }
  return press.key.toLowerCase() === key;
}

/** Whether the keyboard in front of the reader is an Apple one. Only the browser can say. */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const hinted = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  return /mac|iphone|ipad|ipod/i.test(hinted || navigator.platform || navigator.userAgent)
    ? "apple"
    : "other";
}

/** Whether a key press lands in something that is typed into: a field, or editable text. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
}
