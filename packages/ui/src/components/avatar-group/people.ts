/** Whether a person is there: shown as a dot on their avatar, and always said in words. */
export type Presence = "online" | "away" | "offline";

export const defaultPresenceLabels: Record<Presence, string> = {
  online: "Online",
  away: "Abwesend",
  offline: "Offline",
};

/** One person in an `AvatarGroup`. */
export type AvatarPerson = {
  /** The full name, as the tooltip and assistive tech say it. */
  name: string;
  /** A picture; the initials show until it has loaded, or if there is none. */
  src?: string;
  /** One or two letters; by default the first letters of the first and the last name. */
  initials?: string;
  presence?: Presence;
};

/** „Anna Weber“ → „AW“, „Cher“ → „C“. */
export function initialsOf(name: string, locale: Intl.LocalesArgument = "de-DE"): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  // The first character, not the first half of one: „𠮷田“ starts with a pair of code units.
  const letter = (word: string) => [...word][0] ?? "";
  const first = letter(words[0]!);
  const last = words.length > 1 ? letter(words.at(-1)!) : "";
  // In a named locale, as `personLabel` below: the server and the browser must agree.
  return (first + last).toLocaleUpperCase(locale);
}

/**
 * What a person is called, with their presence in brackets, so it reads apart from the next
 * name in a list: „Anna Weber (online)“.
 */
export function personLabel(
  person: AvatarPerson,
  presenceLabels: Record<Presence, string> = defaultPresenceLabels,
  // Named, not the runtime's own: a server and a browser set to Turkish would lower an „I“
  // differently, and the group's name would differ between the two.
  locale: Intl.LocalesArgument = "de-DE",
): string {
  return person.presence
    ? `${person.name} (${presenceLabels[person.presence].toLocaleLowerCase(locale)})`
    : person.name;
}

/** Everyone in one sentence: „Anna Weber, Jonas Klein und Lena Fischer“. */
export function listOf(names: readonly string[], locale: Intl.LocalesArgument = "de-DE"): string {
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(names);
}
