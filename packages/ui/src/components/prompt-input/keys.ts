/**
 * What Enter does in a prompt: send, nothing, or what it does in any text field. Pure, so the
 * rules can be tested without a browser.
 */

export type PromptKey = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey" | "isComposing" | "keyCode"
>;

/**
 * A screen that is only touched: there Enter breaks the line and the key sends. An iPad with a
 * keyboard and a trackpad also has a fine pointer, so Enter sends there as on a computer.
 */
export const TOUCH_ONLY = "(pointer: coarse) and (not (any-pointer: fine))";

/**
 * `send`: the prompt goes. `hold`: Enter is taken and nothing happens (an answer is still being
 * written, and the field keeps what is typed). `type`: the field does with the key what a text
 * field does.
 */
export type KeyOutcome = "send" | "hold" | "type";

export function promptKey(
  event: PromptKey,
  { touchOnly, running }: { touchOnly: boolean; running: boolean },
): KeyOutcome {
  if (event.key !== "Enter") return "type";
  // Enter while a word is being composed (Japanese, Chinese, accents on some keyboards) picks
  // the word. Safari sends that Enter after the composition has ended, with `isComposing`
  // false and the key code 229, so both are asked.
  if (event.isComposing || event.keyCode === 229) return "type";
  if (event.shiftKey || event.altKey) return "type";
  const modified = event.metaKey || event.ctrlKey;
  // On a touch screen Enter breaks the line; with a keyboard attached, ⌘ or Strg Enter sends.
  if (touchOnly && !modified) return "type";
  return running ? "hold" : "send";
}
