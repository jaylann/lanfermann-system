import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Wordmark } from "@/components/logo/wordmark";

import {
  SiteFooter,
  SiteFooterBrand,
  SiteFooterGroup,
  SiteFooterLegal,
  SiteFooterLink,
  SiteFooterMain,
  SiteFooterNav,
} from "./site-footer";

const meta = {
  title: "Components/SiteFooter",
  component: SiteFooter,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 420 }, clip: "viewport" },
  },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const groups = [
  {
    title: "Leistungen",
    links: [
      { href: "#websites", label: "Websites" },
      { href: "#apps", label: "Apps" },
      { href: "#programme", label: "Programme" },
      { href: "#beratung", label: "Beratung" },
    ],
  },
  {
    title: "Lanfermann",
    links: [
      { href: "#arbeiten", label: "Arbeiten" },
      { href: "#preise", label: "Preise" },
      { href: "#ueber-mich", label: "Über mich" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "#impressum", label: "Impressum" },
      { href: "#datenschutz", label: "Datenschutz" },
    ],
  },
] as const;

function Example() {
  return (
    <SiteFooter>
      <SiteFooterMain>
        <SiteFooterBrand>
          <Wordmark size={24} />
          <p>
            Websites, Apps für das Web und für iOS, Programme für Angebote und Terminbuchungen, von
            München aus.
          </p>
        </SiteFooterBrand>
        <SiteFooterNav aria-label="Weitere Seiten">
          {groups.map((group) => (
            <SiteFooterGroup key={group.title} title={group.title}>
              {group.links.map((link) => (
                <SiteFooterLink key={link.href} href={link.href}>
                  {link.label}
                </SiteFooterLink>
              ))}
            </SiteFooterGroup>
          ))}
        </SiteFooterNav>
      </SiteFooterMain>
      <SiteFooterLegal>
        <p className="flex flex-wrap justify-between gap-x-8 gap-y-1">
          <span>Justin Lanfermann · Websites, Apps und Programme</span>
          <span>© 2026 Justin Lanfermann, München</span>
        </p>
      </SiteFooterLegal>
    </SiteFooter>
  );
}

/**
 * The floor of the page: a quiet strip under a hairline. What this is on one side, the places in
 * columns on the other, and who made it in the last row.
 */
export const Default: Story = {
  parameters: { visual: { target: '[data-slot="site-footer-link"]' } },
  render: () => <Example />,
};

/** On a phone the brand stands above the places, which keep two columns. */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 640 }, clip: "viewport" } },
  render: () => <Example />,
};

/** The keyboard path, as a test: every place in order, each a link with its address. */
export const Keyboard: Story = {
  render: () => <Example />,
  play: async ({ canvas, userEvent }) => {
    for (const group of groups) {
      for (const place of group.links) {
        await userEvent.tab();
        const link = canvas.getByRole("link", { name: place.label });
        await expect(link).toHaveFocus();
        await expect(link).toHaveAttribute("href", place.href);
      }
    }
    await expect(canvas.getByRole("img", { name: "Lanfermann.dev" })).toBeVisible();
  },
};
