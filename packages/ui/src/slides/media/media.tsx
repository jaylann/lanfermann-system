import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";

export type MediaProps = {
  /** The image file. Without it the frame shows `children` as a placeholder note. */
  src?: string;
  /** What the image shows. */
  alt?: string;
  /** Frame width in px, six columns (800) by default. */
  width?: number;
  /** Frame height in px, 450 by default (16:9 at the default width). */
  height?: number;
  /** One line under the frame: what, where, when. */
  caption?: ReactNode;
  /** Placeholder note while the image is missing, e.g. what to photograph. */
  children?: ReactNode;
};

/**
 * A photo or image in a hairline frame, with a caption under it.
 *
 * Photos show real work, real places and real people: the client's workshop, a finished piece,
 * Justin on site. No stock photos, no generated images, no illustrations of abstract ideas.
 * Photos are used in full colour and uncropped to their subject; no duotone, no indigo overlay,
 * no rounded avatar circles. Every photo has a caption that says what it shows.
 */
export function Media({
  src,
  alt = "",
  width = span(6),
  height = 450,
  caption,
  children,
}: MediaProps) {
  return (
    <div data-slot="slide-media" className="flex flex-col gap-4" style={{ width }}>
      <div
        // The frame is always light, so its note is Paper's muted text; the caption under it
        // stands on the slide and follows the slide's ground.
        data-slide-ground="paper"
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-[4px] border border-line",
          src ? "bg-surface" : "bg-slide-placeholder",
        )}
        style={{ width, height }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="object-cover"
            style={{ width: width - 2, height: height - 2 }}
          />
        ) : (
          <p className="text-slide-meta text-fg-muted">{children}</p>
        )}
      </div>
      {caption != null ? <p className="text-slide-meta text-fg-muted">{caption}</p> : null}
    </div>
  );
}
