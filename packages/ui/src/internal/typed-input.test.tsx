import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TypedInput } from "./typed-input";

/** The markup of a field that shows "14.11.2026" and holds "2026-11-14". */
function markup(props: { name?: string; form?: string; disabled?: boolean }) {
  return renderToString(
    <TypedInput
      text="14.11.2026"
      onTextChange={() => {}}
      onCommit={() => undefined}
      formValue="2026-11-14"
      problem=""
      {...props}
    />,
  );
}

/** The two inputs of the markup, as their tags. */
function inputs(html: string) {
  const [shown = "", carried = ""] = html.match(/<input[^>]*>/g) ?? [];
  return { shown, carried };
}

describe("what a typed field hands to a form", () => {
  it("names the hidden input that carries the value, not the one that shows the text", () => {
    const { shown, carried } = inputs(markup({ name: "gueltig" }));
    expect(shown).toContain('value="14.11.2026"');
    expect(shown).not.toContain("name=");
    expect(carried).toContain('type="hidden"');
    expect(carried).toContain('name="gueltig"');
    expect(carried).toContain('value="2026-11-14"');
  });

  it("sends the value to the form the field names, when it stands outside of it", () => {
    const { shown, carried } = inputs(markup({ name: "gueltig", form: "angebot" }));
    expect(shown).toContain('form="angebot"');
    expect(carried).toContain('form="angebot"');
  });

  it("sends nothing while the field is disabled", () => {
    const { carried } = inputs(markup({ name: "gueltig", disabled: true }));
    expect(carried).toContain("disabled");
  });
});
