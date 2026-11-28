import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, StrictMode, useEffect, useState } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { linkVariants } from "@/components/link/link-variants";

import {
  consentAnchor,
  ConsentGate,
  ConsentProvider,
  type ConsentProviderProps,
  ConsentSettingsTrigger,
  consentSurface,
  useConsent,
} from "./consent";
import { ConsentCard } from "./consent-card";
import { ConsentEmbed } from "./consent-embed";
import { consentLabels } from "./consent-labels";
import { encodeConsent, parseConsent } from "./consent-record";
import { sampleConsentConfig as config } from "./consent-sample";
import { createMemoryJar, readCookie } from "./consent-store";

const meta = {
  title: "Components/Consent",
  component: ConsentProvider,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1100, height: 760 }, clip: "viewport" },
  },
  args: { config, privacyHref: "#datenschutz", imprintHref: "#impressum" },
} satisfies Meta<typeof ConsentProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A jar that already holds an answer: these services granted. */
const answered = (granted: string[]) =>
  createMemoryJar({
    "lf-consent": encodeConsent(
      { revision: config.revision, decidedAt: Date.now() - 86_400_000, granted },
      config,
    ),
  });

/** The page behind the banner: a joinery's home page, with the legal links in its footer. */
function SamplePage({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-5 py-12 sm:px-8">
        <p className="text-sm font-medium text-fg-muted">Schreinerei Mustermann, Augsburg</p>
        <h1 className="text-3xl leading-tight font-semibold text-balance text-fg">
          Möbel nach Maß, gebaut in der eigenen Werkstatt.
        </h1>
        <p className="max-w-prose text-fg-body">
          Küchen, Einbauschränke und Treppen aus Eiche, Nussbaum und Esche. Jedes Stück wird vor Ort
          aufgemessen, in Augsburg gefertigt und von denselben Leuten eingebaut, die es geplant
          haben.
        </p>
        <p className="max-w-prose text-fg-body">
          Ein erstes Gespräch in der Werkstatt kostet nichts. Ein Angebot folgt nach dem Aufmaß, mit
          Preis und Liefertermin.
        </p>
        {children}
      </main>
      <footer className="border-t border-line bg-surface-quiet">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-sm text-fg-body sm:px-8">
          <a href="#impressum" className={linkVariants({ variant: "quiet" })}>
            Impressum
          </a>
          <a href="#datenschutz" className={linkVariants({ variant: "quiet" })}>
            Datenschutzerklärung
          </a>
          <ConsentSettingsTrigger />
        </div>
      </footer>
    </div>
  );
}

/** A video from the workshop, drawn here: the stories load nothing from YouTube. */
function SampleVideo() {
  return (
    <div
      role="img"
      aria-label="Video: Eine Küche aus Eiche entsteht"
      className="grid size-full place-items-center bg-[linear-gradient(135deg,#3b3428,#1d1a15)] text-sm text-white/80"
    >
      Video: Eine Küche aus Eiche entsteht
    </div>
  );
}

/** Opens the banner on its settings once mounted, as the footer link would. */
function OpenSettings() {
  const { openSettings } = useConsent();
  useEffect(openSettings, [openSettings]);
  return null;
}

/**
 * The first visit: the banner stands at the foot of the window and leaves the page usable.
 * „Banner zeigen“ starts over, for looking at the entrance again.
 */
export const FirstVisit: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "enter", click: '[data-slot="consent-replay"]', frames: 8 },
        { name: "settings", click: '[data-slot="consent-footer"] > :nth-child(3)', frames: 10 },
      ],
    },
  },
  render: (args) => <Replayable {...args} />,
};

function Replayable(props: ConsentProviderProps) {
  const [round, setRound] = useState(0);
  const [jar, setJar] = useState(() => createMemoryJar());
  return (
    <ConsentProvider key={round} {...props} jar={jar}>
      <SamplePage>
        {/* Up in the corner, clear of the card, so it can be pressed while the card stands. */}
        <div className="fixed top-4 left-4">
          <Button
            data-slot="consent-replay"
            size="sm"
            onClick={() => {
              setJar(createMemoryJar());
              setRound(round + 1);
            }}
          >
            Banner zeigen
          </Button>
        </div>
      </SamplePage>
    </ConsentProvider>
  );
}

/**
 * The settings reached from the first layer, drawn without the dialog so the way back and the
 * flip of „Alle akzeptieren“ can be looked at frame by frame.
 */
export const SettingsOnFirstVisit: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "back", click: '[aria-label="Zurück"]', frames: 10 },
        { name: "flip", click: '[data-slot="consent-footer"] > :nth-child(2)', frames: 10 },
      ],
    },
  },
  render: (args) => {
    // An answered provider, so the page's footer link works and the real banner stays away.
    const [jar] = useState(() => answered([]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage>
          <div data-slot="consent-anchor" className={consentAnchor}>
            <div data-slot="consent-banner" className={consentSurface}>
              <ConsentCard
                config={config}
                labels={consentLabels}
                privacyHref="#datenschutz"
                imprintHref="#impressum"
                granted={["matomo"]}
                defaultView="settings"
                onDecide={() => {}}
              />
            </div>
          </div>
        </SamplePage>
      </ConsentProvider>
    );
  },
};

/** The settings, as the footer link opens them: every service with its facts and switch. */
export const Settings: Story = {
  parameters: {
    visual: {
      motion: [
        {
          name: "category",
          click: '[data-slot="consent-category"]:nth-child(3) [data-slot="collapsible-trigger"]',
          frames: 8,
        },
      ],
    },
  },
  render: (args) => {
    const [jar] = useState(() => answered(["matomo"]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage />
        <OpenSettings />
      </ConsentProvider>
    );
  },
};

/** After an answer: nothing on the page but the link in the footer. */
export const Decided: Story = {
  parameters: {
    visual: {
      motion: [{ name: "reopen", click: '[data-slot="consent-trigger"]', frames: 8 }],
    },
  },
  render: (args) => {
    const [jar] = useState(() => answered([]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage />
      </ConsentProvider>
    );
  },
};

/** On a phone the card spans the width above the home indicator; the decisions never scroll. */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: (args) => {
    const [jar] = useState(() => createMemoryJar());
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage />
      </ConsentProvider>
    );
  },
};

/** The settings on a phone: the list scrolls between the title and the decisions. */
export const SettingsOnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: Settings.render,
};

/**
 * A video that needs consent. Before an answer it offers to load it once; after one, also to
 * allow the service for good.
 */
export const Embed: Story = {
  parameters: { visual: { viewport: { width: 1100, height: 1300 } } },
  render: (args) => {
    const [jar] = useState(() => answered(["matomo"]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage>
          <ConsentEmbed service="youtube" kind="video" className="mt-4">
            <SampleVideo />
          </ConsentEmbed>
          <ConsentEmbed service="google-maps" kind="map" aspect="4 / 3">
            <div
              role="img"
              aria-label="Karte: Anfahrt zur Werkstatt"
              className="grid size-full place-items-center bg-well text-sm text-fg-muted"
            >
              Karte: Anfahrt zur Werkstatt
            </div>
          </ConsentEmbed>
          <ConsentGate service="matomo">
            <p className="text-sm text-fg-muted">Matomo zählt diesen Besuch.</p>
          </ConsentGate>
        </SamplePage>
      </ConsentProvider>
    );
  },
};

const keyboardConfig = { ...config, cookieName: "lf-consent-keyboard" };
const clearKeyboardCookie = () => {
  document.cookie = "lf-consent-keyboard=; Path=/; Max-Age=0";
};

/**
 * The keyboard path, with the page's real cookie. While undecided, Escape is no answer; the
 * settings are reached and left by keys, focus follows the view, the answer is stored without an
 * ID, the footer link reopens the settings and gets the focus back, and what needs consent
 * appears only once it is given.
 */
export const Keyboard: Story = {
  args: { config: keyboardConfig },
  beforeEach: () => {
    clearKeyboardCookie();
    return clearKeyboardCookie;
  },
  render: (args) => (
    <ConsentProvider {...args}>
      <SamplePage>
        <ConsentGate service="matomo">
          <p className="text-sm text-fg-muted">Matomo zählt diesen Besuch.</p>
        </ConsentGate>
      </SamplePage>
    </ConsentProvider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const banner = await screen.findByRole("dialog", { name: "Cookies auf dieser Website." });

    await step("the card takes the focus, not one of its answers", async () => {
      await waitFor(() => expect(banner).toHaveFocus());
    });

    await step("Escape is no answer: the banner stays", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await step("Tab reaches the links, then both answers, then the settings", async () => {
      await userEvent.tab();
      await expect(
        within(banner).getByRole("link", { name: "Datenschutzerklärung" }),
      ).toHaveFocus();
      await userEvent.tab();
      await expect(within(banner).getByRole("link", { name: "Impressum" })).toHaveFocus();
      await userEvent.tab();
      await expect(screen.getByRole("button", { name: "Alle ablehnen" })).toHaveFocus();
      await userEvent.tab();
      await expect(screen.getByRole("button", { name: "Alle akzeptieren" })).toHaveFocus();
      await userEvent.tab();
      await expect(screen.getByRole("button", { name: "Einstellungen" })).toHaveFocus();
    });

    await step("the settings open in place and their title takes the focus", async () => {
      await userEvent.keyboard("{Enter}");
      const title = await screen.findByRole("heading", { name: "Cookie-Einstellungen." });
      await waitFor(() => expect(title).toHaveFocus());
      // Every switch starts off.
      for (const toggle of screen.getAllByRole("switch")) await expect(toggle).not.toBeChecked();
    });

    await step("Zurück leads back, onto the button that went there", async () => {
      await userEvent.tab({ shift: true });
      await expect(screen.getByRole("button", { name: "Zurück" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Einstellungen" })).toHaveFocus(),
      );
    });

    await step("„Alle ablehnen“ stores the refusal and closes the banner", async () => {
      await userEvent.click(screen.getByRole("button", { name: "Alle ablehnen" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      const record = parseConsent(
        readCookie(document.cookie, "lf-consent-keyboard"),
        keyboardConfig,
      );
      await expect(record?.granted).toEqual([]);
      await expect(canvas.queryByText("Matomo zählt diesen Besuch.")).not.toBeInTheDocument();
    });

    await step("the footer link reopens the settings, and Escape returns there", async () => {
      const trigger = canvas.getByRole("button", { name: "Cookie-Einstellungen" });
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const title = await screen.findByRole("heading", { name: "Cookie-Einstellungen." });
      await waitFor(() => expect(title).toHaveFocus());
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step("after „Alle akzeptieren“ what needs consent appears", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Cookie-Einstellungen" }));
      await userEvent.click(await screen.findByRole("button", { name: "Alle akzeptieren" }));
      await canvas.findByText("Matomo zählt diesen Besuch.");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  },
};

/**
 * Under Strict Mode (Next's default in development) every effect runs twice on mount. The first
 * layer still gives the focus to the card, not to one of its keys, and the page's own tab stops
 * stay reachable: the banner is no trap.
 */
export const StrictFocus: Story = {
  render: (args) => {
    const [jar] = useState(() => createMemoryJar());
    return (
      <StrictMode>
        <ConsentProvider {...args} jar={jar}>
          <SamplePage />
        </ConsentProvider>
      </StrictMode>
    );
  },
  play: async ({ canvas, userEvent, step }) => {
    const banner = await screen.findByRole("dialog", { name: "Cookies auf dieser Website." });

    await step("the card takes the focus, not „Einstellungen“", async () => {
      await waitFor(() => expect(banner).toHaveFocus());
    });

    await step("Shift+Tab leaves the banner for the page's last link", async () => {
      await userEvent.tab({ shift: true });
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Cookie-Einstellungen" })).toHaveFocus(),
      );
      await expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await step("Tab past „Einstellungen“ leaves it as well, and it stays", async () => {
      screen.getByRole("button", { name: "Einstellungen" }).focus();
      await userEvent.tab();
      await expect(banner.contains(document.activeElement)).toBe(false);
      await expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  },
};

/** A purpose that has no service yet, beside the sample's three. */
const withEmptyCategory = {
  ...config,
  categories: [
    ...config.categories,
    {
      id: "chat",
      name: "Chat",
      description: "Beantwortet Fragen direkt auf der Seite.",
      services: [],
    },
  ],
};

/**
 * What the settings say: every switch is named by its purpose or its service, the necessary
 * category has no switch but its words, and a purpose without services does not stand as on.
 */
export const SwitchNames: Story = {
  args: { config: withEmptyCategory },
  render: (args) => {
    const [jar] = useState(() => answered(["matomo", "youtube"]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage />
        <OpenSettings />
      </ConsentProvider>
    );
  },
  play: async ({ userEvent, step }) => {
    await screen.findByRole("heading", { name: "Cookie-Einstellungen." });
    const settings = within(screen.getByRole("dialog"));

    await step("each purpose's switch carries its name and shows the stored answer", async () => {
      await expect(settings.getByRole("switch", { name: /^Statistik/ })).toBeChecked();
      await expect(settings.getByRole("switch", { name: /^Marketing/ })).not.toBeChecked();
      // One of two services: not on, and the count is part of the name.
      const media = settings.getByRole("switch", { name: /^Externe Medien/ });
      await expect(media).not.toBeChecked();
      await expect(media).toHaveAccessibleName(/1 von 2 aktiv/);
      await expect(media).toHaveAccessibleDescription(
        "Zeigt Videos und Karten von anderen Anbietern direkt auf der Seite.",
      );
    });

    await step("the necessary category has words in place of a switch", async () => {
      await expect(settings.queryByRole("switch", { name: /Notwendig/ })).toBeNull();
      // Once the card has faded in.
      await waitFor(() => expect(settings.getByText("Immer aktiv")).toBeVisible());
    });

    await step("a purpose without services is not switched on", async () => {
      await expect(settings.getByRole("switch", { name: /^Chat/ })).not.toBeChecked();
    });

    await step("unfolded, each service has a switch of its own, by its name", async () => {
      // „2 Dienste“ stands under Marketing and under Externe Medien: the second one.
      await userEvent.click(settings.getAllByRole("button", { name: "2 Dienste" })[1]!);
      await expect(await settings.findByRole("switch", { name: /^YouTube/ })).toBeChecked();
      await expect(settings.getByRole("switch", { name: /^Google Maps/ })).not.toBeChecked();
    });
  },
};

/**
 * The keys of an embed's placeholder: the content takes the focus of the key that loaded it,
 * and „immer laden“ for one service leaves another that was loaded once as it is.
 */
export const EmbedKeyboard: Story = {
  render: (args) => {
    const [jar] = useState(() => answered([]));
    return (
      <ConsentProvider {...args} jar={jar}>
        <SamplePage>
          <ConsentEmbed service="youtube" kind="video" className="mt-4">
            <SampleVideo />
          </ConsentEmbed>
          <ConsentEmbed service="google-maps" kind="map" aspect="4 / 3">
            <div
              role="img"
              aria-label="Karte: Anfahrt zur Werkstatt"
              className="size-full bg-well"
            />
          </ConsentEmbed>
        </SamplePage>
      </ConsentProvider>
    );
  },
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("„Inhalt laden“ shows the video and hands it the focus", async () => {
      const [load] = await canvas.findAllByRole("button", { name: "Inhalt laden" });
      load!.focus();
      await userEvent.keyboard("{Enter}");
      const video = await canvas.findByRole("img", {
        name: "Video: Eine Küche aus Eiche entsteht",
      });
      await expect(video.closest('[data-slot="consent-embed-content"]')).toHaveFocus();
    });

    await step("„Google Maps immer laden“ stores that service and keeps the video", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Google Maps immer laden" }));
      const map = await canvas.findByRole("img", { name: "Karte: Anfahrt zur Werkstatt" });
      await expect(map.closest('[data-slot="consent-embed-content"]')).toHaveFocus();
      await expect(
        canvas.getByRole("img", { name: "Video: Eine Küche aus Eiche entsteht" }),
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelectorAll('[data-slot="consent-embed-content"]'),
      ).toHaveLength(2);
    });
  },
};
