import { Marker } from "@/slides/marker/marker";
import { stepAttributes } from "@/slides/step/steps";

type PinnedMarkerProps = {
  /** The number on the disc. */
  n: number;
  /** Position in px from the frame's top left corner. */
  x: number;
  y: number;
  /** The step the marker appears at; without one it is there from the start. */
  step?: number;
};

/**
 * A marker pinned in a frame at `x`, `y`, appearing at its `step`. The box around the disc holds
 * the position and the step, because a `Marker` takes no attribute but its style; it is as large
 * as the disc, so a marker without a step looks as it did when the disc was pinned itself. Shared
 * by `BrowserFrame` and `PhoneFrame` and not exported from the entry.
 */
export function PinnedMarker({ n, x, y, step }: PinnedMarkerProps) {
  const at = stepAttributes(step);
  return (
    <div {...at} style={{ ...at.style, position: "absolute", left: x, top: y }}>
      <Marker n={n} />
    </div>
  );
}
