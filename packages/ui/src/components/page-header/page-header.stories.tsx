import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { buttonVariants } from "@/components/button/button-variants";
import { linkVariants } from "@/components/link/link-variants";

import { PageHeader, PageHeaderActions, PageHeaderLead, PageHeaderTitle } from "./page-header";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  parameters: { visual: { viewport: { width: 860, height: 440 } } },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The opening of a page: the one display title, a lead, the next step. Nothing above the title. */
export const Opening: Story = {
  render: () => (
    <PageHeader className="w-[760px] max-w-full">
      <PageHeaderTitle level={1} size="display">
        Software, die sofort antwortet, und was dafür nötig war.
      </PageHeaderTitle>
      <PageHeaderLead>
        Ein Teil davon ist Open Source. Wie sie entstanden ist, schreibe ich auf.
      </PageHeaderLead>
      <PageHeaderActions>
        <a href="#arbeiten" className={buttonVariants({ variant: "primary", size: "lg" })}>
          Arbeiten ansehen
        </a>
        <a href="#code" className={linkVariants()}>
          Code ansehen
        </a>
      </PageHeaderActions>
    </PageHeader>
  ),
};

/** A section of the page: the 2px rule opens it, then a title one size down. */
export const UnderARule: Story = {
  parameters: { visual: { viewport: { width: 860, height: 300 } } },
  render: () => (
    <PageHeader rule className="w-[760px] max-w-full">
      <PageHeaderTitle>Drei Schritte, in dieser Reihenfolge.</PageHeaderTitle>
      <PageHeaderLead>
        Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem ich
        liefere. Erst dann baue ich.
      </PageHeaderLead>
    </PageHeader>
  ),
};

/** On a phone both titles step down the scale, and the lead takes the full width. */
export const OnAPhone: Story = {
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 390, height: 460 }, clip: "viewport" },
  },
  render: (args, context) => <div className="p-5">{Opening.render?.(args, context)}</div>,
};

/** The keyboard path, as a test: the button first, then the quiet way beside it. */
export const Keyboard: Story = {
  render: Opening.render,
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Arbeiten ansehen" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Code ansehen" })).toHaveFocus();
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Software, die sofort antwortet",
    );
  },
};
