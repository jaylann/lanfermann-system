import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";

import { expect, it } from "vitest";

import { deckCsp, deckHtml, type DeckHtmlOptions } from "./html";
import { loadKit } from "./kit";
import { describeWithKit } from "./testing";
import { version } from "./version";

const JS = 'var __LF_DECK__=(()=>({default:"deck"}))();';
const BASE: DeckHtmlOptions = { mode: "audience", title: "Der digitale Handschlag", lang: "de" };

const hash = (text: string) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
/** The inline parts of a file as a browser reads them: what stands between the tags. */
const scriptsOf = (html: string) =>
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");
const stylesOf = (html: string) =>
  [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1] ?? "");

describeWithKit("deckHtml", () => {
  it("is one file with the player, the fonts and the deck inline, and nothing to load", async () => {
    const kit = loadKit();
    const html = await deckHtml(JS, BASE);
    expect(html.startsWith("<!doctype html>\n<!-- A deck built with @lanfermann/slides")).toBe(
      true,
    );
    expect(html).toContain(
      `@lanfermann/slides ${version} on the player of @lanfermann/ui ${kit.version}`,
    );
    expect(html).toContain('<html lang="de">');
    expect(html).toContain("<title>Der digitale Handschlag</title>");
    expect(scriptsOf(html)).toEqual([
      kit.script,
      JS,
      '__LF_SLIDES__.mount(__LF_DECK__.default,{"mode":"audience","modes":["audience","print","check"]});',
    ]);
    expect(stylesOf(html)).toEqual([`${kit.fonts}\n${kit.css}`]);
    // No address of a file or a server: no src, no link to a stylesheet, no import.
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+stylesheet|@import/);
    expect(html).toContain('<link rel="icon" href="data:,">');
  });

  it("carries the player's notices to its end, as one comment", async () => {
    const html = await deckHtml(JS, BASE);
    const tail = html.slice(html.lastIndexOf("</html>"));
    expect(tail).toMatch(/^<\/html>\n<!--\n[\s\S]+\n-->\n$/);
    expect(tail).toContain("SIL Open Font License");
    expect(tail).toContain("Sofia Sans");
    // Nothing in the notices ends the comment before its end.
    expect(tail.indexOf("-->")).toBe(tail.length - 4);
  });

  it("writes a policy only when it is given one", async () => {
    expect(await deckHtml(JS, BASE)).not.toContain("Content-Security-Policy");
    const html = await deckHtml(JS, { ...BASE, csp: "default-src 'none'; img-src data:" });
    expect(html).toContain(
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:">',
    );
    // Before anything the policy is about, and after the charset.
    expect(html.indexOf("Content-Security-Policy")).toBeGreaterThan(html.indexOf("charset"));
    expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<style>"));
  });

  it.each([
    ["audience", ["audience", "print", "check"]],
    ["presenter", ["presenter", "audience", "print", "check"]],
    ["print", ["print"]],
    ["check", ["check"]],
  ] as const)("mounts in %s mode and allows %j in the address", async (mode, modes) => {
    const html = await deckHtml(JS, { ...BASE, mode });
    expect(scriptsOf(html).at(-1)).toBe(
      `__LF_SLIDES__.mount(__LF_DECK__.default,${JSON.stringify({ mode, modes })});`,
    );
  });

  it("hands the PDF's address to the player", async () => {
    const html = await deckHtml(JS, { ...BASE, pdfUrl: "der-digitale-handschlag.pdf" });
    expect(scriptsOf(html).at(-1)).toContain('"pdf":"der-digitale-handschlag.pdf"');
  });

  it("escapes what it is given: the title, the language, the PDF's address, the policy", async () => {
    const html = await deckHtml(JS, {
      mode: "audience",
      title: 'A & B </title><script>alert("x")</script>',
      lang: 'de"><script>',
      pdfUrl: "</script><script>alert(1)</script>",
      csp: 'default-src "none"',
    });
    expect(html).toContain(
      "<title>A &amp; B &lt;/title&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</title>",
    );
    expect(html).toContain('<html lang="de&quot;&gt;&lt;script&gt;">');
    expect(html).toContain('content="default-src &quot;none&quot;"');
    expect(scriptsOf(html)).toHaveLength(3);
    expect(scriptsOf(html).at(-1)).toContain(
      '"pdf":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"',
    );
  });

  it("keeps a deck's script from ending its own element", async () => {
    const js = 'var __LF_DECK__={default:"</script><!-- </SCRIPT>"};';
    const html = await deckHtml(js, BASE);
    expect(scriptsOf(html)).toHaveLength(3);
    const inline = scriptsOf(html)[1] ?? "";
    expect(inline).toBe('var __LF_DECK__={default:"<\\/script><\\!-- <\\/SCRIPT>"};');
    // The same text once the script runs.
    const page: Record<string, unknown> = {};
    runInNewContext(inline, page);
    expect(page.__LF_DECK__).toEqual({ default: "</script><!-- </SCRIPT>" });
  });

  it("replaces a picture's name by its data URL, in every way the name may be quoted", async () => {
    const js =
      'var a="./bilder/a.png",b=\'./bilder/a.png\',c=`./bilder/a.png`,d="https://example.com/b.jpg";';
    const html = await deckHtml(js, {
      ...BASE,
      assets: {
        "./bilder/a.png": "data:image/png;base64,AAAA",
        "https://example.com/b.jpg": "data:image/jpeg;base64,BBBB",
      },
    });
    expect(scriptsOf(html)[1]).toBe(
      'var a="data:image/png;base64,AAAA",b="data:image/png;base64,AAAA",c="data:image/png;base64,AAAA",d="data:image/jpeg;base64,BBBB";',
    );
  });

  it("replaces a name only where it is the whole string", async () => {
    const js = 'var a="./a.png.bak",b="siehe ./a.png",c="./a.png";';
    const html = await deckHtml(js, {
      ...BASE,
      assets: { "./a.png": "data:image/png;base64,AAAA" },
    });
    expect(scriptsOf(html)[1]).toBe(
      'var a="./a.png.bak",b="siehe ./a.png",c="data:image/png;base64,AAAA";',
    );
  });

  it("refuses an asset that is no data URL", async () => {
    await expect(
      deckHtml(JS, { ...BASE, assets: { "./a.png": "https://example.com/a.png" } }),
    ).rejects.toThrow('The asset "./a.png" is not a data URL.');
  });

  it("makes the same file from the same input", async () => {
    expect(await deckHtml(JS, BASE)).toBe(await deckHtml(JS, BASE));
  });
});

describeWithKit("deckCsp", () => {
  it("allows exactly the inline parts of the file it is made for, by their hashes", async () => {
    const options = {
      ...BASE,
      mode: "presenter" as const,
      pdfUrl: "deck.pdf",
      assets: { "./a.png": "data:image/png;base64,AAAA" },
    };
    const js = 'var __LF_DECK__={default:"./a.png"};';
    const csp = deckCsp(js, options);
    const html = await deckHtml(js, { ...options, csp });
    const [style] = stylesOf(html);
    expect(csp).toBe(
      [
        "default-src 'none'",
        `style-src ${hash(style ?? "")}`,
        `script-src ${scriptsOf(html).map(hash).join(" ")}`,
        "img-src data:",
        "font-src data:",
        "base-uri 'none'",
        "form-action 'none'",
      ].join("; "),
    );
    expect(scriptsOf(html)).toHaveLength(3);
    expect(stylesOf(html)).toHaveLength(1);
  });

  it("changes with the deck, the mode and the pictures", () => {
    const base = deckCsp(JS, { mode: "audience" });
    expect(deckCsp(`${JS};`, { mode: "audience" })).not.toBe(base);
    expect(deckCsp(JS, { mode: "presenter" })).not.toBe(base);
    expect(deckCsp(JS, { mode: "audience", pdfUrl: "a.pdf" })).not.toBe(base);
    expect(deckCsp(JS, { mode: "audience" })).toBe(base);
  });

  it("allows no connection, no eval and no inline script without a hash", () => {
    const csp = deckCsp(JS, { mode: "audience" });
    expect(csp).not.toContain("unsafe");
    expect(csp).not.toContain("connect-src");
    expect(csp).not.toMatch(/https?:|\*/);
  });

  it("takes a preview server's reload line into the policy", () => {
    const reload = 'new EventSource("/__slides/events");';
    const csp = deckCsp(JS, { mode: "presenter" }, { scripts: [reload], connectSelf: true });
    expect(csp).toContain(hash(reload));
    expect(csp).toContain("connect-src 'self'");
  });
});
