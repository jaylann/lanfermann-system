"use client";

import { useLocale } from "./locale";
import type { Messages } from "./messages";

/** The entries of a namespace that are plain words: no pattern to fill, no function to call. */
type WordOf<Namespace extends keyof Messages> = {
  [Key in keyof Messages[Namespace]]: Messages[Namespace][Key] extends string ? Key : never;
}[keyof Messages[Namespace]];

export type LocalizedProps<Namespace extends keyof Messages> = {
  /** The component's namespace in the table. */
  ns: Namespace;
  /** Which of its words. */
  name: WordOf<Namespace>;
};

/**
 * One word of the table as text, in the language of the nearest `LocaleProvider`. It is how a
 * server-safe component (`Stat`, `Callout`, `Steps`) says a default word without becoming a
 * client component itself: it renders this leaf only where the caller gave no label of its own.
 * Internal, and for text only: an attribute cannot hold a component.
 */
export function Localized<Namespace extends keyof Messages>({
  ns,
  name,
}: LocalizedProps<Namespace>): string | null {
  const words: Record<string, unknown> = useLocale().messages[ns];
  const word = words[String(name)];
  return typeof word === "string" ? word : null;
}
