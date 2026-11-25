import type { ReactNode } from "react";

import { PinnedMarker } from "@/slides/browser-frame/pinned-marker";
import { Wireframe } from "@/slides/browser-frame/wireframe";
import { maxStep, type StepCounter } from "@/slides/step/steps";

/** The bezel's weight in px, the same on all four sides. */
const BEZEL = 12;

export type PhoneFrameProps = {
  /** The screenshot file (390px wide capture). Without it a wireframe stands in. */
  src?: string;
  /** What the screenshot shows. */
  alt?: string;
  /** Outer width in px, 248 by default. */
  width?: number;
  /** Outer height in px, 496 by default: the tallest a phone can be under a two-line title with a source line. */
  height?: number;
  /** Marker number and its position in px from the frame's top left corner. `step` lets a marker appear at that step of the slide, so the findings can be pointed out one after the other. */
  markers?: Array<{ n: number; x: number; y: number; step?: number }>;
  /** Your own content in place of the screenshot. */
  children?: ReactNode;
};

/**
 * A phone screenshot in a plain bezel with numbered markers.
 *
 * A plain dark bezel with `radius-device`: no notch, no status bar, no brand of phone. Most local
 * searches happen on a phone, so when a finding is about the mobile page, show the phone, not the
 * desktop. When the talk goes through the findings one at a time, let each marker appear at the
 * step its finding does; the screenshot itself stands from the start.
 */
export function PhoneFrame({
  src,
  alt = "",
  width = 248,
  height = 496,
  markers = [],
  children,
}: PhoneFrameProps) {
  // The screen inside the bezel.
  const screenWidth = width - 2 * BEZEL;
  const screenHeight = height - 2 * BEZEL;
  return (
    <div
      data-slot="slide-phone-frame"
      // Always a light page in a dark bezel: the tokens inside are Paper's on every ground.
      data-slide-ground="paper"
      className="relative flex flex-col overflow-hidden rounded-[36px] border-[12px] border-fg bg-surface"
      style={{ width, height }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="object-cover"
          style={{ width: screenWidth, height: screenHeight }}
        />
      ) : (
        (children ?? <Wireframe width={screenWidth} height={screenHeight} compact />)
      )}
      {markers.map((marker) => (
        <PinnedMarker key={marker.n} {...marker} />
      ))}
    </div>
  );
}

/** The highest `step` among the markers. */
PhoneFrame.slideSteps = ((props) => maxStep(props.markers)) satisfies StepCounter<PhoneFrameProps>;
