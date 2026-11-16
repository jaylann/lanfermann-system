import { createElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { renderAs } from "./render-as";

type Props = Record<string, unknown>;
const propsOf = (element: ReactElement) => element.props as Props;

describe("renderAs", () => {
  it("renders the part's own element when nothing else is asked for", () => {
    const link = renderAs("a", undefined, { href: "/doku", className: "link" });
    expect(link.type).toBe("a");
    expect(propsOf(link)).toMatchObject({ href: "/doku", className: "link" });
  });

  it("renders the caller's element with the part's props, the element's own winning", () => {
    const Router = () => null;
    const link = renderAs("a", createElement(Router, { href: "/app/doku", prefetch: true }), {
      href: "/doku",
      "data-slot": "side-nav-link",
      children: "Doku",
    });
    expect(link.type).toBe(Router);
    expect(propsOf(link)).toMatchObject({
      href: "/app/doku",
      prefetch: true,
      "data-slot": "side-nav-link",
      children: "Doku",
    });
  });

  it("joins the class names of both", () => {
    const link = renderAs("a", createElement("a", { className: "theirs" }), { className: "ours" });
    expect(String(propsOf(link).className).split(" ").sort()).toEqual(["ours", "theirs"]);
  });

  it("calls a render function with the part's props", () => {
    const link = renderAs("a", (props) => createElement("span", props), { id: "here" });
    expect(link.type).toBe("span");
    expect(propsOf(link)).toMatchObject({ id: "here" });
  });

  it("fills both refs when the part and the element each have one", () => {
    const ours = { current: null as unknown };
    const theirs = { current: null as unknown };
    const link = renderAs("a", createElement("a", { ref: theirs }), { ref: ours });
    const node = {};
    (propsOf(link).ref as (node: unknown) => void)(node);
    expect(ours.current).toBe(node);
    expect(theirs.current).toBe(node);
  });
});
