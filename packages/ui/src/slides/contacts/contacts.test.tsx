import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ICONS } from "@/slides/icon/icons";
import { countSteps } from "@/slides/step/steps";

import { Contacts } from "./contacts";

describe("Contacts by step", () => {
  it("reads the step from the fourth entry, with or without an icon", () => {
    const html = renderToStaticMarkup(
      <Contacts
        items={[
          ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
          ["Web", "lanfermann.dev", undefined, 1],
          ["Vor Ort", "München", ICONS.pin, 2],
        ]}
      />,
    );
    expect(html).toContain('data-step="1" style="--step-at:1"');
    expect(html).toContain('data-step="2" style="--step-at:2"');
    expect(html.match(/data-step=/g)).toHaveLength(2);
  });

  it("counts the highest fourth entry", () => {
    expect(countSteps(<Contacts items={[["Web", "lanfermann.dev"]]} />)).toBe(0);
    expect(
      countSteps(
        <Contacts
          items={[
            ["Web", "lanfermann.dev", undefined, 2],
            ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
          ]}
        />,
      ),
    ).toBe(2);
  });
});
