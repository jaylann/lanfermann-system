import type { Decorator } from "@storybook/react-vite";

import type { SlideGround } from "./slide/slide";
import { Stage } from "./stage/stage";
import { SlideStepProvider } from "./step/step-context";

const GROUNDS: readonly string[] = ["paper", "tint", "ink", "indigo"];

/**
 * What every story of one slide shares: the whole window, a capture of the canvas at its own
 * size, taken once. A slide brings its ground, so the page's ground and mode change nothing.
 */
export const slideParameters = {
  layout: "fullscreen",
  visual: { viewport: { width: 1920, height: 1080 }, clip: "viewport", grounds: ["paper"] },
};

/** The same for a story that stacks `count` slides (a `Deck` as it prints). */
export function deckParameters(count: number) {
  return {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1920, height: 1080 * count },
      clip: "viewport",
      grounds: ["paper"],
    },
  };
}

/** Shows the story's slide scaled to the window, at its own size in a 1920 by 1080 capture. */
export const onStage: Decorator = (Story) => (
  <Stage className="h-dvh w-dvw">
    <Story />
  </Stage>
);

/**
 * Shows the story's slide at one of its steps, standing still, as a capture needs it:
 * `decorators: [atStep(1)]` on a story (listed after the meta's `onStage`, so it runs inside the
 * stage). Without it a story shows the slide with all its steps.
 */
export function atStep(step: number, steps = step): Decorator {
  return function AtStep(Story) {
    return (
      <SlideStepProvider step={step} steps={steps}>
        <Story />
      </SlideStepProvider>
    );
  };
}

/** The ground chosen in the workshop's toolbar, for a story that leaves the slide's ground open. */
export function toolbarGround(globals: Record<string, unknown>): SlideGround {
  const ground = globals.ground;
  return typeof ground === "string" && GROUNDS.includes(ground) ? (ground as SlideGround) : "paper";
}
