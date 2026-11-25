import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { Table, type TableProps } from "./table";

const columns: TableProps["columns"] = [
  { key: "name", label: "Betrieb", span: 6 },
  { key: "load", label: "Ladezeit", span: 6, numeric: true },
];
const rows: TableProps["rows"] = [
  { name: "Schreinerei am Markt", load: "1,8 s" },
  { name: "Tischlerei Nord", load: "2,4 s" },
  { name: "Ihr Betrieb", load: "7,1 s" },
];

describe("Table by step", () => {
  it("marks the body rows by index and leaves the head alone", () => {
    const html = renderToStaticMarkup(<Table columns={columns} rows={rows} rowSteps={[0, 1, 2]} />);
    const tr = html.match(/<tr[^>]*>/g) ?? [];
    expect(tr).toEqual([
      "<tr>",
      "<tr>",
      '<tr data-step="1" style="--step-at:1">',
      '<tr data-step="2" style="--step-at:2">',
    ]);
  });

  it("marks nothing without row steps, and a row past the list is there from the start", () => {
    expect(renderToStaticMarkup(<Table columns={columns} rows={rows} />)).not.toContain(
      "data-step",
    );
    const html = renderToStaticMarkup(<Table columns={columns} rows={rows} rowSteps={[1]} />);
    expect(html.match(/data-step=/g)).toHaveLength(1);
  });

  it("counts the highest row step", () => {
    expect(countSteps(<Table columns={columns} rows={rows} />)).toBe(0);
    expect(countSteps(<Table columns={columns} rows={rows} rowSteps={[0, 3, 2]} />)).toBe(3);
  });
});
