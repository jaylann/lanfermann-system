import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card/card";
import { Text } from "@/components/text/text";

import { Link } from "./link";

const meta = {
  title: "Components/Link",
  component: Link,
  args: { href: "#angebote", children: "Alle Angebote ansehen" },
  parameters: {
    visual: { viewport: { width: 440, height: 110 }, target: '[data-slot="link"]' },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Indigo and underlined: a link is recognisable without its colour too. */
export const Default: Story = {};

/**
 * Inside muted text the link takes the colour around it and keeps only the underline, so a
 * helper line stays a helper line.
 */
export const Quiet: Story = {
  render: () => (
    <Text tone="muted" className="text-sm">
      Mit dem Absenden stimmen Sie den{" "}
      <Link variant="quiet" href="#agb">
        Geschäftsbedingungen
      </Link>{" "}
      zu.
    </Text>
  ),
};

/** In running text. The words say where it leads. */
export const InText: Story = {
  parameters: { visual: { viewport: { width: 440, height: 170 } } },
  render: () => (
    <Text className="w-96">
      Ihr Angebot gilt bis zum 30. November. Sie können es jederzeit in den{" "}
      <Link href="#einstellungen">Einstellungen Ihres Betriebs</Link> anpassen oder{" "}
      <Link href="#kontakt">mit uns sprechen</Link>.
    </Text>
  ),
};

/**
 * A link that leaves the site: it opens in a new tab, and an arrow that points out stands after
 * its last word. Under the pointer the arrow moves a pixel on its way out and seats back.
 */
export const External: Story = {
  parameters: {
    visual: { motion: [{ name: "point", hover: '[data-slot="link"]', frames: 6 }] },
  },
  args: { href: "https://github.com/jaylann/lanfermann-system", external: true },
  render: (args) => <Link {...args}>Repository auf GitHub</Link>,
};

/** In running text the arrow stays with the link's last word when the line breaks. */
export const ExternalInText: Story = {
  parameters: { visual: { viewport: { width: 440, height: 200 } } },
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Text>
        Die Domain liegt bei{" "}
        <Link external href="https://example.com/registrar">
          Ihrem Registrar
        </Link>
        , die Abrechnung läuft über das{" "}
        <Link external href="https://example.com/dashboard">
          Dashboard des Zahlungsdienstes
        </Link>
        .
      </Text>
      <Text tone="muted" className="text-sm">
        Der Quelltext steht im{" "}
        <Link external variant="quiet" href="https://github.com/jaylann/lanfermann-system">
          Repository auf GitHub
        </Link>
        .
      </Text>
    </div>
  ),
};

/**
 * As a test: an external link opens a new tab without a referrer and says so to assistive tech;
 * a `target` of the caller's still wins.
 */
export const ExternalSemantics: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Link external href="https://example.com/a">
        Statusseite
      </Link>
      <Link external target="_self" href="https://example.com/b">
        Im selben Tab
      </Link>
    </div>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /^Statusseite\s*, öffnet in einem neuen Tab$/ });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
    await expect(link.querySelector('[data-slot="link-external-arrow"]')).not.toBeNull();
    await expect(canvas.getByRole("link", { name: /Im selben Tab/ })).toHaveAttribute(
      "target",
      "_self",
    );
  },
};

/** At the end of a card, on the tinted footer strip. */
export const InCardFooter: Story = {
  parameters: { visual: { viewport: { width: 440, height: 250 } } },
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Bei Lanfermann anmelden.</CardTitle>
      </CardHeader>
      <CardContent>
        <Text tone="muted">Melden Sie sich an, um Ihre Angebote zu sehen.</Text>
      </CardContent>
      <CardFooter>
        Noch kein Konto?
        <Link href="#registrieren">Registrieren</Link>
      </CardFooter>
    </Card>
  ),
};

/** As a test: a link is in the tab order under its own words. */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole("link", { name: "Alle Angebote ansehen" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute("href", "#angebote");
  },
};
