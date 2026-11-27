"use client";

import { usePlatform } from "@/components/shortcut/shortcut";
import { useLocale } from "@/locale/locale";

/**
 * The keys that copy what is selected, as this keyboard names them: ⌘C on an Apple device,
 * Strg+C elsewhere (Ctrl+C in English). For the sentence that tells someone to copy by hand when the browser has
 * refused the clipboard.
 */
export function useCopyKeys(): string {
  const { messages } = useLocale();
  return usePlatform() === "apple" ? "⌘C" : messages.copy.keys;
}
