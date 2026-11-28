"use client";

import { type DragEvent, useRef, useState } from "react";

/** Whether what is being dragged is files from the system, and not a piece of text or a link. */
export const carriesFiles = (event: DragEvent): boolean =>
  event.dataTransfer.types.includes("Files");

/**
 * What a drop carried, the folders apart from the files. A folder comes as a `File` of its name
 * that cannot be read, so nothing in the file itself tells it from one without an extension:
 * its entry does, and only while the drop is being handled.
 */
export function droppedFiles(data: DataTransfer): { files: File[]; folders: File[] } {
  const files: File[] = [];
  const folders: File[] = [];
  for (const item of data.items) {
    if (item.kind !== "file") continue;
    const folder = item.webkitGetAsEntry()?.isDirectory ?? false;
    const file = item.getAsFile();
    if (file) (folder ? folders : files).push(file);
  }
  return { files, folders };
}

/**
 * Whether something that is dragged hangs over a box. Entering a child fires a leave on the box
 * and an enter on the child, so the enters and leaves are counted, and the box knows when the
 * drag has really left it. `accepts` says which drags count; for the others the box does
 * nothing, and the browser does not let them be dropped there.
 *
 * Spread `handlers` on the box and call `reset` when the drag ends on it (a drop), which fires
 * no leave.
 */
export function useDragDepth(accepts: (event: DragEvent) => boolean, disabled = false) {
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const reset = () => {
    depth.current = 0;
    setOver(false);
  };
  const handlers = {
    onDragEnter: (event: DragEvent) => {
      if (disabled || !accepts(event)) return;
      event.preventDefault();
      depth.current += 1;
      setOver(true);
    },
    onDragOver: (event: DragEvent) => {
      // Without this the browser does not let it be dropped here.
      if (!disabled && accepts(event)) event.preventDefault();
    },
    onDragLeave: (event: DragEvent) => {
      // Counted also while disabled: a box that is switched off under a drag still has to hear
      // it leave, or it would stay "over" and count one too many from then on.
      if (!accepts(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    },
  };
  return { over: over && !disabled, reset, handlers };
}
