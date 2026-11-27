import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { List } from "./list";

describe("List by step", () => {
  it("draws plain rows and rows written as { text, step } alike, marking only the latter", () => {
    const html = renderToStaticMarkup(
      <List
        items={[
          "Sie sagt sofort, was Sie tun.",
          <b key="b">Sie macht den Anruf leicht.</b>,
          { text: "Sie zeigt Ihre Arbeit.", step: 1 },
          { text: <b>Sie lädt schnell.</b>, step: 2 },
          { text: "Sie nennt Ihre Zeiten." },
        ]}
      />,
    );
    expect(html).toContain(">Sie sagt sofort, was Sie tun.</li>");
    expect(html).toContain("<b>Sie macht den Anruf leicht.</b></li>");
    expect(html).toContain('data-slides-at="1" style="--step-at:1">Sie zeigt Ihre Arbeit.</li>');
    expect(html).toContain('data-slides-at="2" style="--step-at:2"><b>Sie lädt schnell.</b></li>');
    expect(html).toContain(">Sie nennt Ihre Zeiten.</li>");
    expect(html.match(/data-slides-at=/g)).toHaveLength(2);
  });

  it("counts the highest step among the rows", () => {
    expect(countSteps(<List items={["Eins", "Zwei"]} />)).toBe(0);
    expect(countSteps(<List items={["Eins", { text: "Zwei", step: 4 }, null]} />)).toBe(4);
  });
});
