import { describe, expect, it, vi } from "vitest";

import { encodeConsent } from "./consent-record";
import { sampleConsentConfig as config } from "./consent-sample";
import { createConsentStore, createMemoryJar, readCookie } from "./consent-store";

const now = Date.UTC(2026, 10, 18, 12);

function setup({
  cookies = {},
  blocked = false,
  protocol = "https:",
}: { cookies?: Record<string, string>; blocked?: boolean; protocol?: string } = {}) {
  const jar = createMemoryJar(cookies, { blocked });
  const location = { hostname: "www.schreinerei-mustermann.de", protocol, reload: vi.fn() };
  const onChange = vi.fn();
  const store = createConsentStore(config, { jar, location, onChange, now: () => now });
  return { jar, location, onChange, store };
}

const stored = (granted: string[]) =>
  encodeConsent({ revision: config.revision, decidedAt: now - 1000, granted }, config);

describe("the consent store", () => {
  it("is unknown on the server and undecided in a browser without an answer", () => {
    const { store } = setup();
    expect(store.getServerSnapshot().status).toBe("unknown");
    expect(store.getSnapshot().status).toBe("undecided");
  });

  it("hands React the same snapshot while nothing changed", () => {
    const { store } = setup({ cookies: { "lf-consent": stored(["matomo"]) } });
    const first = store.getSnapshot();
    expect(first.status).toBe("decided");
    expect(store.getSnapshot()).toBe(first);
  });

  it("writes a first-party cookie that lasts the configured age", () => {
    const { jar, store } = setup();
    store.decide(["matomo"]);
    const written = jar.writes.at(-1) ?? "";
    expect(written).toMatch(/^lf-consent=[^;]+; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/);
    expect(store.getSnapshot().record?.granted).toEqual(["matomo"]);
  });

  it("leaves out Secure on plain http, where the browser would refuse the cookie", () => {
    const { jar, store } = setup({ protocol: "http:" });
    store.decide([]);
    expect(jar.writes.at(-1)).not.toContain("Secure");
  });

  it("keeps the answer in memory where cookies are blocked", () => {
    const { store } = setup({ blocked: true });
    store.decide([]);
    expect(store.getSnapshot()).toMatchObject({ status: "decided", record: { granted: [] } });
  });

  it("stores only services it knows", () => {
    const { store } = setup();
    expect(store.decide(["matomo", "gone", "matomo"]).record.granted).toEqual(["matomo"]);
  });

  it("deletes what a revoked service stored, on the host and the domains above it", () => {
    const { jar, store } = setup({
      cookies: { "lf-consent": stored(["matomo", "meta-pixel"]), "_pk_id.1.ab": "x", _fbp: "y" },
    });
    store.decide(["matomo"]);
    expect(readCookie(jar.read(), "_fbp")).toBeUndefined();
    expect(readCookie(jar.read(), "_pk_id.1.ab")).toBe("x");
    const deletions = jar.writes.filter((write) => write.startsWith("_fbp="));
    expect(deletions).toEqual([
      "_fbp=; Path=/; Max-Age=0; Secure",
      "_fbp=; Path=/; Max-Age=0; Domain=www.schreinerei-mustermann.de; Secure",
      "_fbp=; Path=/; Max-Age=0; Domain=schreinerei-mustermann.de; Secure",
    ]);
  });

  it("deletes every cookie a prefix names", () => {
    const { jar, store } = setup({
      cookies: { "lf-consent": stored(["matomo"]), "_pk_id.1.ab": "x", "_pk_id.2.cd": "y" },
    });
    store.decide([]);
    expect(jar.read()).not.toContain("_pk_id");
  });

  it("asks for a reload only when a revoked service's script ran in this document", () => {
    const { store } = setup({ cookies: { "lf-consent": stored(["matomo", "youtube"]) } });
    expect(store.decide(["matomo"]).reload).toBe(false);
    store.markRendered(["matomo"]);
    expect(store.decide([]).reload).toBe(true);
  });

  it("loads a service once without storing it, and drops it with a refusal", () => {
    const { jar, store } = setup();
    store.grantOnce("youtube");
    expect(store.getSnapshot().session.has("youtube")).toBe(true);
    expect(jar.writes).toEqual([]);
    store.decide([]);
    expect(store.getSnapshot().session.has("youtube")).toBe(false);
  });

  it("reports what changed", () => {
    const { onChange, store } = setup({ cookies: { "lf-consent": stored(["matomo"]) } });
    store.announce();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ granted: ["matomo"] }), {
      granted: ["matomo"],
      revoked: [],
      initial: true,
    });
    store.decide(["youtube"]);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ granted: ["youtube"] }), {
      granted: ["youtube"],
      revoked: ["matomo"],
      initial: false,
    });
  });

  it("removes the answer on reset, so the reader is asked again", () => {
    const { store } = setup({ cookies: { "lf-consent": stored([]) } });
    store.reset();
    expect(store.getSnapshot().status).toBe("undecided");
  });
});
