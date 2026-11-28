/**
 * A message as a caller may give it to a field: the finished sentence, or a function that is
 * handed what the default sentence names (an example the field would read, the limits as the
 * field writes them). Server-safe.
 */
export type Wording<Args extends readonly string[]> = string | ((...args: Args) => string);

/** The sentence of a wording, with what it names filled in. */
export function worded<Args extends readonly string[]>(
  wording: Wording<Args>,
  ...args: Args
): string {
  return typeof wording === "string" ? wording : wording(...args);
}
