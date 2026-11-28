"use client";

import { useState } from "react";

import {
  FileKindSymbol,
  type FileSymbolKind,
} from "@/components/file-kind-symbol/file-kind-symbol";
import { cn } from "@/lib/cn";

/**
 * The picture of a `FileThumb`. It is a part of its own because it keeps one thing in mind: an
 * address whose picture did not load shows the kind's symbol instead of the browser's broken
 * image, until another address is given.
 */
export function FileThumbPicture({
  src,
  kind,
  seeThrough,
  symbolSize = 16,
  fit = "cover",
}: {
  src: string;
  kind: FileSymbolKind;
  seeThrough: boolean;
  /** `cover` fills the square and may crop; `contain` shows the whole picture inside it. */
  fit?: "cover" | "contain";
  /** The size of the symbol that stands in for a picture that did not load. */
  symbolSize?: number;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src)
    return <FileKindSymbol kind={kind} size={symbolSize} className="text-fg-muted" />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(src)}
      // The picture fills its square, so the checker (finer here, for a square of 32px) lies
      // behind the picture only, as everywhere.
      className={cn(
        // Contained, the box is the picture as drawn, so the checker never shows in the bands
        // beside it.
        fit === "cover" ? "size-full object-cover" : "h-auto max-h-full w-auto max-w-full",
        seeThrough && "checker [--checker-cell:0.25rem]",
      )}
    />
  );
}
