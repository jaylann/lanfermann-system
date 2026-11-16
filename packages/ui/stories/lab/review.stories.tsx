import {
  Invoice01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/button/button";
import { buttonVariants } from "@/components/button/button-variants";
import { Wordmark } from "@/components/logo/wordmark";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/navigation-menu/navigation-menu";
import { Shimmer } from "@/components/shimmer/shimmer";
import {
  SiteHeader,
  SiteHeaderActions,
  SiteHeaderBrand,
} from "@/components/site-header/site-header";
import { Trace, type TraceStatus, TraceStep, TraceSummary } from "@/components/trace/trace";
import { cn } from "@/lib/cn";

/**
 * The open picks of the review round of 2026-11-16, each as its options side by side at real
 * size. Lab boards are not part of the library: they are left out of the pictures and go when
 * the picks are made.
 */
const meta = {
  title: "Lab/Review 2026-11-16",
  tags: ["visual-skip"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One option of a pick: what it is, above what it looks like. */
function Option({
  name,
  note,
  className,
  children,
}: {
  name: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    // A section, so a bar inside it is no second banner of the page.
    <section aria-label={name} className={cn("flex flex-col gap-3", className)}>
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-fg">{name}</span>
        {note && <span className="text-fg-muted">{note}</span>}
      </p>
      {children}
    </section>
  );
}

const barHeights = [
  { name: "48 px", note: "gebaut: 8 px um ein Bedienelement", height: "" },
  { name: "52 px", note: "zum Vergleich", height: "*:data-[slot=site-header-bar]:h-13" },
  { name: "56 px", note: "wie bisher", height: "*:data-[slot=site-header-bar]:h-14" },
];

/** How tall the site's bar is. It was 56px; 48 is built. */
export const BarHeight: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex flex-col gap-10 py-8">
      {barHeights.map((bar) => (
        <Option key={bar.name} name={bar.name} note={bar.note} className="*:first:px-8">
          <SiteHeader sticky={false} className={cn("mt-0", bar.height)}>
            <SiteHeaderBrand href="#start" aria-label={`Lanfermann, zur Startseite (${bar.name})`}>
              <Wordmark size={20} />
            </SiteHeaderBrand>
            <NavigationMenu aria-label={`Hauptnavigation (${bar.name})`}>
              <NavigationMenuList>
                {["Leistungen", "Preise", "Über mich"].map((page) => (
                  <NavigationMenuItem key={page}>
                    <NavigationMenuLink kind="entry" href="#">
                      {page}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <SiteHeaderActions>
              <a href="#kontakt" className={buttonVariants({ variant: "primary" })}>
                Nachricht schreiben
              </a>
            </SiteHeaderActions>
          </SiteHeader>
        </Option>
      ))}
    </div>
  ),
};

const speeds = [
  { name: "1,8 s", value: "1.8s" },
  { name: "2,4 s", value: "2.4s", built: true },
  { name: "3,2 s", value: "3.2s" },
];
const bands = [
  { name: "schmal", value: "1.75em" },
  { name: "mittel", value: "3em", built: true },
  { name: "breit", value: "5em" },
];

/** How fast the light passes through a line, and how wide it is. Built: 2,4 s, mittel. */
export const ShimmerPace: Story = {
  render: () => (
    <div className="grid w-fit grid-cols-3 gap-x-12 gap-y-8">
      {bands.flatMap((band) =>
        speeds.map((speed) => (
          <Option
            key={`${band.name}-${speed.name}`}
            name={`${speed.name}, ${band.name}`}
            note={speed.built && band.built ? "gebaut" : undefined}
          >
            <Shimmer
              className="text-control whitespace-nowrap"
              style={
                {
                  "--shimmer-duration": speed.value,
                  "--shimmer-band": band.value,
                } as CSSProperties
              }
            >
              Zahlungen werden abgeglichen
            </Shimmer>
          </Option>
        )),
      )}
    </div>
  ),
};

function Steps({ icons, rail, label }: { icons: boolean; rail: boolean; label: string }) {
  return (
    <Trace aria-label={label} rail={rail} className="w-[22rem]">
      <TraceStep
        title="Offene Rechnungen gesucht"
        meta="12 gefunden"
        icon={icons ? Search01Icon : undefined}
      />
      <TraceStep
        title="Zahlungseingänge abgeglichen"
        meta="9 bezahlt"
        icon={icons ? Invoice01Icon : undefined}
      />
      <TraceStep
        status="running"
        title="Mahnungen werden entworfen"
        meta="2 von 3"
        icon={icons ? PencilEdit02Icon : undefined}
      />
      <TraceStep
        status="pending"
        title="Zur Freigabe vorlegen"
        icon={icons ? Mail01Icon : undefined}
      />
    </Trace>
  );
}

/**
 * What stands in front of a step: the system's ring, arc and disc, or a symbol for the kind of
 * step once it is done. And whether a hairline joins the marks. Built: marks, with the rail.
 */
export const TraceMarks: Story = {
  render: () => (
    <div className="grid w-fit grid-cols-2 gap-x-14 gap-y-10">
      <Option name="Marken, mit Linie" note="gebaut">
        <Steps icons={false} rail label="Marken, mit Linie" />
      </Option>
      <Option name="Symbole, mit Linie">
        <Steps icons rail label="Symbole, mit Linie" />
      </Option>
      <Option name="Marken, ohne Linie">
        <Steps icons={false} rail={false} label="Marken, ohne Linie" />
      </Option>
      <Option name="Symbole, ohne Linie">
        <Steps icons rail={false} label="Symbole, ohne Linie" />
      </Option>
    </div>
  ),
};

const script = [
  {
    running: "Offene Rechnungen werden gesucht",
    done: "Offene Rechnungen gesucht",
    meta: "12 gefunden",
  },
  {
    running: "Zahlungseingänge werden abgeglichen",
    done: "Zahlungseingänge abgeglichen",
    meta: "9 bezahlt",
  },
  { running: "Mahnungen werden entworfen", done: "Drei Mahnungen entworfen", meta: "4 s" },
  { running: "Wird zur Freigabe vorgelegt", done: "Zur Freigabe vorgelegt", meta: undefined },
];

/** One step every 1.6 seconds, then the summary closes: what a chat shows while it works. */
function Working() {
  // How many steps are finished; the next one is running.
  const [finished, setFinished] = useState(0);
  const [run, setRun] = useState(0);
  const over = finished >= script.length;

  useEffect(() => {
    if (over) return;
    const timer = setTimeout(() => setFinished((count) => count + 1), 1600);
    return () => clearTimeout(timer);
  }, [finished, over, run]);

  return (
    <div className="flex w-[26rem] flex-col items-start gap-6">
      <TraceSummary
        key={run}
        status={over ? "done" : "running"}
        title={over ? "In 6 Sekunden erledigt" : "Arbeitet"}
        meta={`${Math.min(finished + 1, script.length)} ${finished === 0 ? "Schritt" : "Schritte"}`}
      >
        <Trace aria-label="Offene Rechnungen prüfen">
          {script.slice(0, finished + 1).map((step, index) => {
            const status: TraceStatus = index < finished ? "done" : "running";
            return (
              <TraceStep
                key={step.done}
                status={status}
                title={status === "done" ? step.done : step.running}
                meta={status === "done" ? step.meta : undefined}
              />
            );
          })}
        </Trace>
      </TraceSummary>
      <Button
        size="sm"
        onClick={() => {
          setFinished(0);
          setRun((count) => count + 1);
        }}
      >
        Noch einmal abspielen
      </Button>
    </div>
  );
}

/**
 * The trace at work: steps join, the running line shimmers, a finished step's mark closes from
 * the ring into the disc, and the summary puts the steps away when the work is done.
 */
export const TraceAtWork: Story = {
  render: () => <Working />,
};
