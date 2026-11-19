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
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words.at(-1)!.charAt(0) : "";
  return (first + last).toLocaleUpperCase();
}

/**
 * What a person is called, with their presence in brackets, so it reads apart from the next
 * name in a list: „Anna Weber (online)“.
 */
export function personLabel(
  person: AvatarPerson,
  presenceLabels: Record<Presence, string> = defaultPresenceLabels,
): string {
  return person.presence
    ? `${person.name} (${presenceLabels[person.presence].toLocaleLowerCase()})`
    : person.name;
}

/** Everyone in one sentence: „Anna Weber, Jonas Klein und Lena Fischer“. */
export function listOf(names: readonly string[], locale: Intl.LocalesArgument = "de-DE"): string {
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(names);
}
