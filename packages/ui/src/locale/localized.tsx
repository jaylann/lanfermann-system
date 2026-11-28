"use client";

import { numberFormatter } from "@/lib/format";

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

/** The entries of a namespace that are sentences to fill: a function of a count or a name. */
type SentenceOf<Namespace extends keyof Messages> = {
  [Key in keyof Messages[Namespace]]: Messages[Namespace][Key] extends (...args: never[]) => string
    ? Key
    : never;
}[keyof Messages[Namespace]];

export type LocalizedSentenceProps<
  Namespace extends keyof Messages,
  Name extends SentenceOf<Namespace>,
> = {
  /** The component's namespace in the table. */
  ns: Namespace;
  /** Which of its sentences. */
  name: Name;
  /** What goes into it. Plain values: they travel from a Server Component to the browser. */
  args: Messages[Namespace][Name] extends (...args: infer Args) => string ? Args : never;
};

/**
 * A sentence of the table with its count or name filled in, as text: `Localized` for the
 * entries that are functions („4 Dateien“, "4 files"). A server-safe component cannot pass the
 * function itself to the browser, so it passes the arguments. Internal.
 */
export function LocalizedSentence<
  Namespace extends keyof Messages,
  Name extends SentenceOf<Namespace>,
>({ ns, name, args }: LocalizedSentenceProps<Namespace, Name>): string | null {
  const entries: Record<string, unknown> = useLocale().messages[ns];
  const entry = entries[String(name)];
  if (typeof entry !== "function") return null;
  const said: unknown = Reflect.apply(entry, undefined, args);
  return typeof said === "string" ? said : null;
}

export type LocalizedNumberProps = {
  value: number;
  /** How it is written, as `Intl.NumberFormat` options. */
  options?: Intl.NumberFormatOptions;
};

/**
 * A number as text, written the way the nearest `LocaleProvider` writes numbers (German
 * without one). For a server-safe component whose figures should follow the provider when it
 * was given no `locale` of its own (`Bullet`, `Funnel`). Internal.
 */
export function LocalizedNumber({ value, options }: LocalizedNumberProps): string {
  return numberFormatter(useLocale().tag, options).format(value);
}
