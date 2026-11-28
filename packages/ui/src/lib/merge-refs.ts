import type { Ref, RefCallback } from "react";

/**
 * One ref callback that fills both a component's own ref and the one its caller passed.
 *
 * A callback ref may return a cleanup (React 19). React then calls that cleanup when the element
 * goes, and no longer calls the ref with `null`, so the merged ref does the same for each of its
 * two: a caller's `(node) => { observer.observe(node); return () => observer.disconnect(); }`
 * is never handed `null`, and its observer is disconnected.
 */
export function mergeRefs<T>(own: Ref<T> | undefined, theirs: Ref<T> | undefined): RefCallback<T> {
  return (node) => {
    const cleanups = [fill(own, node), fill(theirs, node)];
    // Called with `null` (by a merger that knows no cleanups): both are already emptied.
    if (node === null) return;
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}

/** Fills one ref, and says how to empty it again. */
function fill<T>(ref: Ref<T> | undefined, node: T | null): () => void {
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return typeof cleanup === "function" ? cleanup : () => void ref(null);
  }
  if (!ref) return () => {};
  ref.current = node;
  return () => {
    ref.current = null;
  };
}
