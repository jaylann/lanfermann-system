import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";
import { Steps } from "@/slides/steps/steps";

import { Columns } from "./columns";

describe("Columns and Steps by step", () => {
  it("marks a column and its block under the text with the column's step", () => {
    const html = renderToStaticMarkup(
      <Columns
        items={[
          { title: "Website", more: <p>Startseite</p> },
          { title: "Sichtbarkeit", more: <p>Google-Profil</p>, step: 2 },
        ]}
      />,
    );
    expect(html.match(/data-step="2" style="--step-at:2"/g)).toHaveLength(2);
    expect(html.match(/data-step=/g)).toHaveLength(2);
  });

  it("marks nothing when no item has a step", () => {
    const html = renderToStaticMarkup(
      <Columns items={[{ title: "Website" }, { title: "Profil" }]} />,
    );
    expect(html).not.toContain("data-step");
    expect(html).not.toContain("--step-at");
  });

  it("counts the highest step of the items", () => {
    expect(countSteps(<Columns items={[{ title: "Website" }]} />)).toBe(0);
    expect(
      countSteps(
        <Steps
          items={[{ title: "Analyse" }, { title: "Entwurf", step: 3 }, { title: "Start", step: 1 }]}
        />,
      ),
    ).toBe(3);
  });
});
