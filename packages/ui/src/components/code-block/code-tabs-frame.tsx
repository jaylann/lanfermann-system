"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import {
  Children,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@/lib/cn";

import { type CodeKeyOptions, CodeKeys } from "./code-keys";
import { CodeScroll } from "./code-scroll";
import { codeHead, codeRoot } from "./code-surface";
import { readChoice, subscribeChoices, writeChoice } from "./code-tabs-store";

type CodeTabsFrameProps = Omit<CodeKeyOptions, "download"> & {
  /** One `<code>` per tab, in the order of `tabs`. */
  children: ReactNode;
  tabs: { label: string; copyText: string; fileName: string }[];
  group?: string;
  defaultValue?: string;
  label: string;
  /** A key that saves the version that is shown. */
  download?: boolean;
  /** Long lines break when the block first shows. With `wrapToggle` the reader can change it. */
  wrap?: boolean;
  className?: string;
};

/**
 * The client half of CodeTabs: a row of tabs in the header, each with its mark, and one soft
 * highlight that glides to the chosen tab (`glide`, placed by Base UI's measure and moved by
 * `translate`). The keys at the end of the header take the code that is shown.
 */
export function CodeTabsFrame({
  children,
  tabs,
  group,
  defaultValue,
  label,
  download,
  wrap = false,
  wrapToggle = false,
  className,
  ...keyOptions
}: CodeTabsFrameProps) {
  const [wrapped, setWrapped] = useState(wrap);
  const names = tabs.map((tab) => tab.label);
  const [own, setOwn] = useState(defaultValue ?? names[0]);
  const shared = useSyncExternalStore(
    subscribeChoices,
    () => (group ? readChoice(group) : undefined),
    () => undefined,
  );
  // A choice that is no tab here (another block's, a `defaultValue` no tab has) shows the first.
  const mine = own !== undefined && names.includes(own) ? own : names[0];
  const value = shared && names.includes(shared) ? shared : mine;
  const index = Math.max(0, names.indexOf(value ?? ""));

  // The highlight moves only once it stands: a choice remembered from an earlier visit is
  // applied on load, and page load does not animate.
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const pres = useRef<(HTMLPreElement | null)[]>([]);
  const activeCode = useMemo(
    () => ({
      get current() {
        return pres.current[index] ?? null;
      },
    }),
    [index],
  );
  const panels = Children.toArray(children);

  return (
    <TabsPrimitive.Root
      data-slot="code-tabs"
      value={value}
      onValueChange={(next: string) => {
        setOwn(next);
        if (group) writeChoice(group, next);
      }}
      data-wrap={wrapToggle ? (wrapped ? "on" : "off") : undefined}
      className={cn(codeRoot, className)}
    >
      <div data-slot="code-tabs-header" className={cn(codeHead, "pl-1.5")}>
        <TabsPrimitive.List
          data-slot="code-tabs-list"
          aria-label={label}
          className="relative isolate flex min-w-0 flex-1 gap-0.5"
        >
          {tabs.map((tab) => (
            <TabsPrimitive.Tab
              key={tab.label}
              value={tab.label}
              data-slot="code-tab"
              className={cn(
                "group touch-target relative inline-flex h-(--control-sm) items-center gap-1.5 rounded-sm pr-2.5 pl-2 text-sm font-medium whitespace-nowrap text-fg-muted select-none",
                "transition-colors duration-150 ease-out hover:text-fg data-active:text-fg",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              <span aria-hidden className="mark group-data-active:mark-on" />
              {tab.label}
            </TabsPrimitive.Tab>
          ))}
          <TabsPrimitive.Indicator
            data-slot="code-tabs-indicator"
            className={cn(
              "absolute top-(--active-tab-top) left-0 -z-10 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-sm bg-hover",
              "forced-colors:outline forced-colors:-outline-offset-1",
              placed && "transition-[translate,width] spring-glide",
            )}
          />
        </TabsPrimitive.List>
        <CodeKeys
          text={tabs[index]?.copyText ?? ""}
          codeRef={activeCode}
          fileName={tabs[index]?.fileName}
          download={download}
          wrapToggle={wrapToggle}
          wrapped={wrapped}
          onWrappedChange={setWrapped}
          {...keyOptions}
        />
      </div>
      {panels.map((panel, at) => (
        <TabsPrimitive.Panel
          key={names[at]}
          value={names[at]}
          data-slot="code-tabs-panel"
          // The code region inside takes the focus and scrolls; the panel need not be a stop too.
          tabIndex={-1}
          className="outline-hidden"
        >
          <CodeScroll
            label={`${label}: ${names[at]}`}
            codeRef={{
              get current() {
                return pres.current[at] ?? null;
              },
              set current(element) {
                pres.current[at] = element;
              },
            }}
            preClassName="py-3"
          >
            {panel}
          </CodeScroll>
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  );
}
