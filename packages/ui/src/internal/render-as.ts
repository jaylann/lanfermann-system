import { mergeProps } from "@base-ui/react/merge-props";
import type { useRender } from "@base-ui/react/use-render";
import {
  cloneElement,
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { mergeRefs } from "@/lib/merge-refs";

type AnyProps = Record<string, unknown> & { ref?: Ref<unknown> };

/**
 * Renders a part as its own element, or as the element its caller hands in as `render`: a
 * router's link in place of an `<a>`. The part's props and the element's own are merged the way
 * Base UI merges them (class names joined, styles and handlers merged, the element's own props
 * winning otherwise).
 *
 * It is what Base UI's `useRender` does, as a plain function. `useRender` is a hook, which makes
 * every part that calls it a client component; a part of plain markup (a link of the `SideNav`,
 * of the `Breadcrumbs`, of the `Pager`) would then travel to the browser for nothing. With this
 * it stays server-safe: no `"use client"`, and no script for a page of documentation.
 */
export function renderAs(
  tag: ElementType,
  render: useRender.RenderProp | undefined,
  props: AnyProps,
): ReactElement {
  if (render === undefined) return createElement(tag, props);
  if (typeof render === "function") return render(props as HTMLAttributes<unknown>, {});
  const own = render.props as AnyProps;
  const merged = mergeProps<ElementType>(props, own) as AnyProps;
  // Both ask for the element: a case only a client component can make, and there both get it.
  if (props.ref && own.ref) merged.ref = mergeRefs(props.ref, own.ref);
  return cloneElement(render, merged);
}
