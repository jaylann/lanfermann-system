import { themeScript } from "./theme-mode";

export type ThemeScriptProps = {
  /** The nonce of a Content Security Policy that allows inline scripts only with one. */
  nonce?: string;
};

/**
 * Sets the page's mode before it is first painted, from the reader's stored choice or, without
 * one, from the system's setting. Without it a reader on dark sees the light page flash first.
 *
 * Put it first in the <head> of the root layout, and give <html> `suppressHydrationWarning`: the
 * script writes `data-mode` there before React hydrates. A Server Component: it renders the
 * script and nothing else. Changing the mode afterwards is `useTheme`'s.
 */
export function ThemeScript({ nonce }: ThemeScriptProps) {
  // The script is a constant of this module, never content from outside.
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
