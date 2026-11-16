import type { Meta, StoryObj } from "@storybook/react-vite";

import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, Breadcrumbs } from "./breadcrumbs";

const meta = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 560, height: 120 }, target: '[data-slot="breadcrumb-link"]' },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Above a page's title: the docs, then the group the page stands in, which is no page. */
export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Doku</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>Anleitungen</BreadcrumbItem>
    </Breadcrumbs>
  ),
};

/** Deeper, and ending with the page itself where no title follows below. */
export const WithPage: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Doku</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>Projekt</BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Entscheidungen</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>Stufen und menschliche Bestätigung</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumbs>
  ),
};
