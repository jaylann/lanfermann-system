/**
 * Every word the components say on their own, in German and in English. Plain data without a
 * hook, so a Server Component can read it too (`getMessages`). The German table is the wording
 * the library ships with and what a component says without a `LocaleProvider`; the English one
 * is American English in the same register. A label prop on a component always wins over both.
 *
 * One namespace per component. A value is a string, a pattern where the component already took
 * one (`{page}`), or a function where a number or a name goes into the sentence.
 */

/** The languages the components speak. */
export type Locale = "de" | "en";

/** The BCP 47 tag each language formats numbers and dates with. */
export const localeTags: Record<Locale, string> = { de: "de-DE", en: "en-US" };

const german = {
  message: {
    good: "Gute Antwort",
    bad: "Schlechte Antwort",
    stopped: "Die Antwort ist abgebrochen.",
    retry: "Noch einmal",
    /** Who a message is from, for assistive tech. */
    user: "Du",
    assistant: "KI",
    /** The name of the pair of rating keys. */
    either: (good: string, bad: string) => `${good} oder ${bad}`,
  },
  promptInput: {
    label: "Nachricht an die KI",
    send: "Senden",
    stop: "Anhalten",
    attachments: "Anhänge",
  },
  siteHeader: {
    close: "Menü schließen",
  },
  sidebar: {
    close: "Schließen",
    trigger: "Seitenleiste",
  },
  searchField: {
    clear: "Suche leeren",
  },
  banner: {
    close: "Hinweis schließen",
    tone: {
      info: "Hinweis",
      success: "Erledigt",
      warning: "Warnung",
      danger: "Fehler",
    },
  },
  charts: {
    empty: "Für diesen Zeitraum gibt es noch keine Werte.",
    change: "Veränderung",
    /** The two ends of a heatmap's scale. */
    less: "Weniger",
    more: "Mehr",
  },
  sources: {
    title: "Quellen",
    newTab: "öffnet in einem neuen Tab",
    /** The name of a numbered reference in the text. */
    label: (number: number, title: string) => `Quelle ${number}: ${title}`,
  },
  tableOfContents: {
    title: "Auf dieser Seite",
  },
  dateRangeField: {
    presets: "Schnellauswahl",
  },
  fileTile: {
    retry: "Noch einmal versuchen",
    folder: "Ordner",
    status: {
      uploading: "Wird hochgeladen",
      done: "Hochgeladen",
      error: "Fehlgeschlagen",
    },
  },
  storedSecretField: {
    saved: "Gespeichert",
    stored: "Gesetzt",
    ending: "endet auf",
    replace: "Ersetzen",
    reveal: "Anzeigen",
    hide: "Verbergen",
  },
  fileUpload: {
    title: "Dateien hierher ziehen",
    dropTitle: "Loslassen, um sie hinzuzufügen",
    button: "Dateien auswählen",
    retry: "Noch einmal versuchen",
    /** The name of the key that removes a file. */
    remove: (name: string) => `${name} entfernen`,
    status: {
      waiting: "Wartet",
      uploading: "Wird hochgeladen",
      done: "Hochgeladen",
      error: "Fehlgeschlagen",
    },
  },
  drawer: {
    close: "Schließen",
  },
  secretField: {
    reveal: "Anzeigen",
    hide: "Verbergen",
    copy: "Kopieren",
    copied: "Kopiert",
    copiedMessage: "In die Zwischenablage kopiert.",
    failed: "Markiert",
    failedMessage: (keys: string) =>
      `Nicht kopiert. Der Wert ist markiert und kann mit ${keys} kopiert werden.`,
  },
  quote: {
    copy: "Text kopieren",
    copiedMessage: "Der Text wurde kopiert.",
    failedMessage: (keys: string) =>
      `Der Text wurde nicht kopiert. Er ist markiert und kann mit ${keys} kopiert werden.`,
  },
  toast: {
    close: "Schließen",
    label: "Benachrichtigungen",
  },
  copy: {
    copiedMessage: "In die Zwischenablage kopiert.",
    copy: "Kopieren",
    copied: "Kopiert",
    /** On the key when the clipboard was refused and the text was selected instead. */
    selected: "Markiert",
    failed: "Nicht kopiert",
    /** Said when the text was selected instead; `keys` are the keys that copy (⌘C, Strg+C). */
    selectedMessage: (keys: string) =>
      `Nicht kopiert. Der Text ist markiert und kann mit ${keys} kopiert werden.`,
    failedMessage: "Nicht kopiert. Der Browser hat den Zugriff auf die Zwischenablage abgelehnt.",
    /** The keys that copy on a keyboard that is not Apple's. */
    keys: "Strg+C",
  },
  combobox: {
    clear: "Auswahl löschen",
    open: "Liste öffnen",
    chips: "Ausgewählt",
    empty: "Nichts gefunden.",
    list: "Vorschläge",
    /** The row that offers to make what was typed. */
    create: (label: string) => `„${label}“ anlegen`,
    /** The name of a chip's key that takes the choice away again. */
    remove: (name: string) => `${name} entfernen`,
    chipsHint: (count: number) =>
      `${count} ausgewählt. Am Anfang des Felds führt die Pfeiltaste nach links zu den gewählten Einträgen.`,
  },
  codeBlock: {
    wrap: "Zeilen umbrechen",
    download: "Herunterladen",
    downloaded: "Heruntergeladen",
    downloadedMessage: "Die Datei wurde heruntergeladen.",
    copy: "Code kopieren",
    copiedMessage: "Der Code wurde kopiert.",
    failedMessage: (keys: string) =>
      `Der Code wurde nicht kopiert. Er ist markiert und kann mit ${keys} kopiert werden.`,
  },
  editableName: {
    label: "Name",
  },
  cta: {
    send: "Nachricht senden",
    sentTitle: "Die Nachricht wurde gesendet.",
    failedText: "Die Nachricht wurde nicht gesendet. Bitte versuche es noch einmal.",
  },
  dialog: {
    close: "Schließen",
  },
  actionBar: {
    clear: "Auswahl aufheben",
    label: "Auswahl",
    /** The word after the count. */
    count: "ausgewählt",
  },
  command: {
    label: "Befehle",
    choose: "Auswählen",
    move: "Bewegen",
    back: "Zurück",
    close: "Schließen",
  },
  mediaPreview: {
    open: "PDF öffnen",
  },
  pagination: {
    label: "Seiten",
    page: "Seite {page}",
    position: "Seite {page} von {pages}",
    previous: "Vorherige Seite",
    next: "Nächste Seite",
  },
  themeSwitch: {
    label: "Erscheinungsbild",
    themes: {
      system: "System",
      light: "Hell",
      dark: "Dunkel",
    },
  },
  breadcrumbs: {
    more: "Weitere Orte",
  },
  conversation: {
    label: "Unterhaltung",
    latest: "Neueste",
  },
  attachment: {
    /** One verb, said after the file's name. */
    remove: "entfernen",
    status: {
      uploading: "Wird hochgeladen",
      done: "Hochgeladen",
      error: "Fehlgeschlagen",
    },
  },
  trace: {
    status: {
      pending: "Steht aus",
      running: "Läuft",
      done: "Erledigt",
      error: "Fehlgeschlagen",
    },
  },
  otpField: {
    /** The name of each box after the first. */
    slot: (position: number, total: number) => `Ziffer ${position} von ${total}`,
  },
  numberField: {
    decrement: "Verringern",
    increment: "Erhöhen",
  },
  avatar: {
    /** What a presence dot is called. */
    presence: {
      online: "Online",
      away: "Abwesend",
      offline: "Offline",
    },
  },
};

/** The shape of a table: what every language has to say. */
export type Messages = typeof german;

export const de: Messages = german;

export const en: Messages = {
  message: {
    good: "Good answer",
    bad: "Bad answer",
    stopped: "The answer was stopped.",
    retry: "Try again",
    user: "You",
    assistant: "AI",
    either: (good, bad) => `${good} or ${bad}`,
  },
  promptInput: {
    label: "Message to the AI",
    send: "Send",
    stop: "Stop",
    attachments: "Attachments",
  },
  siteHeader: {
    close: "Close menu",
  },
  sidebar: {
    close: "Close",
    trigger: "Sidebar",
  },
  searchField: {
    clear: "Clear search",
  },
  banner: {
    close: "Close notice",
    tone: {
      info: "Note",
      success: "Done",
      warning: "Warning",
      danger: "Error",
    },
  },
  charts: {
    empty: "There are no values for this period yet.",
    change: "Change",
    less: "Less",
    more: "More",
  },
  sources: {
    title: "Sources",
    newTab: "opens in a new tab",
    label: (number, title) => `Source ${number}: ${title}`,
  },
  tableOfContents: {
    title: "On this page",
  },
  dateRangeField: {
    presets: "Presets",
  },
  fileTile: {
    retry: "Try again",
    folder: "Folder",
    status: {
      uploading: "Uploading",
      done: "Uploaded",
      error: "Failed",
    },
  },
  storedSecretField: {
    saved: "Saved",
    stored: "Set",
    ending: "ends in",
    replace: "Replace",
    reveal: "Show",
    hide: "Hide",
  },
  fileUpload: {
    title: "Drag files here",
    dropTitle: "Drop to add them",
    button: "Choose files",
    retry: "Try again",
    remove: (name) => `Remove ${name}`,
    status: {
      waiting: "Waiting",
      uploading: "Uploading",
      done: "Uploaded",
      error: "Failed",
    },
  },
  drawer: {
    close: "Close",
  },
  secretField: {
    reveal: "Show",
    hide: "Hide",
    copy: "Copy",
    copied: "Copied",
    copiedMessage: "Copied to the clipboard.",
    failed: "Selected",
    failedMessage: (keys) => `Not copied. The value is selected and can be copied with ${keys}.`,
  },
  quote: {
    copy: "Copy text",
    copiedMessage: "The text was copied.",
    failedMessage: (keys) =>
      `The text was not copied. It is selected and can be copied with ${keys}.`,
  },
  toast: {
    close: "Close",
    label: "Notifications",
  },
  copy: {
    copiedMessage: "Copied to the clipboard.",
    copy: "Copy",
    copied: "Copied",
    selected: "Selected",
    failed: "Not copied",
    selectedMessage: (keys) => `Not copied. The text is selected and can be copied with ${keys}.`,
    failedMessage: "Not copied. The browser refused access to the clipboard.",
    keys: "Ctrl+C",
  },
  combobox: {
    clear: "Clear selection",
    open: "Open list",
    chips: "Selected",
    empty: "Nothing found.",
    list: "Suggestions",
    create: (label) => `Create “${label}”`,
    remove: (name) => `Remove ${name}`,
    chipsHint: (count) =>
      `${count} selected. At the start of the field, the left arrow key leads to the chosen entries.`,
  },
  codeBlock: {
    wrap: "Wrap lines",
    download: "Download",
    downloaded: "Downloaded",
    downloadedMessage: "The file was downloaded.",
    copy: "Copy code",
    copiedMessage: "The code was copied.",
    failedMessage: (keys) =>
      `The code was not copied. It is selected and can be copied with ${keys}.`,
  },
  editableName: {
    label: "Name",
  },
  cta: {
    send: "Send message",
    sentTitle: "The message was sent.",
    failedText: "The message was not sent. Try again.",
  },
  dialog: {
    close: "Close",
  },
  actionBar: {
    clear: "Clear selection",
    label: "Selection",
    count: "selected",
  },
  command: {
    label: "Commands",
    choose: "Select",
    move: "Navigate",
    back: "Back",
    close: "Close",
  },
  mediaPreview: {
    open: "Open PDF",
  },
  pagination: {
    label: "Pages",
    page: "Page {page}",
    position: "Page {page} of {pages}",
    previous: "Previous page",
    next: "Next page",
  },
  themeSwitch: {
    label: "Appearance",
    themes: {
      system: "System",
      light: "Light",
      dark: "Dark",
    },
  },
  breadcrumbs: {
    more: "More places",
  },
  conversation: {
    label: "Conversation",
    latest: "Latest",
  },
  attachment: {
    remove: "remove",
    status: {
      uploading: "Uploading",
      done: "Uploaded",
      error: "Failed",
    },
  },
  trace: {
    status: {
      pending: "Pending",
      running: "Running",
      done: "Done",
      error: "Failed",
    },
  },
  otpField: {
    slot: (position, total) => `Digit ${position} of ${total}`,
  },
  numberField: {
    decrement: "Decrease",
    increment: "Increase",
  },
  avatar: {
    presence: {
      online: "Online",
      away: "Away",
      offline: "Offline",
    },
  },
};

const tables: Record<Locale, Messages> = { de, en };

/** The table of a language, for a Server Component that passes words down as props. */
export function getMessages(locale: Locale): Messages {
  return tables[locale];
}
