"use client";

import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from "react";

import { kindOf, mayBeTransparent, typeWord } from "@/components/attachment/kinds";
import {
  FileKindSymbol,
  type FileSymbolKind,
} from "@/components/file-kind-symbol/file-kind-symbol";
import { cn } from "@/lib/cn";

/** A picture's or a video's own size in pixels. */
export type NaturalSize = { width: number; height: number };

export type MediaPreviewProps = Omit<ComponentProps<"div">, "children"> & {
  /** Where the file can be loaded from. */
  src: string;
  /** Its name, which names the preview for assistive tech and, with `type`, tells its kind. */
  name: string;
  /** Its MIME type. Without it the extension says what it is. */
  type?: string;
  /** What it is, where name and type cannot tell. */
  kind?: FileSymbolKind;
  /** Called with a picture's or a video's own size once it has loaded: 1600 × 900. */
  onNaturalSize?: (size: NaturalSize) => void;
};

/**
 * A picture, which fades in on `settle` once it has loaded and then reports its own size. Its
 * box is the picture as it is drawn (contained, never larger than its own size), so one that
 * may be see-through has the `checker` as that box's background: behind the picture only,
 * fading in with it, and gone with it when the symbol takes its place.
 */
function Picture({
  src,
  name,
  seeThrough,
  onLoaded,
  onFail,
}: {
  src: string;
  name: string;
  seeThrough: boolean;
  onLoaded: (size: NaturalSize) => void;
  onFail: () => void;
}) {
  const picture = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const report = useRef(onLoaded);
  useEffect(() => {
    report.current = onLoaded;
  });
  // A picture from the cache may have loaded before React was listening.
  useLayoutEffect(() => {
    const element = picture.current;
    if (!element?.complete || element.naturalWidth === 0) return;
    setLoaded(true);
    report.current({ width: element.naturalWidth, height: element.naturalHeight });
  }, []);
  return (
    <img
      ref={picture}
      src={src}
      alt={name}
      decoding="async"
      draggable={false}
      data-slot="media-preview-picture"
      data-loaded={loaded ? "" : undefined}
      onLoad={(event) => {
        // A picture the page already holds is complete at once (reported above) and fires
        // its load after that: its size is said once.
        if (loaded) return;
        setLoaded(true);
        onLoaded({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        });
      }}
      onError={onFail}
      className={cn(
        "h-auto max-h-full w-auto max-w-full opacity-0 transition-opacity spring-settle data-loaded:opacity-100",
        seeThrough && "checker",
      )}
    />
  );
}

/**
 * What a file holds, shown in an inspector or a dialog: a picture contained on the well (its own
 * size reported once it has loaded, `onNaturalSize`, for a fact line like „1600 × 900 px“), a
 * video or a piece of audio with the browser's own controls (only its length is loaded until it
 * is played), a PDF in the browser's own viewer, and for anything else the symbol of its kind,
 * large, with its type. A picture that cannot be loaded gives its place to the symbol. Nothing
 * travels: the picture fades in on `settle`. A picture that may be see-through (a PNG, WebP,
 * SVG, GIF, AVIF or icon, by `type` or else by the name's extension) lies on the quiet
 * `checker`, behind the picture only, so a black logo shows in the dark and a white one in the
 * light; a JPEG keeps the plain well.
 *
 * Give it its height (a class, or the room of the inspector); it fills it.
 */
export function MediaPreview({
  src,
  name,
  type,
  kind: kindProp,
  onNaturalSize,
  className,
  ...props
}: MediaPreviewProps) {
  const kind = kindProp ?? kindOf({ name, type });
  // The address whose picture failed: a new address is tried again.
  const [failed, setFailed] = useState<string | null>(null);
  const shown = failed === src ? "symbol" : kind;
  return (
    <div
      data-slot="media-preview"
      data-kind={kind}
      className={cn(
        "relative flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-well",
        // Its edge: a hairline drawn inside it, over what it shows.
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-hairline",
        className,
      )}
      {...props}
    >
      {shown === "image" ? (
        <Picture
          key={src}
          src={src}
          name={name}
          seeThrough={mayBeTransparent({ name, type })}
          onLoaded={(size) => onNaturalSize?.(size)}
          onFail={() => setFailed(src)}
        />
      ) : shown === "video" ? (
        <video
          src={src}
          controls
          preload="metadata"
          aria-label={name}
          data-slot="media-preview-video"
          onLoadedMetadata={(event) =>
            onNaturalSize?.({
              width: event.currentTarget.videoWidth,
              height: event.currentTarget.videoHeight,
            })
          }
          className="max-h-full max-w-full"
        />
      ) : shown === "audio" ? (
        <div className="flex w-full flex-col items-center gap-4 p-6">
          <FileKindSymbol kind="audio" size={48} className="text-fg-muted" />
          <audio
            src={src}
            controls
            preload="metadata"
            aria-label={name}
            data-slot="media-preview-audio"
            className="w-full max-w-sm"
          />
        </div>
      ) : shown === "pdf" ? (
        <iframe
          src={src}
          title={name}
          loading="lazy"
          data-slot="media-preview-document"
          className="size-full min-h-80 border-0 bg-surface"
        />
      ) : (
        <div data-slot="media-preview-symbol" className="flex flex-col items-center gap-2 p-6">
          <FileKindSymbol kind={kind} size={48} className="text-fg-muted" />
          {kind !== "folder" && (
            <span className="text-sm text-fg-muted">{typeWord({ name, type })}</span>
          )}
        </div>
      )}
    </div>
  );
}
