"use client";

import {
  type ComponentType,
  type CSSProperties,
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/collapsible/collapsible";
import { Grow } from "@/components/grow/grow";
import { linkVariants } from "@/components/link/link-variants";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { Switch } from "@/components/switch/switch";
import { ChevronLeftGlyph, CloseGlyph } from "@/internal/glyphs";
import { useReducedMotion } from "@/internal/reduced-motion";
import { cn } from "@/lib/cn";

import type { ConsentLabels } from "./consent-labels";
import {
  type ConsentConfig,
  type ConsentService,
  consentSummary,
  defaultCookieName,
  defaultMaxAgeDays,
} from "./consent-record";

export type ConsentView = "intro" | "settings";

/** How long the switches take to flip before the card leaves: the `seat` spring's visible part. */
const flipMs = 300;
const flipStaggerMs = 25;

type TextSlot = ComponentType<{ className?: string; children?: ReactNode; id?: string }>;

export type ConsentCardProps = {
  config: ConsentConfig;
  labels: ConsentLabels;
  /** What the services do, in the site's words. `labels.intro` unless given. */
  intro?: ReactNode;
  privacyHref: string;
  imprintHref: string;
  /** The services granted so far: where the switches start. */
  granted: readonly string[];
  /** The view the card opens with. */
  defaultView?: ConsentView;
  /** The card was opened to change an answer: the settings close instead of going back. */
  revisiting?: boolean;
  /**
   * The reader decided. `hold` is how long the card should stay to show the switches settling
   * (0 when it may leave at once).
   */
  onDecide: (granted: string[], hold: number) => void;
  /** Leaves the settings without a change (only when `revisiting`). */
  onClose?: () => void;
  /** The title and the description, so a dialog can name itself by them. */
  Title?: TextSlot;
  Description?: TextSlot;
};

const PlainTitle: TextSlot = (props) => <h2 {...props} />;
const PlainDescription: TextSlot = (props) => <p {...props} />;

/**
 * The content of the consent banner: the first layer, the settings, and the decisions under
 * both. The two views stand in one place and the card's height follows the one shown (`Grow`);
 * the row of decisions under them never moves. Used by `ConsentProvider` inside its dialog, and
 * on its own in the workshop.
 */
export function ConsentCard({
  config,
  labels,
  intro,
  privacyHref,
  imprintHref,
  granted,
  defaultView = "intro",
  revisiting = false,
  onDecide,
  onClose,
  Title = PlainTitle,
  Description = PlainDescription,
}: ConsentCardProps) {
  const [view, setView] = useState<ConsentView>(defaultView);
  const [draft, setDraft] = useState(() => new Set(granted));
  const [flipping, setFlipping] = useState(false);
  const reduced = useReducedMotion();
  const settingsTitle = useRef<HTMLHeadingElement>(null);
  const third = useRef<HTMLButtonElement>(null);
  /** When the views last swapped: the button that swapped them ignores presses until then. */
  const swappedAt = useRef(Number.NEGATIVE_INFINITY);
  const focusedView = useRef(view);

  const all = useMemo(
    () => config.categories.flatMap((category) => category.services.map((service) => service.id)),
    [config],
  );

  // Focus follows the view, so a screen reader hears where it is; not on the first render. (The
  // view is compared, not a first run counted: Strict Mode runs the effect twice on mount.)
  useEffect(() => {
    if (focusedView.current === view) return;
    focusedView.current = view;
    if (view === "settings") settingsTitle.current?.focus({ preventScroll: true });
    else third.current?.focus({ preventScroll: true });
  }, [view]);

  const swap = (next: ConsentView) => {
    swappedAt.current = performance.now();
    setView(next);
  };

  const decide = (ids: string[]) => {
    if (view === "settings" && !reduced) {
      // The switches show what was chosen, then the card leaves.
      setDraft(new Set(ids));
      setFlipping(true);
      onDecide(ids, flipMs + flipStaggerMs * config.categories.length);
    } else {
      onDecide(ids, 0);
    }
  };

  const pressThird = () => {
    // A double click on „Einstellungen“ must not save what the reader has not seen.
    if (performance.now() - swappedAt.current < 400) return;
    if (view === "intro") swap("settings");
    else onDecide([...draft], 0);
  };

  const summary = consentSummary(config);
  const essentialServices = [consentService(config, labels), ...(config.essential ?? [])];

  return (
    <div
      data-slot="consent-card"
      data-view={view}
      data-flipping={flipping || undefined}
      className="flex min-h-0 flex-col"
    >
      <Grow className="min-h-0 shrink">
        <div className="relative">
          <section
            data-slot="consent-view"
            data-active={view === "intro"}
            data-side="start"
            inert={view !== "intro"}
            className="flex flex-col gap-3"
          >
            <Title className="pr-2 text-base leading-snug font-semibold text-balance text-fg">
              {labels.title}
            </Title>
            <ScrollFade
              edges="end"
              className="-mx-1 flex max-h-[calc(100dvh-15rem)] flex-col gap-2 px-1 text-sm text-fg-body"
            >
              <Description>{intro ?? labels.intro}</Description>
              <dl
                data-slot="consent-facts"
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-line py-2.5"
              >
                {labels.facts(summary).map((fact) => (
                  <Fragment key={fact.term}>
                    <dt className="text-fg-muted">{fact.term}</dt>
                    <dd className="text-fg">{fact.value}</dd>
                  </Fragment>
                ))}
              </dl>
              <p className="text-fg-muted">{labels.withdraw}</p>
            </ScrollFade>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
              <a href={privacyHref} className={linkVariants({ variant: "quiet" })}>
                {labels.privacy}
              </a>
              <a href={imprintHref} className={linkVariants({ variant: "quiet" })}>
                {labels.imprint}
              </a>
            </p>
          </section>

          <section
            data-slot="consent-view"
            data-active={view === "settings"}
            data-side="end"
            inert={view !== "settings"}
            className="flex flex-col gap-2"
          >
            <div className="-ml-1.5 flex min-h-(--control-sm) items-center gap-1">
              {!revisiting && (
                <Button
                  variant="quiet"
                  size="sm"
                  iconOnly
                  aria-label={labels.back}
                  className="text-fg-muted"
                  onClick={() => swap("intro")}
                >
                  <ChevronLeftGlyph />
                </Button>
              )}
              <h2
                ref={settingsTitle}
                tabIndex={-1}
                data-slot="consent-settings-title"
                // Focus is put here so a screen reader names the view; it is no control, so it
                // wears no ring (forced colours still draw one: `outline-hidden`).
                className={cn(
                  "text-base leading-snug font-semibold text-fg focus:outline-hidden",
                  revisiting && "pl-1.5",
                )}
              >
                {labels.settingsTitle}
              </h2>
              {revisiting && (
                <Button
                  variant="quiet"
                  size="sm"
                  iconOnly
                  aria-label={labels.close}
                  className="ml-auto text-fg-muted"
                  onClick={onClose}
                >
                  <CloseGlyph />
                </Button>
              )}
            </div>
            <ScrollFade className="-mx-5 max-h-[min(30rem,calc(100dvh-14rem))] px-5">
              <ul className="flex flex-col">
                <CategoryRow
                  labels={labels}
                  name={labels.essentialName}
                  description={labels.essentialDescription}
                  services={essentialServices}
                  essential
                  draft={draft}
                  setDraft={setDraft}
                  index={0}
                />
                {config.categories.map((category, index) => (
                  <CategoryRow
                    key={category.id}
                    labels={labels}
                    name={category.name}
                    description={category.description}
                    services={category.services}
                    draft={draft}
                    setDraft={setDraft}
                    index={index}
                  />
                ))}
              </ul>
              <p className="pt-2 pb-1 text-sm text-fg-muted">{labels.withdrawEffect}</p>
            </ScrollFade>
          </section>
        </div>
      </Grow>

      <div data-slot="consent-footer" className="grid shrink-0 grid-cols-2 gap-2 pt-4">
        <Button onClick={() => decide([])}>{labels.rejectAll}</Button>
        <Button onClick={() => decide(all)}>{labels.acceptAll}</Button>
        <Button
          ref={third}
          variant={view === "intro" ? "quiet" : "secondary"}
          className="col-span-2"
          onClick={pressThird}
        >
          <span className="grid">
            <span
              data-slot="consent-third-label"
              data-active={view === "intro"}
              aria-hidden={view !== "intro" || undefined}
            >
              {labels.settings}
            </span>
            <span
              data-slot="consent-third-label"
              data-active={view === "settings"}
              aria-hidden={view !== "settings" || undefined}
            >
              {labels.save}
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}

/** The consent cookie itself, listed under the essential category (Rn. 37: every storage). */
function consentService(config: ConsentConfig, labels: ConsentLabels): ConsentService {
  return {
    id: "consent",
    name: labels.consentServiceName,
    provider: labels.consentServiceProvider,
    purpose: labels.consentServicePurpose,
    profiling: false,
    storage: [
      {
        name: config.cookieName ?? defaultCookieName,
        duration: labels.duration(config.maxAgeDays ?? defaultMaxAgeDays),
      },
    ],
  };
}

type CategoryRowProps = {
  labels: ConsentLabels;
  name: string;
  description: string;
  services: ConsentService[];
  essential?: boolean;
  draft: Set<string>;
  setDraft: (next: Set<string>) => void;
  /** Its place among the switches, for the stagger when they all flip at once. */
  index: number;
};

/** A purpose: its switch, what it is for, and its services folded under it. */
function CategoryRow({
  labels,
  name,
  description,
  services,
  essential = false,
  draft,
  setDraft,
  index,
}: CategoryRowProps) {
  const descriptionId = useId();
  const on = services.filter((service) => draft.has(service.id)).length;
  const mixed = on > 0 && on < services.length;
  const set = (ids: string[], checked: boolean) => {
    const next = new Set(draft);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    setDraft(next);
  };

  return (
    <li
      data-slot="consent-category"
      className="flex flex-col gap-1 border-t border-line py-3 first:border-t-0 first:pt-1"
    >
      {essential ? (
        <div className="flex min-h-(--switch-h) items-center justify-between gap-3">
          <span className="text-control font-medium text-fg">{name}</span>
          <span className="text-sm text-fg-muted">{labels.alwaysOn}</span>
        </div>
      ) : (
        <label className="flex items-center justify-between gap-3">
          <span className="text-control font-medium text-fg">{name}</span>
          <span className="flex items-center gap-2">
            {mixed && (
              <span className="text-sm text-fg-muted tabular-nums">
                {labels.mixed(on, services.length)}
              </span>
            )}
            <Switch
              // A category without services has nothing to grant: it must not stand as switched on.
              checked={services.length > 0 && on === services.length}
              onCheckedChange={(checked) =>
                set(
                  services.map((service) => service.id),
                  checked,
                )
              }
              aria-describedby={descriptionId}
              style={{ "--flip-index": index } as CSSProperties}
            />
          </span>
        </label>
      )}
      <p id={descriptionId} className="text-sm text-fg-muted">
        {description}
      </p>
      <Collapsible className="mt-0.5">
        <CollapsibleTrigger className="text-sm font-normal text-fg-body">
          {labels.services(services.length)}
        </CollapsibleTrigger>
        <CollapsiblePanel className="w-full">
          <ul className="flex flex-col gap-2">
            {services.map((service) => (
              <ServiceFacts
                key={service.id}
                labels={labels}
                service={service}
                // One service is switched by its category; several each have their own.
                toggle={
                  !essential && services.length > 1
                    ? {
                        checked: draft.has(service.id),
                        onChange: (checked) => set([service.id], checked),
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        </CollapsiblePanel>
      </Collapsible>
    </li>
  );
}

type ServiceFactsProps = {
  labels: ConsentLabels;
  service: ConsentService;
  toggle?: { checked: boolean; onChange: (checked: boolean) => void };
};

/** Who runs a service, what for, what it stores, where the data goes. */
function ServiceFacts({ labels, service, toggle }: ServiceFactsProps) {
  const heading = (
    <span className="flex min-w-0 flex-col">
      <span className="text-sm font-medium text-fg">{service.name}</span>
      <span className="text-sm text-fg-muted">{service.provider}</span>
    </span>
  );
  return (
    <li
      data-slot="consent-service"
      className="flex flex-col gap-1.5 rounded-lg bg-well px-3 py-2.5 text-sm"
    >
      {toggle ? (
        <label className="flex items-start justify-between gap-3">
          {heading}
          <Switch checked={toggle.checked} onCheckedChange={toggle.onChange} />
        </label>
      ) : (
        heading
      )}
      <p className="text-fg-body">{service.purpose}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        {service.storage?.length ? (
          <>
            <dt className="text-fg-muted">{labels.stored}</dt>
            <dd className="min-w-0 text-fg-body">
              {service.storage.map((entry) => (
                // A service may keep the same name as a cookie and in local storage.
                <span key={`${entry.kind ?? "cookie"}:${entry.name}`} className="block">
                  <code className="font-mono text-[0.9em] break-all">{entry.name}</code>
                  {` (${labels.storageKind[entry.kind ?? "cookie"]}, ${entry.duration})`}
                </span>
              ))}
            </dd>
          </>
        ) : null}
        {service.thirdCountry && (
          <>
            <dt className="text-fg-muted">{labels.thirdCountry}</dt>
            <dd className="text-fg-body">{service.thirdCountry}</dd>
          </>
        )}
      </dl>
      {service.profiling && <p className="text-fg-muted">{labels.profiling}</p>}
      {service.privacyUrl && (
        <a
          href={service.privacyUrl}
          className={cn(linkVariants({ variant: "quiet" }), "self-start text-fg-muted")}
          target={service.privacyUrl.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {labels.privacyPolicy}
        </a>
      )}
    </li>
  );
}
