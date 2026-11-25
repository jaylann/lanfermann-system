import { watch } from "node:fs";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { type DevServer, startDevServer } from "./dev";
import { describeWithKit, fixturePath } from "./testing";

/** Whether this system lets a process watch a folder: asked once, on a folder of its own. */
const canWatch = await (async () => {
  const dir = await mkdtemp(join(tmpdir(), "lf-slides-watch-"));
  try {
    return await new Promise<boolean>((answer) => {
      const watcher = watch(dir, { recursive: true });
      watcher.on("error", () => answer(false));
      setTimeout(() => {
        watcher.close();
        answer(true);
      }, 300);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
})();
if (!canWatch) {
  console.warn("SKIPPED: this system refuses to watch a folder, so the watch test does not run.");
}

/** What the server logs, without the line about a folder it may not watch. */
const said = (log: readonly string[]) => log.filter((line) => !line.startsWith("cannot watch"));

const servers: DevServer[] = [];
const made: string[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) await server.close();
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true });
});

/** A copy of a fixture the test may change, served on any free port. */
async function serve(name: string, audience = false) {
  const dir = await mkdtemp(join(tmpdir(), "lf-slides-dev-"));
  made.push(dir);
  await cp(fixturePath(name), dir, { recursive: true });
  const log: string[] = [];
  const server = await startDevServer({ dir, port: 0, audience, log: (line) => log.push(line) });
  servers.push(server);
  return { dir, server, log };
}

/** One request, with the Host header a test wants to send. */
function get(url: string, host?: string): Promise<{ status: number; body: string }> {
  return new Promise((done, failed) => {
    const sent = request(url, { headers: host === undefined ? {} : { host } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => (body += chunk));
      response.on("end", () => done({ status: response.statusCode ?? 0, body }));
    });
    sent.on("error", failed);
    sent.end();
  });
}

/** The first event the server sends after `change` has been made. */
function nextReload(url: string, change: () => Promise<void>): Promise<string> {
  return new Promise((done, failed) => {
    const sent = request(`${url}__slides/events`, (response) => {
      response.setEncoding("utf8");
      let opened = false;
      response.on("data", (chunk: string) => {
        if (!opened) {
          opened = true;
          change().catch(failed);
        } else if (chunk.includes("event: reload")) {
          sent.destroy();
          done(chunk);
        }
      });
    });
    sent.on("error", (error) => {
      // Destroyed on purpose once the event is in.
      if (!sent.destroyed) failed(error);
    });
    sent.end();
  });
}

describeWithKit("startDevServer", () => {
  it("serves the presenter's file on 127.0.0.1, with a policy that allows its reload line", async () => {
    const { server, log } = await serve("sample");
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    expect(said(log)).toEqual(["built"]);
    const { status, body } = await get(server.url);
    expect(status).toBe(200);
    expect(body).toContain('"mode":"presenter"');
    expect(body).toContain("NOTE-CANARY-7f3a91");
    expect(body).toContain("connect-src 'self'");
    expect(body).toMatch(
      /<script>new EventSource\("\/__slides\/events"\)[^<]*<\/script>\n<\/body>/,
    );
    // The address of the audience's window is the same page with a query.
    expect((await get(`${server.url}?mode=audience&session=abc`)).status).toBe(200);
    expect((await get(`${server.url}etwas-anderes`)).status).toBe(404);
  });

  it("serves what an audience gets with audience: true", async () => {
    const { server } = await serve("sample", true);
    const { body } = await get(server.url);
    expect(body).toContain('"mode":"audience"');
    expect(body).not.toContain("NOTE-CANARY");
  });

  it("answers only under its own name", async () => {
    const { server } = await serve("sample");
    const port = new URL(server.url).port;
    expect((await get(server.url, "evil.example")).status).toBe(403);
    expect((await get(server.url, `evil.example:${port}`)).status).toBe(403);
    expect((await get(server.url, `localhost:${port}`)).status).toBe(200);
  });

  it("shows the errors of a deck that does not build, as a page and in its log", async () => {
    const { server, log } = await serve("bad-import");
    expect(said(log)).toEqual([
      'deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)',
      "the deck does not build (see above)",
    ]);
    const { status, body } = await get(server.url);
    expect(status).toBe(500);
    expect(body).toContain('<pre>deck.tsx:2:20 error import "lodash" is not allowed');
    expect(body).toContain("EventSource");
  });

  const retitle = async (dir: string) => {
    const file = join(dir, "deck.tsx");
    const text = await readFile(file, "utf8");
    await writeFile(
      file,
      text.replace('title="Der digitale Handschlag"', 'title="Ein neuer Titel"'),
    );
  };

  it("builds again when asked, and tells the open pages", async () => {
    const { dir, server, log } = await serve("sample");
    const event = await nextReload(server.url, async () => {
      await retitle(dir);
      await server.rebuild();
    });
    expect(event).toContain("event: reload");
    expect((await get(server.url)).body).toContain("<title>Ein neuer Titel</title>");
    expect(log.filter((line) => line === "built").length).toBeGreaterThanOrEqual(2);
  });

  // A sandbox may refuse to watch a folder at all (macOS answers EMFILE): then the server says
  // so and keeps serving, which the tests above show, and this one has nothing to watch.
  it.skipIf(!canWatch)("builds again by itself when a file changes", async () => {
    const { dir, server } = await serve("sample");
    const event = await nextReload(server.url, () => retitle(dir));
    expect(event).toContain("event: reload");
    expect((await get(server.url)).body).toContain("<title>Ein neuer Titel</title>");
  });
});
