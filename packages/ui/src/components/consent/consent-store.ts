/*
 * The consent of one page: read from the consent cookie, written back when the reader decides,
 * and handed to React through `useSyncExternalStore`. One store per `ConsentProvider`.
 *
 * Where cookies are blocked, the answer lives for this document only (a client-side navigation
 * keeps it; a reload asks again, since nothing can be stored). Other tabs and the back/forward
 * cache are caught up when the page is shown again.
 */

import {
  type ConsentConfig,
  type ConsentRecord,
  consentServices,
  defaultCookieName,
  defaultMaxAgeDays,
  encodeConsent,
  parseConsent,
  storageMatches,
} from "./consent-record";

/** Where the consent cookie lives. The page's cookies unless a test or a preview passes its own. */
export type ConsentJar = {
  /** All cookies as `document.cookie` reads them: `a=1; b=2`. */
  read(): string;
  /** One cookie as `document.cookie` takes it: `a=1; Path=/; Max-Age=60`. */
  write(cookie: string): void;
};

export const documentJar: ConsentJar = {
  read: () => document.cookie,
  write: (cookie) => {
    document.cookie = cookie;
  },
};

/**
 * A jar that keeps cookies in memory, for tests and previews. It honours `Max-Age=0` and ignores
 * paths and domains. `blocked` makes it refuse every write, as a browser with cookies off does.
 */
export function createMemoryJar(
  initial: Record<string, string> = {},
  { blocked = false } = {},
): ConsentJar & { writes: string[] } {
  const cookies = new Map(Object.entries(initial));
  const writes: string[] = [];
  return {
    writes,
    read: () => [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
    write(cookie) {
      writes.push(cookie);
      if (blocked) return;
      const [pair = "", ...attributes] = cookie.split(";").map((part) => part.trim());
      const split = pair.indexOf("=");
      const name = pair.slice(0, split);
      const value = pair.slice(split + 1);
      const expired = attributes.some((attribute) => /^max-age=(0|-\d+)$/i.test(attribute));
      if (expired) cookies.delete(name);
      else cookies.set(name, value);
    },
  };
}

/** The value of one cookie in a `document.cookie` string. */
export function readCookie(all: string, name: string): string | undefined {
  for (const part of all.split(";")) {
    const pair = part.trim();
    if (pair.startsWith(`${name}=`)) return pair.slice(name.length + 1);
  }
  return undefined;
}

function cookieNames(all: string): string[] {
  return all
    .split(";")
    .map((part) => part.trim().split("=")[0] ?? "")
    .filter(Boolean);
}

export type ConsentStatus = "unknown" | "undecided" | "decided";

/** What React sees. The same object for as long as nothing changed. */
export type ConsentSnapshot = {
  /** `unknown` on the server and before the cookie was read in the browser. */
  status: ConsentStatus;
  /** The answer, once given. */
  record?: ConsentRecord;
  /** Services loaded once in this document ("Einmal laden"), not stored. */
  session: ReadonlySet<string>;
};

/** What changed with a decision, for `onChange`. */
export type ConsentChange = {
  /** Services granted now that were not before. */
  granted: string[];
  /** Services that were granted and are not anymore. */
  revoked: string[];
  /** The first read of a stored answer when the page loads, not a decision. */
  initial: boolean;
};

export type ConsentStoreOptions = {
  jar?: ConsentJar;
  /**
   * Also stores the cookie's value somewhere script cannot reach on its own, typically a Server
   * Action that sets the same cookie in its response. Safari keeps cookies written by script for
   * at most seven days; one set by the server lasts `maxAge`.
   */
  persist?: (value: string, maxAgeSeconds: number) => void | Promise<void>;
  onChange?: (record: ConsentRecord, change: ConsentChange) => void;
  /** The clock, for tests. */
  now?: () => number;
  /** `window.location`, for tests. */
  location?: Pick<Location, "hostname" | "protocol" | "reload">;
};

export type ConsentDecision = {
  record: ConsentRecord;
  change: ConsentChange;
  /**
   * Whether the page should be loaded again: a revoked service had its script run in this
   * document (through a `ConsentGate`), and a script that ran cannot be taken back.
   */
  reload: boolean;
};

export type ConsentStore = ReturnType<typeof createConsentStore>;

const unknown: ConsentSnapshot = { status: "unknown", session: new Set() };

/** The host and each domain above it, for deleting a cookie whose domain is not known. */
function domainVariants(hostname: string): (string | undefined)[] {
  const isAddress = /^[\d.]+$/.test(hostname) || hostname.includes(":");
  if (isAddress || !hostname.includes(".")) return [undefined];
  const labels = hostname.split(".");
  const domains = labels.slice(0, -1).map((_, index) => labels.slice(index).join("."));
  return [undefined, ...domains];
}

export function createConsentStore(config: ConsentConfig, options: ConsentStoreOptions = {}) {
  const jar = options.jar ?? documentJar;
  const now = options.now ?? Date.now;
  const location = () => options.location ?? window.location;
  const name = config.cookieName ?? defaultCookieName;
  const maxAgeSeconds = (config.maxAgeDays ?? defaultMaxAgeDays) * 86_400;
  const services = consentServices(config);

  let onChange = options.onChange;
  let persist = options.persist;
  const listeners = new Set<() => void>();
  /** The answer, when the cookie could not be written. */
  let memory: ConsentRecord | undefined;
  let session = new Set<string>();
  /** Services whose script a `ConsentGate` has rendered in this document. */
  const rendered = new Set<string>();
  /** Counts the changes the cookie does not show: the answer in memory, the session grants. */
  let version = 0;
  let cache: { raw: string | undefined; version: number; snapshot: ConsentSnapshot } | undefined;
  /** The snapshot the listeners last heard of. */
  let announced: ConsentSnapshot | undefined;

  function read(): string | undefined {
    try {
      return readCookie(jar.read(), name);
    } catch {
      return undefined;
    }
  }

  function getSnapshot(): ConsentSnapshot {
    const raw = read();
    if (cache && cache.raw === raw && cache.version === version) return cache.snapshot;
    const record = memory ?? parseConsent(raw, config, now());
    const snapshot: ConsentSnapshot = {
      status: record ? "decided" : "undecided",
      record,
      session,
    };
    cache = { raw, version, snapshot };
    return snapshot;
  }

  function notify() {
    announced = getSnapshot();
    for (const listener of listeners) listener();
  }

  function secure(cookieName: string) {
    const https = location().protocol === "https:";
    return https || cookieName.startsWith("__Secure-") || cookieName.startsWith("__Host-")
      ? "; Secure"
      : "";
  }

  function write(value: string, maxAge: number) {
    const domain = config.cookieDomain ? `; Domain=${config.cookieDomain}` : "";
    try {
      jar.write(
        `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domain}${secure(name)}`,
      );
    } catch {
      // Cookies are off: the answer stays in memory.
    }
  }

  /** Deletes what a service stored on this site. Its own cookies on other domains are out of reach. */
  function forget(serviceId: string) {
    const service = services.get(serviceId);
    for (const entry of service?.storage ?? []) {
      const kind = entry.kind ?? "cookie";
      if (kind === "cookie") {
        let all = "";
        try {
          all = jar.read();
        } catch {
          continue;
        }
        const names = entry.name.endsWith("*")
          ? cookieNames(all).filter((cookie) => storageMatches(entry.name, cookie))
          : [entry.name];
        for (const cookie of names) {
          const variants = cookie.startsWith("__Host-")
            ? [undefined]
            : domainVariants(location().hostname);
          for (const domain of variants) {
            try {
              jar.write(
                `${cookie}=; Path=/; Max-Age=0${domain ? `; Domain=${domain}` : ""}${secure(cookie)}`,
              );
            } catch {
              // Nothing to delete where nothing can be written.
            }
          }
        }
      } else {
        try {
          const storage = kind === "local" ? window.localStorage : window.sessionStorage;
          const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
          for (const key of keys) {
            if (key !== null && storageMatches(entry.name, key)) storage.removeItem(key);
          }
        } catch {
          // No storage, nothing stored.
        }
      }
    }
  }

  function diff(before: ConsentSnapshot | undefined, after: ConsentSnapshot): ConsentChange {
    const was = new Set(before?.record?.granted);
    const is = new Set(after.record?.granted);
    return {
      granted: [...is].filter((id) => !was.has(id)),
      revoked: [...was].filter((id) => !is.has(id)),
      initial: false,
    };
  }

  /** Reads the cookie again: another tab may have answered, or the page came back from the cache. */
  function refresh() {
    const before = announced;
    const after = getSnapshot();
    if (after === before) return;
    const change = diff(before, after);
    const changed = change.granted.length > 0 || change.revoked.length > 0;
    notify();
    if (after.record && changed) onChange?.(after.record, change);
    if (change.revoked.some((id) => rendered.has(id))) location().reload();
  }

  const onVisible = () => {
    if (document.visibilityState === "visible") refresh();
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== "undefined") {
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("pageshow", refresh);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          document.removeEventListener("visibilitychange", onVisible);
          window.removeEventListener("pageshow", refresh);
        }
      };
    },

    getSnapshot,

    getServerSnapshot: () => unknown,

    /** Tells `onChange` about a stored answer once the page has loaded. */
    announce() {
      const snapshot = getSnapshot();
      announced = snapshot;
      if (snapshot.record) {
        onChange?.(snapshot.record, {
          granted: [...snapshot.record.granted],
          revoked: [],
          initial: true,
        });
      }
    },

    setOnChange(handler: ConsentStoreOptions["onChange"]) {
      onChange = handler;
    },

    setPersist(handler: ConsentStoreOptions["persist"]) {
      persist = handler;
    },

    /** Stores an answer: exactly these services are granted, every other one is not. */
    decide(grantedIds: Iterable<string>): ConsentDecision {
      const before = getSnapshot();
      const granted = [...new Set(grantedIds)].filter((id) => services.has(id));
      const record: ConsentRecord = { revision: config.revision, decidedAt: now(), granted };
      const value = encodeConsent(record, config);
      write(value, maxAgeSeconds);
      memory = read() === value ? undefined : record;
      version++;
      if (persist) {
        const store = persist;
        Promise.resolve()
          .then(() => store(value, maxAgeSeconds))
          .catch(() => {
            // The cookie written by script still holds the answer.
          });
      }
      // A service loaded once and not granted now is refused with the rest.
      const dropped = [...session].filter((id) => !granted.includes(id));
      if (dropped.length) session = new Set([...session].filter((id) => granted.includes(id)));
      const after = getSnapshot();
      const change = diff(before, after);
      for (const id of new Set([...change.revoked, ...dropped])) forget(id);
      const reload = [...change.revoked, ...dropped].some((id) => rendered.has(id));
      notify();
      onChange?.(record, change);
      return { record, change, reload };
    },

    /** Loads a service once, for this document only. */
    grantOnce(serviceId: string) {
      if (!services.has(serviceId) || session.has(serviceId)) return;
      session = new Set([...session, serviceId]);
      version++;
      notify();
    },

    /** Notes that a service's content ran in this document, so revoking it reloads the page. */
    markRendered(serviceIds: Iterable<string>) {
      for (const id of serviceIds) rendered.add(id);
    },

    /** Removes the answer (for tests and previews): the reader is asked again. */
    reset() {
      memory = undefined;
      session = new Set();
      version++;
      write("", 0);
      notify();
    },
  };
}
