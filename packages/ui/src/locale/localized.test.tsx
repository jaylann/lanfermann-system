import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnchorHeading } from "@/components/anchor-heading/anchor-heading";
import { Bullet } from "@/components/bullet/bullet";
import { FileThumbStack } from "@/components/file-thumb/file-thumb-stack";
import { Funnel } from "@/components/funnel/funnel";
import { Pager } from "@/components/pager/pager";

import { LocaleProvider, useProvidedTag } from "./locale";
import { LocalizedNumber, LocalizedSentence } from "./localized";

const english = (children: ReactNode) =>
  renderToStaticMarkup(<LocaleProvider locale="en">{children}</LocaleProvider>);

function Tag() {
  return useProvidedTag() ?? "none";
}

describe("the leaves a server-safe component speaks through", () => {
  it("fill a sentence of the table in the provider's language", () => {
    const sentence = <LocalizedSentence ns="fileThumbStack" name="count" args={[4]} />;
    expect(renderToStaticMarkup(sentence)).toBe("4 Dateien");
    expect(english(sentence)).toBe("4 files");
    expect(english(<LocalizedSentence ns="fileThumbStack" name="count" args={[1]} />)).toBe(
      "1 file",
    );
  });

  it("write a number the way the provider does, German without one", () => {
    const euros = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
    expect(renderToStaticMarkup(<LocalizedNumber value={38400} options={euros} />)).toBe(
      "38.400 €",
    );
    expect(english(<LocalizedNumber value={38400} options={euros} />)).toBe("€38,400");
    // A value that rounds to zero carries no minus, as everywhere in the system.
    expect(english(<LocalizedNumber value={-0.2} options={{ maximumFractionDigits: 0 }} />)).toBe(
      "0",
    );
  });

  it("tell a provider's tag from no provider at all", () => {
    expect(renderToStaticMarkup(<Tag />)).toBe("none");
    expect(english(<Tag />)).toBe("en-US");
    expect(
      renderToStaticMarkup(
        <LocaleProvider locale="de">
          <Tag />
        </LocaleProvider>,
      ),
    ).toBe("de-DE");
  });
});

describe("server-safe parts without a label of their own", () => {
  const files = [
    { name: "Angebot.pdf", kind: "pdf" },
    { name: "Notizen.txt", kind: "file" },
  ] as const;

  it("are named by a hidden word of the table", () => {
    const heading = renderToStaticMarkup(<AnchorHeading id="a">Abschnitt</AnchorHeading>);
    expect(heading).toMatch(/aria-labelledby="([^"]+)"[^>]*>.*<span id="\1" hidden="">Link zu/);
    expect(heading).not.toContain("aria-label=");
    expect(english(<AnchorHeading id="a">Section</AnchorHeading>)).toContain(
      "Link to this section",
    );
    expect(english(<Pager />)).toMatch(/<span id="[^"]+" hidden="">More pages<\/span>/);
    expect(english(<FileThumbStack files={[...files]} />)).toMatch(/hidden="">2 files<\/span>/);
  });

  it("keep the caller's label as the attribute it was, and add nothing", () => {
    const heading = renderToStaticMarkup(
      <AnchorHeading id="a" anchorLabel="Zum Abschnitt">
        Abschnitt
      </AnchorHeading>,
    );
    expect(heading).toContain('aria-label="Zum Abschnitt"');
    expect(heading).not.toContain("aria-labelledby");
    expect(heading).not.toContain('hidden=""');

    const stack = english(
      <FileThumbStack files={[...files]} countLabel={(count) => `${count} Stück`} />,
    );
    expect(stack).toContain('aria-label="2 Stück"');
    expect(stack).not.toContain("aria-labelledby");

    // An attribute of the caller's own names the landmark too: no second name beside it.
    const pager = english(<Pager aria-label="Weiterlesen" />);
    expect(pager).toContain('aria-label="Weiterlesen"');
    expect(pager).not.toContain("aria-labelledby");
  });
});

describe("the figures of a server-safe chart", () => {
  const goals = [{ name: "Umsatz", value: 38400, target: 50000 }];
  const steps = [
    { name: "Geschrieben", value: 1240 },
    { name: "Gesendet", value: 1054 },
  ];

  it("are German without a provider, as they were", () => {
    const bullet = renderToStaticMarkup(<Bullet data={goals} />);
    expect(bullet).toContain("38.400");
    expect(bullet).toContain("77 %");
    expect(renderToStaticMarkup(<Funnel data={steps} />)).toContain("1.240");
    // Without a provider the leaf writes what the component's own `de-DE` writes.
    expect(bullet.replaceAll("<!-- -->", "")).toBe(
      renderToStaticMarkup(<Bullet data={goals} locale="de-DE" />).replaceAll("<!-- -->", ""),
    );
  });

  it("follow the provider, and a locale of their own before it", () => {
    expect(english(<Bullet data={goals} />)).toContain("38,400");
    expect(english(<Bullet data={goals} />)).toContain("77%");
    expect(english(<Funnel data={steps} />)).toContain("1,240");
    expect(english(<Funnel data={steps} locale="de-DE" />)).toContain("1.240");
    expect(english(<Bullet data={goals} locale="de-DE" />)).toContain("38.400");
  });
});
