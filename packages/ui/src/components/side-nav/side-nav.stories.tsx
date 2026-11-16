import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { SideNav, SideNavGroup, SideNavLink, SideNavSubLink } from "./side-nav";

const meta = {
  title: "Components/SideNav",
  component: SideNav,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 320, height: 640 },
      target: '[data-slot="side-nav-link"]:not([aria-current])',
    },
  },
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const groups = [
  { title: "Erste Schritte", pages: ["Überblick", "Schnellstart", "Clients"] },
  { title: "Anleitungen", pages: ["Berechtigungen", "Fernzugriff", "Deployment-Vorlagen"] },
  { title: "Referenz", pages: ["Konfiguration", "Werkzeuge", "Häufige Fragen"] },
];

/**
 * The docs' pages in their groups, on the page „Clients“: it stands on the tint and shows its
 * sections under it.
 */
export const Default: Story = {
  args: { "aria-label": "Dokumentation" },
  render: (args) => (
    <SideNav {...args} className="w-56">
      {groups.map((group) => (
        <SideNavGroup key={group.title} title={group.title}>
          {group.pages.map((page) => (
            <SideNavLink
              key={page}
              href="#"
              current={page === "Clients"}
              sub={
                <>
                  <SideNavSubLink href="#">Claude Desktop</SideNavSubLink>
                  <SideNavSubLink href="#">Claude Code</SideNavSubLink>
                  <SideNavSubLink href="#">Cursor</SideNavSubLink>
                </>
              }
            >
              {page}
            </SideNavLink>
          ))}
        </SideNavGroup>
      ))}
    </SideNav>
  ),
};

/**
 * The keyboard path, as a test: Tab goes from page to page in order, the groups' names are no
 * stops, and the current page says so.
 */
export const Keyboard: Story = {
  args: { "aria-label": "Dokumentation" },
  render: Default.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Überblick" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    const current = canvas.getByRole("link", { name: "Clients" });
    await expect(current).toHaveFocus();
    await expect(current).toHaveAttribute("aria-current", "page");
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Claude Desktop" })).toHaveFocus();
  },
};

/**
 * On a subpage, „Cursor“ under „Clients“: the parent stays open without the tint, and the
 * subpage being read takes the hairline in the text colour.
 */
export const Subpage: Story = {
  args: { "aria-label": "Dokumentation" },
  render: (args) => (
    <SideNav {...args} className="w-56">
      {groups.map((group) => (
        <SideNavGroup key={group.title} title={group.title}>
          {group.pages.map((page) => (
            <SideNavLink
              key={page}
              href="#"
              open={page === "Clients"}
              sub={
                <>
                  <SideNavSubLink href="#">Claude Desktop</SideNavSubLink>
                  <SideNavSubLink href="#">Claude Code</SideNavSubLink>
                  <SideNavSubLink href="#" current>
                    Cursor
                  </SideNavSubLink>
                </>
              }
            >
              {page}
            </SideNavLink>
          ))}
        </SideNavGroup>
      ))}
    </SideNav>
  ),
};

/** On a subpage, as a test: the subpage says it is current, its parent does not. */
export const SubpageCurrent: Story = {
  args: { "aria-label": "Dokumentation" },
  render: Subpage.render,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Clients" })).not.toHaveAttribute("aria-current");
    await expect(canvas.getByRole("link", { name: "Cursor" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};
