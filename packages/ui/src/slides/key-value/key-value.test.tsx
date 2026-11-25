import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { KeyValue } from "./key-value";

describe("KeyValue by step", () => {
  it("keeps the row's grid beside its step", () => {
    const html = renderToStaticMarkup(
      <KeyValue
        items={[
          ["Bestandsaufnahme", "Ihre Seite, wie ein Kunde sie sieht."],
          ["Vergleich", "Drei Betriebe aus Ihrer Nähe.", 2],
        ]}
      />,
    );
    const rows = html.match(/<div [^>]*>/g) ?? [];
    expect(rows).toHaveLength(2);
    expect(rows[0]).not.toContain("data-step");
    expect(rows[0]).toContain("grid-template-columns:");
    expect(rows[1]).toContain('data-step="2"');
    expect(rows[1]).toMatch(/style="--step-at:2;grid-template-columns:[^"]+"/);
  });

  it("counts the highest third entry", () => {
    expect(countSteps(<KeyValue items={[["Befund", "Die Stellen."]]} />)).toBe(0);
    expect(
      countSteps(
        <KeyValue
          items={[
            ["Befund", "Die Stellen.", 3],
            ["Gespräch", "20 Minuten.", 1],
          ]}
        />,
      ),
    ).toBe(3);
  });
});
