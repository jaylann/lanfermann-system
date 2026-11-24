// Public API of @lanfermann/ui/slides/player: what presents a deck. A third entry beside the
// slide parts, so an app that only draws slides does not load the console, and one that shows no
// deck loads neither. The same player ships prebuilt for a deck that is one HTML file
// (@lanfermann/ui/slides/player/player.global.js and its stylesheets, see ./global.ts).
export type { SlideIssue, SlidesReport } from "./check/report";
export type { PlayerStart } from "./hooks";
export { defaultLabels, type PlayerLabels } from "./labels";
export type { PlayerMode } from "./mode";
export { mount, type MountOptions } from "./mount";
export { Player, type PlayerProps } from "./player";
