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

const LocaleContext = createContext<Locale>("de");

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
 * The typed date and time fields read the German formats (30.11.2026, 14:30) in both languages.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** The language set by the nearest `LocaleProvider`, German without one. */
export function useLocale(): LocaleValue {
  return values[useContext(LocaleContext)];
}
