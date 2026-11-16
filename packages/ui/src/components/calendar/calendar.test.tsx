import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "./calendar";

/**
 * A page that is rendered ahead of time has no "now": Next refuses to prerender a component that
 * reads the clock while rendering. So on a server the calendar must get by without it.
 */
describe("a calendar rendered on a server", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A clock that cannot be read: `new Date()` and `Date.now()` throw, a given date still works. */
  function withoutAClock() {
    const RealDate = Date;
    class NoClock extends RealDate {
      constructor(...given: unknown[]) {
        if (given.length === 0) throw new Error("the clock was read while rendering");
        super(...(given as ConstructorParameters<typeof Date>));
      }
      static override now(): number {
        throw new Error("the clock was read while rendering");
      }
    }
    vi.stubGlobal("Date", NoClock);
  }

  it("shows the month of what is chosen without asking what day it is", () => {
    withoutAClock();
    const html = renderToString(<Calendar defaultValue="2026-11-19" />);
    expect(html).toContain("November 2026");
    expect(html).not.toContain("invisible");
  });

  it("shows the month of a range's first day", () => {
    withoutAClock();
    const html = renderToString(
      <Calendar mode="range" defaultValue={{ from: "2027-04-05", to: "2027-04-16" }} />,
    );
    expect(html).toContain("April 2027");
    expect(html).not.toContain("invisible");
  });

  it("keeps its place and stays blank when nothing says which month", () => {
    withoutAClock();
    const html = renderToString(<Calendar />);
    expect(html).toContain("invisible");
  });

  it("opens on today's month when it is told the day", () => {
    withoutAClock();
    const html = renderToString(<Calendar today="2026-11-14" />);
    expect(html).toContain("November 2026");
    expect(html).not.toContain("invisible");
  });
});
