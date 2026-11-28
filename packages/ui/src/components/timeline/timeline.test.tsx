import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TimelineItem } from "./timeline";

describe("TimelineItem", () => {
  it("draws the mark where no avatar is given, also for `avatar={false}`", () => {
    for (const avatar of [undefined, null, false] as const) {
      const html = renderToStaticMarkup(
        <TimelineItem avatar={avatar}>Das Angebot ist abgelaufen.</TimelineItem>,
      );
      expect(html).toContain('data-lead="mark"');
      expect(html).toContain('data-slot="timeline-mark"');
    }
  });

  it("is led by the avatar where there is one", () => {
    const html = renderToStaticMarkup(
      <TimelineItem avatar={<span data-slot="avatar">AW</span>}>
        Anna Weber hat das Angebot angenommen.
      </TimelineItem>,
    );
    expect(html).toContain('data-lead="avatar"');
    expect(html).not.toContain('data-slot="timeline-mark"');
  });
});
