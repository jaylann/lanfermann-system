import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Text } from "@/components/text/text";

import { Pagination, type PaginationProps } from "./pagination";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  args: { page: 3, pages: 13 },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 640, height: 110 },
      target: '[aria-label="Seite 4"]',
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const PER_PAGE = 20;

type PagedProps = PaginationProps & {
  /** How many quotes the list holds; the line beside the pages counts them. */
  total?: number;
  /** Without an address the pages are buttons. */
  buttons?: boolean;
};

/**
 * The pages of a list of quotes, kept in state: the story has no router, so a press only
 * changes which page counts as current. The line beside them is the caller's own.
 */
function Paged({ page: start, pages, total = 248, buttons = false, ...props }: PagedProps) {
  const [page, setPage] = useState(start);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <Text size="sm" tone="muted" numeric>
        {from} bis {to} von {total} Angeboten
      </Text>
      <Pagination
        {...props}
        page={page}
        pages={pages}
        href={buttons ? undefined : (number) => `#seite-${number}`}
        onPageChange={(number, event) => {
          event.preventDefault();
          setPage(number);
        }}
      />
    </div>
  );
}

/**
 * Near the start of a long list: the first pages, a gap, the last. Press a number: the tint
 * travels there. The row keeps its width on every page, so the arrows stay under the pointer.
 *
 * The travel is stepped by hand, which a frame strip cannot hold still: it is looked at in the
 * running story.
 */
export const Default: Story = {
  render: (args) => <Paged {...args} />,
};

/** In the middle: a gap to both sides, and the current page in the middle of the row. */
export const Middle: Story = {
  args: { page: 7 },
  render: (args) => <Paged {...args} />,
};

/** On the last page: the arrow that leads on keeps its place and says that it leads nowhere. */
export const Last: Story = {
  args: { page: 13 },
  parameters: { visual: { target: '[aria-label="Seite 12"]' } },
  render: (args) => <Paged {...args} />,
};

/** A short list: every page has its number, and there is no gap. */
export const Few: Story = {
  args: { page: 2, pages: 5 },
  parameters: { visual: { target: '[aria-label="Seite 3"]' } },
  render: (args) => <Paged {...args} total={92} />,
};

/**
 * To compare: `variant="compact"`, for a narrow place or a list nobody jumps around in. On the
 * first page the key that leads back is flat.
 */
export const Compact: Story = {
  args: { page: 1, variant: "compact" },
  parameters: {
    visual: { viewport: { width: 420, height: 110 }, target: '[aria-label="Nächste Seite"]' },
  },
  render: (args) => <Paged {...args} />,
};

/** On a phone: the compact form fits beside its line, and its keys reach 44px up and down. */
export const Phone: Story = {
  args: { page: 4, variant: "compact" },
  parameters: {
    visual: { viewport: { width: 390, height: 110 }, target: '[aria-label="Nächste Seite"]' },
  },
  render: (args) => <Paged {...args} />,
};

/**
 * The keyboard path, as a test: Tab goes from the arrow to the numbers, the current page says
 * so, Enter opens a page, and the arrow at the end keeps the focus while it leads nowhere.
 */
export const Keyboard: Story = {
  args: { page: 11 },
  render: (args) => <Paged {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const nav = canvas.getByRole("navigation", { name: "Seiten" });
    const current = () => nav.querySelector('[aria-current="page"]');
    const next = canvas.getByRole("link", { name: "Nächste Seite" });

    await step("the pages are links, and the current one says so", async () => {
      await expect(current()).toHaveAccessibleName("Seite 11");
      await expect(canvas.getByRole("link", { name: "Seite 1" })).toHaveAttribute(
        "href",
        "#seite-1",
      );
      await expect(canvas.getAllByRole("link")).toHaveLength(8);
    });

    await step("Tab starts at the arrow that leads back, then walks the numbers", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Vorherige Seite" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Seite 1" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Seite 9" })).toHaveFocus();
    });

    await step("Enter opens that page, and the row keeps its seven places", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(current()).toHaveAccessibleName("Seite 9");
      await expect(nav.querySelectorAll("li:not([data-slot])")).toHaveLength(9);
    });

    await step("the arrow goes on a page at a time", async () => {
      next.focus();
      await userEvent.keyboard("{Enter}");
      await expect(current()).toHaveAccessibleName("Seite 10");
      await expect(next).toHaveFocus();
    });

    await step("on the last page it keeps the focus and says that it leads nowhere", async () => {
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{Enter}");
      await expect(current()).toHaveAccessibleName("Seite 13");
      await expect(next).toHaveFocus();
      await expect(next).toHaveAttribute("aria-disabled", "true");
      await expect(next).not.toHaveAttribute("href");
      // One more press changes nothing.
      await userEvent.keyboard("{Enter}");
      await expect(current()).toHaveAccessibleName("Seite 13");
    });
  },
};

/** Without an address the pages are buttons, and the keys of the compact form are too. */
export const Buttons: Story = {
  args: { page: 1, variant: "compact" },
  tags: ["visual-skip"],
  render: (args) => <Paged {...args} buttons />,
  play: async ({ canvas, userEvent, step }) => {
    const back = canvas.getByRole("button", { name: "Vorherige Seite" });
    const on = canvas.getByRole("button", { name: "Nächste Seite" });

    await step("on the first page the key that leads back is disabled, but in reach", async () => {
      await expect(back).toHaveAttribute("aria-disabled", "true");
      await userEvent.tab();
      await expect(back).toHaveFocus();
    });

    await step("the other key goes on, and the line says where one is", async () => {
      await userEvent.tab();
      await expect(on).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByText("Seite 2 von 13")).toBeInTheDocument();
      await expect(back).not.toHaveAttribute("aria-disabled");
    });
  },
};
