"use client";

import { type DragEvent, useRef, useState } from "react";

/** Whether what is being dragged is files from the system, and not a piece of text or a link. */
export const carriesFiles = (event: DragEvent): boolean =>
  event.dataTransfer.types.includes("Files");

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
      if (disabled || !accepts(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    },
  };
  return { over, reset, handlers };
}
