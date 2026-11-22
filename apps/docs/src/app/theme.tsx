"use client";

import { ThemeSwitch, useTheme } from "@lanfermann/ui";

/** The reader's choice of light or dark, wired to the page the way an app does it. */
export function Theme() {
  const { theme, setTheme } = useTheme();
  return <ThemeSwitch variant="segmented" value={theme} onValueChange={setTheme} />;
}
