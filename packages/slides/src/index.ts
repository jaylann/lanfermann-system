// Public API of @lanfermann/slides.
//
// Three functions are the contract the hub builds on (issue #90): `bundleDeck`, `typecheckDeck`
// and `deckHtml`. A deck's code goes in as text, a script and one HTML file come out, and what
// is wrong with a deck comes back as data (`DeckError`), never as a throw. Their names and
// shapes do not change without the hub.
//
// The rest is what the command line is made of, on top of those three: the static reading of a
// deck, the layout check through a browser, the PDF, the package, the preview server, and the
// template a new deck starts from (`deckTemplate`, which the hub seeds a deck with as well).
export {
  analyzeDeck,
  type AnalyzeInput,
  type AnalyzeOptions,
  type DeckAnalysis,
  type SlideInfo,
} from "./analyze";
export {
  type BrowserChoice,
  browserFromEnv,
  BrowserUnavailableError,
  DeckNotReadyError,
  measureDeck,
  renderPdf,
} from "./browser";
export { assetsFor, buildDeck, type BuildOptions, type BuildResult } from "./build";
export { bundleDeck, type BundleInput } from "./bundle";
export { checkDeck, type CheckOptions, type CheckResult } from "./check";
export { type DevOptions, type DevServer, startDevServer } from "./dev";
export { type CspExtras, deckCsp, deckHtml, type DeckHtmlOptions, type DeckMode } from "./html";
export { type Kit, KitError, kitVersion, loadKit } from "./kit";
export { layoutDiagnostics } from "./layout";
export {
  type DeckManifest,
  type DeckPackage,
  PackageError,
  packDeck,
  type PackedFile,
  parsePackage,
  serializePackage,
  slugOf,
} from "./pack";
export {
  assetKey,
  dataUrl,
  DECK_ENTRY,
  DeckReadError,
  DeckWriteError,
  MAX_DECK_IMAGE_BYTES,
  MAX_IMAGE_BYTES,
  readDeckDir,
  writeDeckDir,
  type WriteDeckOptions,
} from "./source";
export {
  deckTemplate,
  TEMPLATE_NAMES,
  TemplateError,
  type TemplateName,
  type TemplateOptions,
} from "./template";
export { typecheckDeck } from "./typecheck";
export type { BundleResult, DeckError, DeckInput, DeckSource, Diagnostic, Severity } from "./types";
export { diagnosticOf, formatDiagnostic } from "./types";
export { version } from "./version";
