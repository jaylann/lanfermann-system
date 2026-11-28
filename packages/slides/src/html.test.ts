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

  it.each([
    ["an https address", "https://cdn.example.com/decks/handschlag/a1b2.png?v=2"],
    ["a path from the origin's root", "/decks/handschlag/assets/a1b2.png"],
    ["a path beside the page", "./assets/a1b2.png"],
    ["a path one folder up", "../assets/a1b2.png"],
  ])(
    "puts %s in place of a picture's name, in every way the name may be quoted",
    async (_, url) => {
      const js = "var a=\"./bilder/a.png\",b='./bilder/a.png',c=`./bilder/a.png`;";
      const html = await deckHtml(js, { ...BASE, assets: { "./bilder/a.png": url } });
      const value = JSON.stringify(url);
      expect(scriptsOf(html)[1]).toBe(`var a=${value},b=${value},c=${value};`);
    },
  );

  it("replaces every name in one pass: a value that reads like another name stays", async () => {
    const js = 'var a="./a.png",b="./b.png",c="data:image/svg+xml,<svg x=\'./a.png\'/>";';
    const html = await deckHtml(js, {
      ...BASE,
      assets: {
        "./a.png": "./b.png",
        "./b.png": "data:image/png;base64,BBBB",
        "data:image/svg+xml,<svg x='./a.png'/>": "/c.svg",
      },
    });
    expect(scriptsOf(html)[1]).toBe('var a="./b.png",b="data:image/png;base64,BBBB",c="/c.svg";');
  });

  it("keeps an address from ending the script it stands in", async () => {
    const html = await deckHtml('var a="./a.png";', {
      ...BASE,
      assets: { "./a.png": 'https://example.com/</script><script>alert("x")</script>' },
    });
    expect(scriptsOf(html)).toHaveLength(3);
    const page: Record<string, unknown> = {};
    runInNewContext(scriptsOf(html)[1] ?? "", page);
    expect(page.a).toBe('https://example.com/</script><script>alert("x")</script>');
  });

  it.each([
    ["http:", "http://example.com/a.png"],
    ["javascript:", "javascript:alert(1)"],
    ["another scheme", "ftp://example.com/a.png"],
    ["a file of the machine", "file:///etc/hosts"],
    ["an address without a scheme", "//example.com/a.png"],
    ["a bare word", "a.png"],
    ["nothing", ""],
    ["https without a host", "https://"],
    ["https without its slashes", "https:example.com/a.png"],
    ["a user name in the address", "https://nutzer:geheim@example.com/a.png"],
    ["a host no policy can name", "https://*.example.com/a.png"],
    ["a host that would end the directive", "https://a;script-src/a.png"],
    ["an IPv6 host", "https://[::1]/a.png"],
    ["a backslash that a browser reads as a slash", "/\\example.com/a.png"],
    ["a tab that a browser drops", "/\t/example.com/a.png"],
    ["a blank in front", " https://example.com/a.png"],
    ["a line break", "./a\n.png"],
  ])("refuses an asset that is %s, and names only the asset", async (_, url) => {
    const refusal =
      'The asset "./a.png" is neither a data URL, an https address nor a path on the page\'s ' +
      "own origin (/…, ./… or ../…).";
    const assets = { "./a.png": url };
    const failure: unknown = await deckHtml(JS, { ...BASE, assets }).catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(TypeError);
    expect(failure).toHaveProperty("message", refusal);
    expect(() => deckCsp(JS, { mode: "audience", assets })).toThrow(new TypeError(refusal));
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
    for (const csp of [
      deckCsp(JS, { mode: "audience" }),
      deckCsp(JS, { mode: "audience", assets: {} }),
      deckCsp(JS, { mode: "audience", assets: { "./a.png": "data:image/png;base64,AAAA" } }),
    ]) {
      expect(csp).not.toContain("unsafe");
      expect(csp).not.toContain("connect-src");
      expect(csp).not.toContain("'self'");
      expect(csp).not.toMatch(/https?:|\*/);
      expect(csp).toContain("; img-src data:; ");
    }
  });

  const imgSrc = (assets: Record<string, string>) =>
    deckCsp(JS, { mode: "audience", assets })
      .split("; ")
      .find((directive) => directive.startsWith("img-src "));

  it("lets pictures come from exactly the origins of the assets, each once and in order", () => {
    expect(
      imgSrc({
        "./a.png": "https://cdn.example.com/decks/a.png",
        "./b.png": "https://bilder.example.org:8443/b.png?v=2#x",
        "./c.png": "https://cdn.example.com/other/c.png",
        "./d.png": "data:image/png;base64,AAAA",
        "./e.png": "HTTPS://CDN.Example.com:443/e.png",
      }),
    ).toBe("img-src data: https://bilder.example.org:8443 https://cdn.example.com");
    // The same policy whichever asset is named first.
    expect(imgSrc({ a: "https://b.example/1", b: "https://a.example/2" })).toBe(
      imgSrc({ b: "https://a.example/2", a: "https://b.example/1" }),
    );
  });

  it.each(["/decks/handschlag/a.png", "./assets/a.png", "../assets/a.png"])(
    "lets pictures come from the page's own origin for the path %s, and from nowhere else",
    (path) => {
      expect(imgSrc({ "./a.png": path })).toBe("img-src data: 'self'");
      expect(imgSrc({ "./a.png": path, "./b.png": "https://cdn.example.com/b.png" })).toBe(
        "img-src data: 'self' https://cdn.example.com",
      );
    },
  );

  it("names 'self' only for a path: an https address alone does not open the own origin", () => {
    expect(imgSrc({ "./a.png": "https://cdn.example.com/a.png" })).toBe(
      "img-src data: https://cdn.example.com",
    );
  });

  it("widens nothing but img-src, and stays the policy of the file with those assets", async () => {
    const js = 'var __LF_DECK__={default:"./a.png"};';
    const options = {
      ...BASE,
      assets: { "./a.png": "https://cdn.example.com/a.png", "./b.png": "/b.png" },
    };
    const csp = deckCsp(js, options);
    const html = await deckHtml(js, { ...options, csp });
    const [style] = stylesOf(html);
    expect(scriptsOf(html)[1]).toBe('var __LF_DECK__={default:"https://cdn.example.com/a.png"};');
    expect(csp).toBe(
      [
        "default-src 'none'",
        `style-src ${hash(style ?? "")}`,
        `script-src ${scriptsOf(html).map(hash).join(" ")}`,
        "img-src data: 'self' https://cdn.example.com",
        "font-src data:",
        "base-uri 'none'",
        "form-action 'none'",
      ].join("; "),
    );
  });

  it("changes the script's hash with the value of an asset", () => {
    const js = 'var __LF_DECK__={default:"./a.png"};';
    const policy = (url: string) => deckCsp(js, { mode: "audience", assets: { "./a.png": url } });
    const scriptSrc = (csp: string) =>
      csp.split("; ").find((part) => part.startsWith("script-src"));
    const first = policy("https://cdn.example.com/a1.png");
    // The same origin, so the same img-src: only the hash tells the two files apart.
    expect(scriptSrc(policy("https://cdn.example.com/a2.png"))).not.toBe(scriptSrc(first));
    expect(scriptSrc(policy("data:image/png;base64,AAAA"))).not.toBe(scriptSrc(first));
    expect(scriptSrc(policy("https://cdn.example.com/a1.png"))).toBe(scriptSrc(first));
  });

  it("takes a preview server's reload line into the policy", () => {
    const reload = 'new EventSource("/__slides/events");';
    const csp = deckCsp(JS, { mode: "presenter" }, { scripts: [reload], connectSelf: true });
    expect(csp).toContain(hash(reload));
    expect(csp).toContain("connect-src 'self'");
  });
});
