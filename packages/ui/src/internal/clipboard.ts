/**
 * Puts text on the clipboard, or rejects when the browser refuses.
 *
 * The text may still be on its way (a page being fetched). A browser only lets a press write to
 * the clipboard, and a write that waits for the text first has left the press by the time it
 * comes. Where the browser takes a promise for the clipboard (Safari, Chrome), the promise is
 * handed over inside the press and the text follows; elsewhere the write waits for it.
 */
export async function writeClipboard(text: string | Promise<string>): Promise<void> {
  if (typeof text === "string") {
    await navigator.clipboard.writeText(text);
    return;
  }
  try {
    if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
      const blob = text.then((body) => new Blob([body], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return;
    }
  } catch {
    // The plain write below is the second try.
  }
  await navigator.clipboard.writeText(await text);
}

/**
 * Selects what an element shows, so ⌘C still copies it after the clipboard was refused: the
 * text of a field, or everything inside any other element.
 */
export function selectContents(element: HTMLElement | null | undefined) {
  if (!element) return;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus();
    element.select();
    return;
  }
  window.getSelection()?.selectAllChildren(element);
}
