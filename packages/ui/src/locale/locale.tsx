"use client";

import { createContext, type ReactNode, useContext } from "react";

import { de, en, type Locale, localeTags, type Messages } from "./messages";

/** What a component reads to speak a language: its words, and the tag it formats with. */
export type LocaleValue = {
  locale: Locale;
  /** The BCP 47 tag for `Intl`: `de-DE` or `en-US`. */
  tag: string;
  messages: Messages;
};

// One object per language, made once, so a reader's memo never sees a new one.
const values: Record<Locale, LocaleValue> = {
  de: { locale: "de", tag: localeTags.de, messages: de },
  en: { locale: "en", tag: localeTags.en, messages: en },
};

// `null` is "no provider": the words are German then, but what sorts stays the machine's.
const LocaleContext = createContext<Locale | null>(null);

export type LocaleProviderProps = {
  /** The language every component below speaks where it was given no label of its own. */
  locale: Locale;
  children: ReactNode;
};

/**
 * Sets the language of every component below: the default of each label, and the locale numbers
 * and dates are formatted with. Put it once around the app, with the language of the page. A
 * label or a `locale` passed to a component still wins. Without a provider everything is German.
 *
 * The typed date fields read and write the format of the language: 30.11.2026 in German,
 * 11/30/2026 in English. What they submit is the ISO value in both.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** The language set by the nearest `LocaleProvider`, German without one. */
export function useLocale(): LocaleValue {
  return values[useContext(LocaleContext) ?? "de"];
}

/**
 * The tag of the nearest `LocaleProvider`, and `undefined` without one. For what a component
 * left to the machine before there was a provider (the collation of a `Combobox` and a
 * `Command`): under a provider it follows the page's language, without one nothing changes.
 * Internal.
 */
export function useProvidedTag(): string | undefined {
  const locale = useContext(LocaleContext);
  return locale === null ? undefined : localeTags[locale];
}
