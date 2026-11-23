/**
 * The container the committed baselines are drawn in, locally and in CI.
 *
 * Its tag is the Playwright version, because the image carries exactly that version's browser
 * builds: a test asserts that tag and installed package agree, so a Playwright bump cannot leave
 * the image behind. The digest pins the image itself; update both together, and then the
 * baselines (`bun run visual:baseline`), since a new browser build moves pixels.
 */
export const PLAYWRIGHT_IMAGE_TAG = "v1.65.1-noble";
export const PLAYWRIGHT_IMAGE_DIGEST =
  "sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579";
export const PLAYWRIGHT_IMAGE = `mcr.microsoft.com/playwright:${PLAYWRIGHT_IMAGE_TAG}@${PLAYWRIGHT_IMAGE_DIGEST}`;

/**
 * What the baseline covers: the page light and dark, and Indigo, the one ground with a recipe of
 * its own in both modes. Tint shares Paper's recipe in light mode; Ink's recipe is dark mode's, and
 * Ink itself is drawn wherever a component speaks on it (tooltips, toasts, readouts).
 */
export const BASELINE_GROUNDS = "paper,dark,indigo";
