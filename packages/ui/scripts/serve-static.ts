/**
 * Serves the built workshop (`storybook-static/`) on the local network, for looking at it on a
 * real phone: `bun run build-storybook`, then
 *
 *   node scripts/serve-static.ts [--port 6007] [--log <file>]
 *
 * and open the printed address on a phone in the same Wi-Fi. The built workshop is a few bundled
 * files, so it loads in a moment where the dev server sends hundreds of modules; the price is
 * that it does not follow edits (build again, reload).
 *
 * `/stories` is the page to open on a phone: a plain list that links to every story on its own,
 * without Storybook's interface around it (which is most of the download and of little use on a
 * small screen). Files go out compressed, and a file whose content did not change is never sent
 * twice, also not after a rebuild: a phone's link to a laptop is often slow.
 *
 * Every first request of a device is printed with its address and browser, which answers the
 * usual question "does the phone reach this machine at all?".
 *
 *   --report   also print what goes wrong on the device: every page gets a few lines of script
 *              that send its errors, failed files and what it ended up showing back here. A
 *              phone has no console to look into; this is it.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : (args[index + 1] ?? fallback);
};
const port = Number(option("--port", "6007"));
const logFile = option("--log", "");
const report = args.includes("--report");
const root = resolve(import.meta.dirname, "../storybook-static");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json",
};

if (!existsSync(join(root, "index.html"))) {
  console.error("No storybook-static: run `bun run build-storybook` first.");
  process.exit(2);
}

function say(line: string) {
  console.log(line);
  if (logFile) appendFileSync(logFile, `${line}\n`);
}

/** Runs on the device, before anything else on the page. Plain ES5: it has to run everywhere. */
const REPORTER = `<script>(function(){
function send(kind,text){try{navigator.sendBeacon("/__report",kind+": "+text)}catch(e){}}
window.addEventListener("error",function(e){
  var from=e.target&&e.target!==window&&(e.target.src||e.target.href);
  send(from?"failed to load":"error",from||((e.message||"")+" @ "+(e.filename||"")+":"+(e.lineno||"")));
},true);
window.addEventListener("unhandledrejection",function(e){send("rejection",String(e.reason&&e.reason.stack||e.reason).slice(0,600))});
send("opened",location.pathname+location.search);
window.addEventListener("load",function(){setTimeout(function(){
  var root=document.querySelector("#storybook-root")||document.querySelector("#root");
  send("after 4s",(root?root.childElementCount+" elements in the root":"no root")+"; text: "+(document.body.innerText||"").slice(0,90).replace(/\\n+/g," | "));
},4000)});
})();</script>`;

type Served = { mtime: number; etag: string; body: Buffer; gzip: Buffer | null };
const files = new Map<string, Served>();
const TEXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".svg", ".map"]);

/** A file as it goes out: its content, compressed if that helps, and a tag of its content. */
function served(file: string): Served {
  const mtime = statSync(file).mtimeMs;
  const known = files.get(file);
  if (known && known.mtime === mtime) return known;
  const body = readFileSync(file);
  const entry: Served = {
    mtime,
    // Of the content, not of the date: a rebuild writes every file anew, mostly unchanged.
    etag: `"${createHash("sha1").update(body).digest("base64url").slice(0, 20)}"`,
    body,
    gzip: TEXT.has(extname(file)) ? gzipSync(body, { level: 9 }) : null,
  };
  files.set(file, entry);
  return entry;
}

/** The list a phone starts from: every story, linked on its own. */
function storiesPage(): string {
  type Entry = { id: string; title: string; name: string; type: string };
  const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as {
    entries: Record<string, Entry>;
  };
  const groups = new Map<string, Entry[]>();
  for (const entry of Object.values(index.entries)) {
    if (entry.type !== "story") continue;
    groups.set(entry.title, [...(groups.get(entry.title) ?? []), entry]);
  }
  const escape = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
  const sections = [...groups]
    .map(([title, entries]) => {
      const links = entries
        .map(
          (entry) =>
            `<a href="/iframe.html?id=${entry.id}&viewMode=story">${escape(entry.name)}</a>`,
        )
        .join("");
      return `<section><h2>${escape(title)}</h2><p>${links}</p></section>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Stories</title>
<style>
  body{font:16px/1.4 system-ui,sans-serif;margin:0;padding:16px;color:#13121c;background:#fbfbfd}
  h1{font-size:20px;margin:0 0 4px} small{color:#6a6979}
  h2{font-size:13px;font-weight:600;color:#6a6979;margin:20px 0 6px}
  p{display:flex;flex-wrap:wrap;gap:8px;margin:0}
  a{display:inline-block;padding:10px 12px;border:1px solid #d9d8e3;border-radius:8px;color:inherit;text-decoration:none;background:#fff}
</style></head><body><h1>Stories</h1><small>Each opens on its own, without Storybook around it.
Add <code>&amp;globals=ground:ink</code> to a link for another ground.</small>${sections}</body></html>`;
}

const seen = new Set<string>();
const server = createServer((request, response) => {
  const remote = request.socket.remoteAddress ?? "?";
  if (!seen.has(remote)) {
    seen.add(remote);
    say(`first request from ${remote}: ${request.headers["user-agent"] ?? "no user agent"}`);
  }
  let path: string;
  try {
    path = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
  } catch {
    // "/%" or "//": anyone on the network can send it, and it must not stop the server.
    response.writeHead(400).end();
    return;
  }

  if (path === "/__report") {
    let body = "";
    request.on("data", (chunk: Buffer) => {
      // A line of an error is all that is ever printed: nothing longer is kept.
      if (body.length < 2000) body += chunk.toString();
    });
    request.on("end", () => {
      say(`  [${remote}] ${body.slice(0, 700)}`);
      response.writeHead(204).end();
    });
    return;
  }

  const wantsGzip = /\bgzip\b/.test(String(request.headers["accept-encoding"] ?? ""));
  const send = (type: string, entry: { etag: string; body: Buffer; gzip: Buffer | null }) => {
    const headers: Record<string, string> = {
      "content-type": type,
      // Kept by the device and asked about each time: only what changed is sent again.
      "cache-control": "no-cache",
      etag: entry.etag,
      vary: "accept-encoding",
    };
    if (request.headers["if-none-match"] === entry.etag) {
      response.writeHead(304, headers).end();
      return;
    }
    const body = wantsGzip && entry.gzip ? entry.gzip : entry.body;
    if (body === entry.gzip) headers["content-encoding"] = "gzip";
    headers["content-length"] = String(body.length);
    if (report) {
      // Told apart: a file that went out whole, and one the device gave up on.
      const started = Date.now();
      let whole = false;
      response.on("finish", () => (whole = true));
      response.on("close", () => {
        const took = Date.now() - started;
        if (!whole) say(`  [${remote}] gave up on ${path} after ${took}ms`);
        else if (took > 3000) say(`  [${remote}] ${path}: ${body.length} bytes took ${took}ms`);
      });
    }
    response.writeHead(200, headers).end(body);
  };
  /** A page as text: with the reporter in it when asked for, and a tag of what is sent. */
  const page = (html: string) => {
    const body = Buffer.from(report ? html.replace(/<head>/i, (head) => head + REPORTER) : html);
    return {
      etag: `"${createHash("sha1").update(body).digest("base64url").slice(0, 20)}"`,
      body,
      gzip: gzipSync(body),
    };
  };

  if (path === "/stories") {
    send(MIME[".html"]!, page(storiesPage()));
    return;
  }

  // `normalize` folds `..` away; anything that still leaves the folder is refused.
  let file = join(root, normalize(path));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    if (report) say(`  [${remote}] 404 ${path}`);
    response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  const type = MIME[extname(file)] ?? "application/octet-stream";
  send(type, extname(file) === ".html" ? page(readFileSync(file, "utf8")) : served(file));
});

server.listen(port, "0.0.0.0", () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry!.address}:${port}`);
  say(`serving ${root}`);
  for (const address of addresses) say(`  on the network: ${address}/stories`);
});
