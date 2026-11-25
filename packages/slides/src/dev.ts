import { watch } from "node:fs";
import { createServer, type ServerResponse } from "node:http";

import { analyzeDeck } from "./analyze";
import { htmlFor } from "./build";
import { bundleDeck } from "./bundle";
import { checkDeck } from "./check";
import { readDeckDir } from "./source";
import { diagnosticOf, formatDiagnostic } from "./types";

export type DevOptions = {
  /** The deck's folder. */
  dir: string;
  /** The port on 127.0.0.1. `0` takes any that is free. */
  port: number;
  /** Serve the file an audience gets (no notes) instead of the presenter's. */
  audience?: boolean;
  /** Where the server says what it does. */
  log: (line: string) => void;
};

export type DevServer = {
  /** `http://127.0.0.1:<port>/` */
  url: string;
  /** Builds the deck again now and tells the open pages, as a change of a file does. */
  rebuild: () => Promise<void>;
  close: () => Promise<void>;
};

const EVENTS = "/__slides/events";
/**
 * The one line of a previewed page that talks to a server: it waits for the word that the deck
 * was built again. A built file has no such line, and its policy would not let it connect.
 */
const RELOAD = `new EventSource(${JSON.stringify(EVENTS)}).addEventListener("reload",()=>location.reload());`;
const DEBOUNCE = 100;

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** What the browser shows while the deck does not build: the same lines as the terminal. */
function errorPage(lines: readonly string[]): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    '<meta charset="utf-8">',
    "<title>The deck does not build</title>",
    "<h1>The deck does not build</h1>",
    `<pre>${escapeHtml(lines.join("\n"))}</pre>`,
    `<script>${RELOAD}</script>`,
    "</html>",
    "",
  ].join("\n");
}

type Built = { ok: boolean; html: string; lines: string[] };

async function buildPage(dir: string, audience: boolean): Promise<Built> {
  try {
    const source = await readDeckDir(dir);
    const { files, entry } = source;
    // The same check as `slides check`, without the layout: a preview shows that anyway.
    const check = await checkDeck(source, { browser: false });
    const lines = check.diagnostics.map(formatDiagnostic);
    const bundle = check.ok ? await bundleDeck({ files, entry, stripNotes: audience }) : undefined;
    if (bundle?.js === undefined) {
      const more = (bundle?.errors ?? []).map((error) =>
        formatDiagnostic(diagnosticOf(error, entry)),
      );
      return { ok: false, html: errorPage([...lines, ...more]), lines: [...lines, ...more] };
    }
    const html = await htmlFor(
      bundle.js,
      source,
      analyzeDeck(source),
      { mode: audience ? "audience" : "presenter" },
      { scripts: [RELOAD], connectSelf: true },
    );
    // Before the end of the body: the last one, since a deck's text could hold the same words.
    const end = html.lastIndexOf("</body>");
    return {
      ok: true,
      html: `${html.slice(0, end)}<script>${RELOAD}</script>\n${html.slice(end)}`,
      lines,
    };
  } catch (error) {
    const line = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { ok: false, html: errorPage([line]), lines: [line] };
  }
}

/**
 * Serves a deck from its folder on 127.0.0.1 and nowhere else: the presenter's file by default,
 * built again when a file of the folder changes, and reloaded in the browser through one line
 * of server-sent events. A deck that does not build is shown as its list of errors, in the
 * terminal and on the page.
 */
export async function startDevServer(options: DevOptions): Promise<DevServer> {
  const { dir, log } = options;
  const audience = options.audience === true;
  let page = await buildPage(dir, audience);
  const listeners = new Set<ServerResponse>();

  const report = (built: Built) => {
    for (const line of built.lines) log(line);
    log(built.ok ? "built" : "the deck does not build (see above)");
  };
  report(page);

  let timer: NodeJS.Timeout | undefined;
  let building = false;
  let again = false;
  const rebuild = async (): Promise<void> => {
    if (building) {
      again = true;
      return;
    }
    building = true;
    do {
      again = false;
      page = await buildPage(dir, audience);
      report(page);
    } while (again);
    building = false;
    for (const listener of listeners) listener.write("event: reload\ndata: 1\n\n");
  };
  const watcher = watch(dir, { recursive: true }, (_event, file) => {
    // The tool's own output and what an editor writes beside a file are no change of the deck.
    if (file !== null && /(^|[\\/])(\.|node_modules[\\/])/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      rebuild().catch((error: unknown) => log(String(error)));
    }, DEBOUNCE);
  });
  // A system that lets nobody watch the folder (a sandbox, a full table of watchers) must not
  // end the preview: it still serves, and says that it no longer follows the files.
  watcher.on("error", (error) => {
    log(`cannot watch the folder (${error.message}): changes are not picked up until a restart`);
    watcher.close();
  });

  const server = createServer((request, response) => {
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : options.port;
    // A page of another site must not read the deck through a name that points here.
    if (
      request.headers.host !== `127.0.0.1:${port}` &&
      request.headers.host !== `localhost:${port}`
    ) {
      response.writeHead(403).end();
      return;
    }
    const path = URL.parse(request.url ?? "/", "http://127.0.0.1")?.pathname;
    if (path === undefined) {
      response.writeHead(400).end();
    } else if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD" }).end();
    } else if (path === EVENTS) {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      response.write(": connected\n\n");
      listeners.add(response);
      request.on("close", () => listeners.delete(response));
    } else if (path === "/" || path === "/index.html") {
      response.writeHead(page.ok ? 200 : 500, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(request.method === "HEAD" ? undefined : page.html);
    } else {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found\n");
    }
  });

  await new Promise<void>((listening, failed) => {
    server.once("error", failed);
    server.listen(options.port, "127.0.0.1", () => {
      server.off("error", failed);
      listening();
    });
  }).catch((error: unknown) => {
    watcher.close();
    throw error;
  });

  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : options.port;
  return {
    url: `http://127.0.0.1:${port}/`,
    rebuild,
    close: () =>
      new Promise((closed, failed) => {
        clearTimeout(timer);
        watcher.close();
        for (const listener of listeners) listener.end();
        server.close((error) => (error ? failed(error) : closed()));
      }),
  };
}
