"use client";

import { Location01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { linkVariants } from "@/components/link/link-variants";
import { Spinner } from "@/components/spinner/spinner";
import { cn } from "@/lib/cn";

import { useConsentContext } from "./consent";
import { consentServices } from "./consent-record";

export type ConsentEmbedProps = Omit<ComponentProps<"div">, "children"> & {
  /** The service the content comes from, by its id in the config. */
  service: string;
  /** The content's shape, as CSS `aspect-ratio`: „16 / 9“ for a video, „4 / 3“ for a map. */
  aspect?: string;
  /** What it is, shown as a mark above the placeholder's title: a play mark or a map pin. */
  kind?: "video" | "map";
  /** The content itself, usually an `<iframe>`. Rendered only with consent. */
  children: ReactNode;
};

/**
 * Content from another provider (a video, a map) that loads only with consent. Until then a
 * placeholder of the same shape says whose content it is, what loading it sends where, and
 * offers to load it: once, for this page, or always, which stores the consent for that one
 * service. The placeholder itself loads nothing from the provider, not even a picture.
 *
 * Once allowed, the content fades in when it has loaded. Revoking the service in the settings
 * takes it away again.
 */
export function ConsentEmbed({
  service: serviceId,
  aspect = "16 / 9",
  kind,
  className,
  style,
  children,
  ...props
}: ConsentEmbedProps) {
  const { allows, config, labels, snapshot, store, decide } = useConsentContext("ConsentEmbed");
  const service = consentServices(config).get(serviceId);
  const allowed = allows(serviceId);
  const [loaded, setLoaded] = useState(false);

  // `load` does not bubble, but it can be caught on the way down. Content without anything to
  // load (no frame, no picture) counts as loaded at once.
  const watch = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    if (!element.querySelector("iframe, img, video")) {
      setLoaded(true);
      return;
    }
    const done = () => setLoaded(true);
    element.addEventListener("load", done, true);
    return () => element.removeEventListener("load", done, true);
  }, []);

  const box = cn(
    "relative min-h-fit w-full overflow-hidden rounded-xl bg-well depth-socket",
    className,
  );
  const shape = { aspectRatio: aspect, ...style } as CSSProperties;

  if (snapshot.status === "unknown") {
    return <div data-slot="consent-embed" className={box} style={shape} {...props} />;
  }

  if (allowed) {
    return (
      <div
        data-slot="consent-embed"
        data-loaded={loaded || undefined}
        className={box}
        style={shape}
        {...props}
      >
        {!loaded && (
          <span className="absolute inset-0 grid place-items-center text-fg-muted">
            <Spinner />
          </span>
        )}
        <div
          ref={watch}
          data-slot="consent-embed-content"
          className={cn(
            "size-full transition-opacity spring-settle *:size-full",
            loaded ? "opacity-100" : "opacity-0",
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  if (!service) return null;
  const decided = snapshot.status === "decided";
  return (
    <div
      data-slot="consent-embed"
      className={cn(box, "grid place-items-center px-6 py-8 text-center")}
      style={shape}
      {...props}
    >
      <div className="flex max-w-sm flex-col items-center gap-3">
        {kind && (
          // What waits here, at a glance. Drawn flat in a ring: it is no key, „Inhalt laden“ is.
          <span
            data-slot="consent-embed-mark"
            className="mb-1 grid size-11 place-items-center rounded-full border border-line text-fg-muted"
          >
            <Icon icon={kind === "video" ? PlayIcon : Location01Icon} size={18} />
          </span>
        )}
        <p className="text-control leading-snug font-semibold text-balance text-fg">
          {labels.embedTitle(service)}
        </p>
        <p className="text-sm text-pretty text-fg-body">
          {labels.embedText(service)}
          {service.privacyUrl && (
            <>
              {" "}
              <a
                href={service.privacyUrl}
                className={linkVariants({ variant: "quiet" })}
                target={service.privacyUrl.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
              >
                {labels.privacyPolicy}
              </a>
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button onClick={() => store.grantOnce(serviceId)}>{labels.embedLoadOnce}</Button>
          {/* Only once the banner is answered: before, this would answer it for every service. */}
          {decided && (
            <Button
              variant="quiet"
              onClick={() => decide([...(snapshot.record?.granted ?? []), serviceId])}
            >
              {labels.embedAlways(service)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
