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
    attach: "Datei anhängen",
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
    /** Between a value and its goal: „12 von 20“, „60 % vom Ziel“. */
    of: "von",
    ofTarget: "vom Ziel",
    /** What assistive tech calls the plot, and how its keyboard is explained after the name. */
    chart: "Diagramm",
    calendar: "Kalender",
    hintValues: "Mit den Pfeiltasten durch die Werte gehen.",
    hintSteps: "Mit den Pfeiltasten durch die Schritte gehen.",
    hintRows: "Mit den Pfeiltasten durch die Zeilen gehen.",
    hintDays: "Mit den Pfeiltasten durch die Tage gehen.",
    /** The column heads of the tables behind the charts, and the rows of their readouts. */
    total: "Summe",
    running: "Stand",
    time: "Zeitpunkt",
    category: "Kategorie",
    step: "Schritt",
    row: "Zeile",
    /** What a funnel's rate is measured against, said after it. */
    ratePrevious: "vom Schritt davor",
    rateFirst: "vom ersten Schritt",
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
    /** Around an example the field would read, in the format of its language. */
    invalid: (example: string) => `Bitte geben Sie einen Zeitraum ein, zum Beispiel ${example}.`,
    invalidWithTime: (example: string) =>
      `Bitte geben Sie Beginn und Ende ein, zum Beispiel ${example}.`,
    sheet: "Zeitraum wählen",
    /** The names of the two times under the calendar. */
    from: "Von",
    to: "bis",
    /** The name of a preset from `lastDays(7)` that was given none of its own. */
    lastDays: (count: number) => `Letzte ${count} Tage`,
  },
  fileGrid: {
    loading: "Die Dateien werden geladen.",
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
    /** Between what has arrived and the whole: „1,2 von 2,4 MB“. */
    of: "von",
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
    /** The name of the region when the block has no title. */
    label: "Code",
    /** The key that unfolds a long block. */
    fold: (hidden: number) => `${hidden} weitere Zeilen`,
    /** What a changed line is marked with (`CodeLines`, an attribute). */
    added: "hinzugefügt",
    removed: "entfernt",
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
    /** The navigation's name (an attribute: a Server Component passes it). */
    label: "Pfad",
  },
  conversation: {
    label: "Unterhaltung",
    latest: "Neueste",
  },
  attachment: {
    /**
     * The name of the key that takes a file away. `said` is what a screen reader has read of
     * the file before the verb since there was a key (its name, in a chip also its size or
     * status), and German keeps it; a language that puts the verb first names the file alone.
     */
    remove: (name: string, said: string) => `${said} entfernen`,
    status: {
      uploading: "Wird hochgeladen",
      done: "Hochgeladen",
      error: "Fehlgeschlagen",
    },
    /** The word for a kind of file where its name has no extension to show. */
    kinds: {
      pdf: "PDF",
      image: "Bild",
      sheet: "Tabelle",
      csv: "CSV",
      document: "Dokument",
      archive: "Archiv",
      audio: "Audio",
      video: "Video",
      file: "Datei",
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
  callout: {
    /** The title of each tone when the caller gives none. */
    note: "Hinweis",
    tip: "Tipp",
    important: "Wichtig",
    warning: "Warnung",
    caution: "Vorsicht",
  },
  link: {
    /** Said after a link that leaves the site. */
    external: "öffnet in einem neuen Tab",
  },
  pager: {
    /** The navigation's name (an attribute: a Server Component passes it). */
    label: "Weitere Seiten",
    next: "Nächste Seite",
    previous: "Vorherige Seite",
  },
  parameterList: {
    required: "erforderlich",
    optional: "optional",
    default: "Standard:",
  },
  stat: {
    /** Which way a change went, for assistive tech. */
    up: "Gestiegen",
    down: "Gesunken",
    flat: "Unverändert",
  },
  steps: {
    /** Where a step stands, for assistive tech. */
    done: "Erledigt",
    current: "Aktueller Schritt",
    upcoming: "Steht aus",
  },
  anchorHeading: {
    /** The link beside a heading (an attribute: a Server Component passes it). */
    label: "Link zu diesem Abschnitt",
  },
  chip: {
    /** The key that removes a chip (an attribute: a Server Component passes it). */
    remove: "Entfernen",
  },
  fileThumbStack: {
    /** The name of a stack of files (an attribute: a Server Component passes it). */
    count: (count: number) => (count === 1 ? "1 Datei" : `${count} Dateien`),
  },
  picker: {
    /** The key at the end of a date field, and the key that closes its sheet. */
    open: "Kalender öffnen",
    done: "Fertig",
  },
  calendar: {
    /** What a day's name carries for assistive tech: "Heute, Samstag, 14. November 2026". */
    today: "Heute",
    selected: "ausgewählt",
  },
  dateField: {
    /**
     * Around an example the field would read. It comes from the formatter of the language
     * (30.11.2026, in English 11/30/2026), as the days in `limits` do.
     */
    invalid: (example: string) => `Bitte geben Sie ein Datum ein, zum Beispiel ${example}.`,
    invalidWithTime: (example: string) =>
      `Bitte geben Sie Datum und Uhrzeit ein, zum Beispiel ${example}.`,
    limits: {
      between: (min: string, max: string) =>
        `Bitte wählen Sie ein Datum zwischen dem ${min} und dem ${max}.`,
      from: (min: string) => `Bitte wählen Sie ein Datum ab dem ${min}.`,
      until: (max: string) => `Bitte wählen Sie ein Datum bis zum ${max}.`,
    },
    /** The placeholder, around an example the field would read. */
    example: (example: string) => `z. B. ${example}`,
    /** The name of the sheet with the calendar. */
    sheet: "Datum wählen",
    sheetWithTime: "Datum und Uhrzeit wählen",
    time: "Uhrzeit",
  },
  timeField: {
    invalid: (example: string) => `Bitte geben Sie eine Uhrzeit ein, zum Beispiel ${example}.`,
    between: (min: string, max: string) =>
      `Bitte wählen Sie eine Uhrzeit zwischen ${min} und ${max}.`,
    from: (min: string) => `Bitte wählen Sie eine Uhrzeit ab ${min}.`,
    until: (max: string) => `Bitte wählen Sie eine Uhrzeit bis ${max}.`,
    example: (example: string) => `z. B. ${example}`,
    /** The name of the list of times. */
    list: "Uhrzeiten",
  },
  fileDropArea: {
    /** What the picture under the pointer says for this many dragged items. */
    items: (count: number) => (count === 1 ? "1 Datei" : `${count} Dateien`),
  },
  tracker: {
    /** What assistive tech calls the strip. */
    role: "Verlauf",
    /** Said after the strip's name: how the keyboard moves through it. */
    hint: "Mit den Pfeiltasten durch die Einträge gehen.",
    status: {
      success: "In Ordnung",
      warning: "Gestört",
      danger: "Ausgefallen",
      none: "Keine Daten",
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
    attach: "Attach file",
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
    of: "of",
    ofTarget: "of target",
    chart: "Chart",
    calendar: "Calendar",
    hintValues: "Use the arrow keys to move through the values.",
    hintSteps: "Use the arrow keys to move through the steps.",
    hintRows: "Use the arrow keys to move through the rows.",
    hintDays: "Use the arrow keys to move through the days.",
    total: "Total",
    running: "Running total",
    time: "Time",
    category: "Category",
    step: "Step",
    row: "Row",
    ratePrevious: "of the previous step",
    rateFirst: "of the first step",
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
    invalid: (example) => `Enter a date range, for example ${example}.`,
    invalidWithTime: (example) => `Enter a start and an end, for example ${example}.`,
    sheet: "Choose a date range",
    from: "From",
    to: "to",
    lastDays: (count) => `Last ${count} days`,
  },
  fileGrid: {
    loading: "The files are loading.",
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
    of: "of",
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
    label: "Code",
    fold: (hidden) => (hidden === 1 ? "1 more line" : `${hidden} more lines`),
    added: "added",
    removed: "removed",
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
    label: "Breadcrumb",
  },
  conversation: {
    label: "Conversation",
    latest: "Latest",
  },
  attachment: {
    remove: (name) => `Remove ${name}`,
    status: {
      uploading: "Uploading",
      done: "Uploaded",
      error: "Failed",
    },
    kinds: {
      pdf: "PDF",
      image: "Image",
      sheet: "Spreadsheet",
      csv: "CSV",
      document: "Document",
      archive: "Archive",
      audio: "Audio",
      video: "Video",
      file: "File",
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
  callout: {
    note: "Note",
    tip: "Tip",
    important: "Important",
    warning: "Warning",
    caution: "Caution",
  },
  link: {
    external: "opens in a new tab",
  },
  pager: {
    label: "More pages",
    next: "Next page",
    previous: "Previous page",
  },
  parameterList: {
    required: "required",
    optional: "optional",
    default: "Default:",
  },
  stat: {
    up: "Up",
    down: "Down",
    flat: "Unchanged",
  },
  steps: {
    done: "Done",
    current: "Current step",
    upcoming: "Upcoming",
  },
  anchorHeading: {
    label: "Link to this section",
  },
  chip: {
    remove: "Remove",
  },
  fileThumbStack: {
    count: (count) => (count === 1 ? "1 file" : `${count} files`),
  },
  picker: {
    open: "Open calendar",
    done: "Done",
  },
  calendar: {
    today: "Today",
    selected: "selected",
  },
  dateField: {
    invalid: (example) => `Enter a date, for example ${example}.`,
    invalidWithTime: (example) => `Enter a date and a time, for example ${example}.`,
    limits: {
      between: (min, max) => `Choose a date between ${min} and ${max}.`,
      from: (min) => `Choose a date from ${min} on.`,
      until: (max) => `Choose a date up to ${max}.`,
    },
    example: (example) => `e.g. ${example}`,
    sheet: "Choose a date",
    sheetWithTime: "Choose a date and a time",
    time: "Time",
  },
  timeField: {
    invalid: (example) => `Enter a time, for example ${example}.`,
    between: (min, max) => `Choose a time between ${min} and ${max}.`,
    from: (min) => `Choose a time from ${min} on.`,
    until: (max) => `Choose a time up to ${max}.`,
    example: (example) => `e.g. ${example}`,
    list: "Times",
  },
  fileDropArea: {
    items: (count) => (count === 1 ? "1 file" : `${count} files`),
  },
  tracker: {
    role: "History",
    hint: "Use the arrow keys to move through the entries.",
    status: {
      success: "Operational",
      warning: "Degraded",
      danger: "Down",
      none: "No data",
    },
  },
};

const tables: Record<Locale, Messages> = { de, en };

/** The table of a language, for a Server Component that passes words down as props. */
export function getMessages(locale: Locale): Messages {
  return tables[locale];
}
