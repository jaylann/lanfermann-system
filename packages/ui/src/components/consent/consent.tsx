"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useGround } from "@/components/ground/ground";
import { linkVariants } from "@/components/link/link-variants";
import { cn, mergeClassName } from "@/lib/cn";

import { ConsentCard, type ConsentView } from "./consent-card";
import { type ConsentLabels, consentLabels } from "./consent-labels";
import {
  consentAllows,
  type ConsentConfig,
  consentConfigProblems,
  consentFingerprint,
  type ConsentRecord,
} from "./consent-record";
import {
  type ConsentChange,
  type ConsentJar,
  type ConsentSnapshot,
  type ConsentStatus,
  type ConsentStore,
  createConsentStore,
} from "./consent-store";

type ConsentContextValue = {
  config: ConsentConfig;
  labels: ConsentLabels;
  store: ConsentStore;
  snapshot: ConsentSnapshot;
  handle: DialogPrimitive.Handle<unknown>;
  /** Whether the banner is on screen. */
  open: boolean;
  allows: (id: string) => boolean;
  decide: (granted: string[]) => void;
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsentContext(part: string) {
  const context = use(ConsentContext);
  if (!context) throw new Error(`${part} must be placed inside a ConsentProvider.`);
  return context;
}

export type ConsentProviderProps = {
  /** The services the site asks about. See `ConsentConfig`. */
  config: ConsentConfig;
  /** The site's privacy policy. The banner links to it, and must never cover the way there. */
  privacyHref: string;
  /** The site's imprint. */
  imprintHref: string;
  /**
   * What the services do, in the site's own words: concrete purposes, not „ein besseres
   * Erlebnis“ (Rn. 53). `labels.intro` unless given.
   */
  intro?: ReactNode;
  /** Any of the strings, in place of the German defaults (`consentLabels`). */
  labels?: Partial<ConsentLabels>;
  /**
   * Called when the answer changes, and once on load with a stored answer (`initial`): the place
   * to update Google Consent Mode or log the decision. A function cannot cross from a Server
   * Component; pass it from a small client component that renders the provider.
   */
  onChange?: (record: ConsentRecord, change: ConsentChange) => void;
  /**
   * Also stores the cookie from the server, typically through a Server Action that sets the same
   * cookie. Safari keeps cookies written by script for at most seven days.
   */
  persist?: (value: string, maxAgeSeconds: number) => void | Promise<void>;
  /** Where the answer is kept: the page's cookies unless a test or a preview passes its own. */
  jar?: ConsentJar;
  children?: ReactNode;
};

/**
 * Asks for consent before any service that stores or reads data in the browser is loaded, and
 * keeps the answer. Put it once around the app, in the root layout; it renders the banner
 * itself. On the first visit the banner stands at the foot of the window without covering the
 * page: „Alle ablehnen“ and „Alle akzeptieren“ side by side, equal in every way, and the
 * settings one step away in the same card. Gate what needs consent with `ConsentGate` or
 * `ConsentEmbed`, and put a `ConsentSettingsTrigger` in the footer of every page so the answer
 * can be changed as easily as it was given.
 *
 * It frames the legal requirements (DSK, OH Digitale Dienste; § 25 TDDDG); the site still states
 * its services truthfully in `config` and in its privacy policy.
 */
export function ConsentProvider({
  config,
  privacyHref,
  imprintHref,
  intro,
  labels,
  onChange,
  persist,
  jar,
  children,
}: ConsentProviderProps) {
  // A new store only when what is asked changes; a config written inline is a new object on
  // every render and must not start over.
  const key = `${consentFingerprint(config)}|${config.cookieName ?? ""}|${config.maxAgeDays ?? ""}`;
  const [current, setCurrent] = useState(() => ({
    key,
    jar,
    store: createConsentStore(config, { jar }),
  }));
  if (current.key !== key || current.jar !== jar) {
    setCurrent({ key, jar, store: createConsentStore(config, { jar }) });
  }
  const { store } = current;
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const latest = useRef({ onChange, persist });
  useEffect(() => {
    latest.current = { onChange, persist };
  });
  useEffect(() => {
    store.setOnChange((record, change) => latest.current.onChange?.(record, change));
    store.setPersist((value, maxAge) => latest.current.persist?.(value, maxAge));
    store.announce();
  }, [store]);

  useEffect(() => {
    for (const problem of consentConfigProblems(config)) console.error(problem);
    // Checked once per set of services, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [handle] = useState(() => DialogPrimitive.createHandle<unknown>());
  const [panel, setPanel] = useState<{ open: boolean; triggerId: string | null }>({
    open: false,
    triggerId: null,
  });
  /** The card stays a moment after a decision in the settings, while its switches settle. */
  const [holding, setHolding] = useState(false);
  const reloadAfterClose = useRef(false);

  /**
   * The banner waits one frame after mounting. Hydrated from the server it would open after
   * hydration anyway; mounted in the browser it would otherwise be open from its first frame and
   * arrive without its entrance.
   */
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArrived(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const merged = useMemo(() => ({ ...consentLabels, ...labels }), [labels]);
  const undecided = snapshot.status === "undecided";
  const open = arrived && (undecided || panel.open || holding);

  const allows = useCallback(
    (id: string) => {
      if (snapshot.status === "unknown") return false;
      const category = config.categories.find((entry) => entry.id === id);
      const ids = category ? category.services.map((service) => service.id) : [id];
      const granted = [...(snapshot.record?.granted ?? []), ...snapshot.session];
      return (
        consentAllows({ granted }, id, config) ||
        (ids.length > 0 && ids.every((each) => snapshot.session.has(each)))
      );
    },
    [config, snapshot],
  );

  const decide = useCallback(
    (granted: string[], hold = 0) => {
      const { reload } = store.decide(granted);
      setPanel((previous) => ({ ...previous, open: false }));
      if (hold > 0) {
        setHolding(true);
        window.setTimeout(() => setHolding(false), hold);
      }
      // A script that ran cannot be taken back: the page loads again once the card has left.
      if (reload) {
        if (open) reloadAfterClose.current = true;
        else window.location.reload();
      }
    },
    [store, open],
  );

  const openSettings = useCallback(() => setPanel({ open: true, triggerId: null }), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      config,
      labels: merged,
      store,
      snapshot,
      handle,
      open,
      allows,
      decide: (granted) => decide(granted),
      openSettings,
    }),
    [config, merged, store, snapshot, handle, open, allows, decide, openSettings],
  );

  // The views the card opens with: the first layer while undecided, the settings when the
  // answer is changed. Counted, so the card starts fresh each time it opens.
  const [opening, setOpening] = useState<{ count: number; view: ConsentView; revisiting: boolean }>(
    { count: 0, view: "intro", revisiting: false },
  );
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOpening({
        count: opening.count + 1,
        view: undecided ? "intro" : "settings",
        revisiting: !undecided,
      });
    }
  }

  return (
    <ConsentContext value={value}>
      {children}
      <DialogPrimitive.Root
        handle={handle}
        open={open}
        triggerId={panel.triggerId}
        modal={false}
        // While undecided, nothing but an answer closes the banner; a click on the page or
        // focus moving on is not one.
        disablePointerDismissal={undecided || holding}
        onOpenChange={(next, details) => {
          if (next) {
            setPanel({ open: true, triggerId: details.trigger?.id ?? null });
          } else if (undecided || holding) {
            // Escape is no answer either. The page still hears the key.
            details.cancel();
            details.allowPropagation();
          } else {
            setPanel((previous) => ({ ...previous, open: false }));
          }
        }}
        onOpenChangeComplete={(isOpen) => {
          if (!isOpen && reloadAfterClose.current) window.location.reload();
        }}
      >
        <ConsentBanner
          key={opening.count}
          config={config}
          labels={merged}
          intro={intro}
          privacyHref={privacyHref}
          imprintHref={imprintHref}
          granted={snapshot.record?.granted ?? []}
          defaultView={opening.view}
          revisiting={opening.revisiting}
          onDecide={decide}
          onClose={() => setPanel((previous) => ({ ...previous, open: false }))}
        />
      </DialogPrimitive.Root>
    </ConsentContext>
  );
}

type ConsentBannerProps = {
  config: ConsentConfig;
  labels: ConsentLabels;
  intro?: ReactNode;
  privacyHref: string;
  imprintHref: string;
  granted: readonly string[];
  defaultView: ConsentView;
  revisiting: boolean;
  onDecide: (granted: string[], hold: number) => void;
  onClose: () => void;
};

function DialogTitle(props: { className?: string; children?: ReactNode }) {
  return <DialogPrimitive.Title {...props} />;
}
function DialogDescription(props: { className?: string; children?: ReactNode }) {
  return <DialogPrimitive.Description {...props} />;
}

/** The card at the foot of the window, in a dialog that does not take the page away. */
function ConsentBanner({ defaultView, ...card }: ConsentBannerProps) {
  const pageGround = useGround();
  const popup = useRef<HTMLDivElement | null>(null);

  // While the card stands, what the keyboard focuses on the page is scrolled clear of it
  // (WCAG 2.4.11). Set up when the popup mounts, and taken back when it leaves. The card's size
  // changes only at the end of a transition (its height, a panel inside) or with the window.
  // (Not a ResizeObserver: `Grow` sizes the card from inside one, and a second one on the card
  // would end each change in an undelivered-notifications error.)
  const watch = useCallback((element: HTMLDivElement | null) => {
    popup.current = element;
    if (!element) return;
    const root = document.documentElement;
    const before = root.style.scrollPaddingBottom;
    const update = () => {
      const fromBottom = window.innerHeight - element.getBoundingClientRect().top;
      root.style.scrollPaddingBottom = `${Math.max(0, fromBottom) + 16}px`;
    };
    const frame = requestAnimationFrame(update);
    element.addEventListener("transitionend", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("transitionend", update);
      window.removeEventListener("resize", update);
      root.style.scrollPaddingBottom = before;
      popup.current = null;
    };
  }, []);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Viewport data-slot="consent-anchor" className={consentAnchor}>
        <DialogPrimitive.Popup
          ref={watch}
          data-slot="consent-banner"
          data-theme={pageGround}
          // First visit: the card itself, not a button (that would lean towards an answer).
          // Changing an answer: the settings' title.
          initialFocus={() =>
            (defaultView === "settings"
              ? popup.current?.querySelector<HTMLElement>('[data-slot="consent-settings-title"]')
              : popup.current) ?? true
          }
          className={consentSurface}
        >
          <ConsentCard
            {...card}
            defaultView={defaultView}
            Title={DialogTitle}
            Description={DialogDescription}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

/**
 * Where the card stands: a line at the foot of the window, with no height and no colour. On a
 * phone it spans the width above the home indicator; on a wider window it is the card's width in
 * the bottom right corner.
 *
 * Safari 26 paints its toolbar in the background colour of a fixed layer it finds at the
 * window's foot, and keeps the toolbar out while one stands there (Justin's iPhone, 2026-11-18:
 * the bar came back, white). It passes over what a fixed layer holds in absolute position, so
 * the fixed part here is this empty line and the card stands on it (`consentSurface`).
 */
export const consentAnchor = cn(
  "fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 h-0",
  "sm:right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:left-auto sm:w-108",
);

/**
 * The card: a sheet on the page's ground (white on a light page, dark on a dark one), standing on
 * `consentAnchor` and growing upwards. It rises 8px into place on `sheet` and leaves by fading.
 */
export const consentSurface = cn(
  "absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-1rem)] flex-col",
  "rounded-2xl bg-sheet p-5 text-fg-body depth-floating outline-hidden contain-layout",
  "transition-[opacity,scale,translate] spring-sheet",
  "data-starting-style:translate-y-2 data-starting-style:scale-(--motion-enter-scale) data-starting-style:opacity-0",
  "data-ending-style:opacity-0 data-ending-style:spring-leave",
);

export type UseConsentResult = {
  /** `unknown` until the browser has read the cookie, then `undecided` or `decided`. */
  status: ConsentStatus;
  /** The stored answer, once there is one. */
  record?: ConsentRecord;
  /** Whether a service or a category (all of its services) may run. */
  allows: (id: string) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  /** Stores exactly these services as granted. */
  save: (granted: string[]) => void;
  /** Opens the banner on its settings. */
  openSettings: () => void;
};

/** The answer, and the ways to change it, for code that loads a script itself. */
export function useConsent(): UseConsentResult {
  const context = useConsentContext("useConsent");
  const { config, snapshot, allows, decide, openSettings } = context;
  return {
    status: snapshot.status,
    record: snapshot.record,
    allows,
    acceptAll: () =>
      decide(config.categories.flatMap((category) => category.services.map((s) => s.id))),
    rejectAll: () => decide([]),
    save: decide,
    openSettings,
  };
}

export type ConsentGateProps = {
  /** The service whose consent the content needs. */
  service?: string;
  /** Or a category, when the content needs all of its services. */
  category?: string;
  /** What stands in its place without consent. Nothing unless given. */
  fallback?: ReactNode;
  children?: ReactNode;
};

/**
 * Renders what needs consent (a script, a pixel, an embed) only once it is given, and never on
 * the server. Revoking a service whose content ran here loads the page again, since a script
 * cannot be taken back.
 */
export function ConsentGate({ service, category, fallback = null, children }: ConsentGateProps) {
  const { allows, store, config } = useConsentContext("ConsentGate");
  const id = service ?? category ?? "";
  const allowed = allows(id);
  useEffect(() => {
    if (!allowed) return;
    const entry = config.categories.find((each) => each.id === id);
    store.markRendered(entry ? entry.services.map((each) => each.id) : [id]);
  }, [allowed, config, id, store]);
  return allowed ? children : fallback;
}

export type ConsentSettingsTriggerProps = DialogPrimitive.Trigger.Props;

/**
 * Opens the banner on its settings, so an answer can be changed as easily as it was given
 * (Art. 7 (3) GDPR; Rn. 62). Put it among the legal links in the footer of every page. It is
 * dressed like those links; in a `SiteFooter`, pass `siteFooterLinkClass`, whose underline waits
 * for the pointer.
 */
export function ConsentSettingsTrigger({
  id,
  className,
  children,
  ...props
}: ConsentSettingsTriggerProps) {
  const { handle, labels } = useConsentContext("ConsentSettingsTrigger");
  const ownId = useId();
  return (
    <DialogPrimitive.Trigger
      handle={handle}
      id={id ?? ownId}
      data-slot="consent-trigger"
      className={mergeClassName([linkVariants({ variant: "quiet" }), "text-left"], className)}
      {...props}
    >
      {children ?? labels.trigger}
    </DialogPrimitive.Trigger>
  );
}
