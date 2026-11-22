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
  return (
    <script
      nonce={nonce}
      // It runs from the server's HTML. Rendered in the browser (a client tree) it is inert
      // text, so React does not warn about a script it would never run.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      // A constant of this module, never content from outside.
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
