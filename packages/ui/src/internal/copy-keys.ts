"use client";

import { usePlatform } from "@/components/shortcut/shortcut";

/**
 * The keys that copy what is selected, as this keyboard names them: ⌘C on an Apple device,
 * Strg+C elsewhere. For the sentence that tells someone to copy by hand when the browser has
 * refused the clipboard.
 */
export function useCopyKeys(): string {
  return usePlatform() === "apple" ? "⌘C" : "Strg+C";
}
