import type { Ref, RefCallback } from "react";

/** One ref callback that fills both a component's own ref and the one its caller passed. */
export function mergeRefs<T>(own: Ref<T>, theirs: Ref<T> | undefined): RefCallback<T> {
  return (node) => {
    for (const ref of [own, theirs]) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}
