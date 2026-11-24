import type { ReactNode } from "react";

import { Wireframe } from "@/slides/browser-frame/wireframe";
import { span } from "@/slides/lib/grid";
import { Marker } from "@/slides/marker/marker";

/** The address bar in px: 12px above and below one line of code type, and its 1px line. */
const BAR = 60;

export type BrowserFrameProps = {
  /** The address shown in the bar, without protocol: `ihr-betrieb.de`. */
  url: ReactNode;
  /** The screenshot file. Without it a wireframe stands in. */
  src?: string;
  /** What the screenshot shows. */
  alt?: string;
  /** Frame width in px, seven columns (944) by default. */
  width?: number;
  /** Frame height in px, 520 by default. */
  height?: number;
  /** Marker number and its position in px from the frame's top left corner. */
  markers?: Array<{ n: number; x: number; y: number }>;
  /** Your own content in place of the screenshot. */
  children?: ReactNode;
};

/**
 * A desktop screenshot in a browser frame with numbered markers.
 *
 * Screenshots are evidence, so they are shown whole and unstyled: no tilt, no shadow, no device
 * glow, no crop that hides the address. Take them at 1440px wide for desktop and 390px for phone,
 * at the top of the page unless a finding is further down. Blur personal data before it goes on a
 * slide. The frame is always a light page with a 1px `line` edge and `radius-4`. Markers sit on
 * the spot itself, never beside it with an arrow. If the page under a marker is busy, move the
 * marker a few px, not the finding.
 */
export function BrowserFrame({
  url,
  src,
  alt = "",
  width = span(7),
  height = 520,
  markers = [],
  children,
}: BrowserFrameProps) {
  // The page under the bar, inside the 1px edge.
  const pageWidth = width - 2;
  const pageHeight = height - BAR - 2;
  return (
    <div
      data-slot="slide-browser-frame"
      // Always a light page: the tokens inside, the markers' too, are Paper's on every ground.
      data-slide-ground="paper"
      className="relative flex flex-col overflow-hidden rounded-[4px] border border-line bg-surface"
      style={{ width, height }}
    >
      <div className="flex border-b border-line px-6 py-3">
        <p className="font-mono text-slide-code text-fg-muted">{url}</p>
      </div>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="object-cover"
          style={{ width: pageWidth, height: pageHeight }}
        />
      ) : (
        (children ?? <Wireframe width={pageWidth} height={pageHeight} />)
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.n}
          n={marker.n}
          style={{ position: "absolute", left: marker.x, top: marker.y }}
        />
      ))}
    </div>
  );
}
