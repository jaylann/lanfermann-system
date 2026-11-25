/**
 * Every word the player itself shows or says: the audience's controls and the presenter's
 * console. German by default; a deck in another language hands `labels` to `mount` or `Player`.
 * `{page}` and `{count}` (and `{step}` and `{steps}`) are filled in where a label counts.
 */
export const defaultLabels = {
  /** Names the audience's bar of controls to assistive tech. */
  controls: "Steuerung",
  /** The button that steps back. */
  previous: "Vorherige Folie",
  /** The button that steps forward. */
  next: "Nächste Folie",
  /** The counter between the two, as short as it gets. */
  position: "{page} / {count}",
  /** What the counter says to assistive tech, and the head of the console's current slide. */
  slide: "Folie {page} von {count}",
  /**
   * Where a slide with steps stands among them, after its position: muted in the console's head,
   * spoken after the counter in the audience's bar. `{step}` counts from 0, as the address does.
   */
  step: "Schritt {step} von {steps}",
  /** The button that fills the screen (F). */
  fullscreen: "Vollbild",
  /** The same button while the screen is filled. */
  exitFullscreen: "Vollbild beenden",
  /** The link to the PDF beside the page. */
  pdf: "PDF laden",
  /** What the audience's window says to assistive tech while the screen is black. */
  blackScreen: "Schwarzer Bildschirm",
  /** Names the presenter's console to assistive tech. */
  console: "Vortrag steuern",
  /** The head of the slide that comes next. */
  nextSlide: "Nächste Folie",
  /** The same head while the next press brings a further step of the current slide. */
  nextStep: "Nächster Schritt",
  /** Stands in its place after the last slide. */
  end: "Ende",
  /** The head of the notes. */
  notes: "Notizen",
  /** Stands in their place on a slide without notes. */
  noNotes: "Keine Notizen",
  /** The head of the time since the talk began. */
  timer: "Zeit",
  /** The button that sets it back to 0:00. */
  resetTimer: "Zurücksetzen",
  /** The head of the time of day. */
  clock: "Uhrzeit",
  /** The button that opens the grid of all slides (G), and the grid's name. */
  grid: "Übersicht",
  /** The button that closes the grid again. */
  closeGrid: "Schließen",
  /** One slide in the grid. */
  gridSlide: "Folie {page}",
  /** The button that turns the audience's screen black (B). */
  blackout: "Schwarz",
  /** The line beside the current slide's head while it is black. */
  blackoutOn: "Das Publikum sieht Schwarz",
  /** The button that opens the second window. */
  openAudience: "Publikumsfenster öffnen",
  /** Said once the window is open and could not be placed on the projector. */
  dragHint: "Fenster auf den Beamer ziehen, dann F für Vollbild.",
  /** Said when the browser did not open the window. */
  popupBlocked: "Der Browser hat das Fenster blockiert. Pop-ups für diese Seite erlauben.",
  /** Stands in place of a slide that threw while it was drawn, above the error's message. */
  slideError: "Diese Folie konnte nicht gezeichnet werden.",
};

export type PlayerLabels = typeof defaultLabels;

/** A label with its `{name}` places filled in. A place without a value stays as it is. */
export function fill(label: string, values: Record<string, string | number>): string {
  return label.replace(/\{(\w+)\}/g, (place, name: string) =>
    name in values ? String(values[name]) : place,
  );
}
