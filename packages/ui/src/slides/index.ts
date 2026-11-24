// Public API of @lanfermann/ui/slides: the parts of a deck on the 1920 by 1080 canvas. A second
// entry, so an app that shows no deck does not load it. Styles: @lanfermann/ui/slides.css.
export { Deck, type DeckProps } from "./deck/deck";
export { flattenSlides, type SlideEntry } from "./deck/flatten-slides";
export { Footer, type FooterProps } from "./footer/footer";
export { Slide, type SlideGround, type SlideProps } from "./slide/slide";
export { Spacer } from "./spacer/spacer";
export { SLIDE_HEIGHT, SLIDE_WIDTH, Stage, type StageProps } from "./stage/stage";
