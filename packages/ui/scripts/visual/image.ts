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

/** The grounds with their own depth recipe: what the baseline covers. Tint shares Paper's. */
export const BASELINE_GROUNDS = "paper,ink,indigo";
