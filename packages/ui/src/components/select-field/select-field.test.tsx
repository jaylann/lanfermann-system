import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SelectField } from "./select-field";

const STATES = { building: "In Arbeit", live: "Live", paused: "Pausiert" };

/** The hidden input a native form reads the choice from. */
const input = (html: string) => /<input[^>]*name="status"[^>]*>/.exec(html)?.[0] ?? "";

describe("a select field rendered on a server", () => {
  it("is a file a server page may import: no client directive, no hook", () => {
    const source = readFileSync(new URL("./select-field.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/^\s*["']use client["']/m);
    expect(source).not.toMatch(/\buse[A-Z]\w*\(/);
  });

  it("submits the chosen value under its name", () => {
    const html = renderToStaticMarkup(
      <SelectField name="status" label="Status" items={STATES} defaultValue="live" />,
    );
    expect(input(html)).toContain('value="live"');
    expect(input(html)).not.toContain("required");
    // The trigger shows the label of the value, not the value.
    expect(html).toContain("Live");
    expect(html).toContain("Status");
  });

  it("is empty and required until something is chosen", () => {
    const html = renderToStaticMarkup(
      <SelectField name="status" label="Status" items={STATES} required />,
    );
    expect(input(html)).toContain('value=""');
    expect(input(html)).toContain("required");
    expect(html).toContain("Bitte wählen");
  });

  it("hands `disabled` to the label, the trigger and the input", () => {
    const html = renderToStaticMarkup(
      <SelectField name="status" label="Status" items={STATES} defaultValue="live" disabled />,
    );
    expect(input(html)).toContain("disabled");
    expect(html).toMatch(
      /data-slot="field-label"[^>]*data-disabled|data-disabled[^>]*data-slot="field-label"/,
    );
    expect(html).toMatch(
      /data-slot="select-trigger"[^>]*data-disabled|data-disabled[^>]*data-slot="select-trigger"/,
    );
  });

  it("shows the label of an option given as an object, and of one in a group", () => {
    const options = [
      { value: "building", label: "In Arbeit" },
      { value: "live", label: "Live" },
    ];
    expect(
      renderToStaticMarkup(
        <SelectField name="status" label="Status" items={options} defaultValue="building" />,
      ),
    ).toContain("In Arbeit");
    const groups = [
      { value: "Sichtbar", items: options },
      { value: "Verborgen", items: [{ value: "paused", label: "Pausiert" }] },
    ];
    const html = renderToStaticMarkup(
      <SelectField name="status" label="Status" items={groups} defaultValue="paused" />,
    );
    expect(input(html)).toContain('value="paused"');
    expect(html).toContain("Pausiert");
  });

  it("puts the help under the field and leaves it out when there is none", () => {
    const withHelp = renderToStaticMarkup(
      <SelectField name="status" label="Status" items={STATES} description="Für die Übersicht." />,
    );
    expect(withHelp).toContain('data-slot="field-description"');
    expect(withHelp).toContain("Für die Übersicht.");
    expect(
      renderToStaticMarkup(<SelectField name="status" label="Status" items={STATES} />),
    ).not.toContain('data-slot="field-description"');
  });
});
