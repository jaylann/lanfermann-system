import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { buttonVariants } from "@/components/button/button-variants";

import { Banner } from "./banner";

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: { layout: "fullscreen", visual: { viewport: { width: 860, height: 260 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A page under the banner, so it can be seen that the page makes room and follows. */
function Page() {
  return (
    <main className="flex flex-col gap-2 px-6 py-6">
      <h1 className="text-xl font-medium text-fg">Übersicht.</h1>
      <p className="max-w-prose text-fg-body">
        12 offene Angebote, 3 davon laufen diese Woche ab. Die Schreinerei Mustermann hat das
        Angebot für den Einbauschrank angenommen.
      </p>
    </main>
  );
}

/** The four tones: what is the case, then what to do. */
export const Tones: Story = {
  parameters: { visual: { viewport: { width: 860, height: 300 } } },
  render: () => (
    <div className="flex flex-col gap-3 py-4">
      <Banner tone="info" title="Heute Nacht wird gewartet." dismissible={false}>
        Zwischen 1 und 3 Uhr ist die Anwendung nicht erreichbar.
      </Banner>
      <Banner tone="success" title="Ihr Tarif ist verlängert." dismissible={false}>
        Die nächste Rechnung kommt am 1. Dezember.
      </Banner>
      <Banner tone="warning" title="Ihre Testphase endet in drei Tagen." dismissible={false}>
        Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
      </Banner>
      <Banner
        tone="danger"
        title="Die Zahlung vom 1. November ist fehlgeschlagen."
        dismissible={false}
      >
        Prüfen Sie Ihre Zahlungsmethode.
      </Banner>
    </div>
  ),
};

/** With one thing to do at the end of the strip, and the key that closes it. */
export const WithAction: Story = {
  render: () => (
    <div>
      <Banner
        tone="warning"
        title="Ihre Testphase endet in drei Tagen."
        action={
          <a href="#tarife" className={buttonVariants({ size: "sm" })}>
            Tarif wählen
          </a>
        }
      >
        Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
      </Banner>
      <Page />
    </div>
  ),
};

/** Set into the page's column instead of across it. */
export const Inset: Story = {
  render: () => (
    <div className="px-6 pt-6">
      <Banner
        layout="inset"
        tone="danger"
        title="Die Zahlung vom 1. November ist fehlgeschlagen."
        action={
          <a href="#zahlung" className={buttonVariants({ size: "sm" })}>
            Zahlungsmethode ändern
          </a>
        }
      >
        Prüfen Sie Ihre Karte.
      </Banner>
      <Page />
    </div>
  ),
};

/** A banner that arrives after the page has loaded pushes the page down and comes in from the top. */
export const Arriving: Story = {
  parameters: { visual: { motion: [{ name: "arrive", click: '[data-step="arrive"]' }] } },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Banner open={open} onOpenChange={setOpen} tone="info" title="Heute Nacht wird gewartet.">
          Zwischen 1 und 3 Uhr ist die Anwendung nicht erreichbar.
        </Banner>
        <Page />
        <div className="px-6">
          <Button size="sm" variant="secondary" data-step="arrive" onClick={() => setOpen(true)}>
            Hinweis zeigen
          </Button>
        </div>
      </div>
    );
  },
};

/** Closed, it leaves the way it came: it rises into the top edge as it fades, the page with it. */
export const Closing: Story = {
  parameters: { visual: { motion: [{ name: "close", click: '[data-slot="banner-close"]' }] } },
  render: () => (
    <div>
      <Banner tone="warning" title="Ihre Testphase endet in drei Tagen.">
        Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
      </Banner>
      <Page />
    </div>
  ),
};

/** On a phone the sentence wraps and the action goes under it; the close key stays at the top. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 380 } } },
  render: () => (
    <div>
      <Banner
        tone="warning"
        title="Ihre Testphase endet in drei Tagen."
        action={
          <a href="#tarife" className={buttonVariants({ size: "sm" })}>
            Tarif wählen
          </a>
        }
      >
        Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
      </Banner>
      <Page />
    </div>
  ),
};

/** Tests the keyboard path: the close key closes it, and the focus lands on the page. */
export const Keyboard: Story = {
  render: () => (
    <div>
      <Banner tone="warning" title="Ihre Testphase endet in drei Tagen.">
        Wählen Sie einen Tarif.
      </Banner>
      <Page />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Tab reaches the close key, Enter closes the banner", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Hinweis schließen" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="banner-strip"]')).toBeNull(),
      );
    });
    await step("The focus is on the page, not lost", async () => {
      await expect(canvas.getByRole("main")).toHaveFocus();
    });
  },
};
