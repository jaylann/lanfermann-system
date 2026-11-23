import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef } from "react";
import { expect, waitFor } from "storybook/test";

import { FileDropArea, useDropTarget } from "@/components/file-drop-area/file-drop-area";
import { hangFilesOver } from "@/components/file-drop-area/story-browser";

import { BreadcrumbEllipsis } from "./breadcrumb-ellipsis";
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, Breadcrumbs } from "./breadcrumbs";

const meta = {
  title: "Components/BreadcrumbEllipsis",
  component: BreadcrumbEllipsis,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 280 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const FOLDED = [
  { label: "blogs", href: "#blogs" },
  { label: "2026", href: "#blogs/2026" },
  { label: "herbst", href: "#blogs/2026/herbst" },
];

function Trail({ open = false }: { open?: boolean }) {
  return (
    <Breadcrumbs label="Ordner">
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Dateien</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbEllipsis items={FOLDED} defaultOpen={open} modal={false} />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href="#blogs/2026/herbst/building-gbar">building-gbar</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbPage>entwürfe</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumbs>
  );
}

/** A long trail folds its middle: „Dateien › … › building-gbar › entwürfe“. */
export const Default: Story = {
  render: () => <Trail />,
};

/** The folded places open as a menu of links, from the outside in. */
export const Open: Story = {
  render: () => <Trail open />,
};

/** A link of the trail that takes a drop, inside the drop area of a file browser. */
function DropLink({ id, children }: { id: string; children: string }) {
  const { dropProps } = useDropTarget({ id, label: `In ${children} ablegen` });
  return (
    <BreadcrumbLink href={`#${id}`} {...dropProps}>
      {children}
    </BreadcrumbLink>
  );
}

function DropTrail() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const link = box.current?.querySelector('[data-drop-target="blogs/2026"]');
    if (link) hangFilesOver(link);
  }, []);
  return (
    <div ref={box} className="w-full max-w-lg">
      <FileDropArea label="In entwürfe ablegen" onFiles={() => {}} className="h-40 p-4">
        <Breadcrumbs label="Ordner">
          <BreadcrumbItem>
            <DropLink id="">Dateien</DropLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <DropLink id="blogs/2026">2026</DropLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>entwürfe</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumbs>
      </FileDropArea>
    </div>
  );
}

/** Files hang over a link of the trail: it wears the field's halo and the plate names it. */
export const DropOnALink: Story = {
  parameters: { visual: { viewport: { width: 640, height: 260 } } },
  render: () => <DropTrail />,
};

/** The key is a stop for Tab; Enter opens the folded places, each a link. */
export const Keyboard: Story = {
  render: () => <Trail />,
  play: async ({ canvas, userEvent, step }) => {
    await step("the ellipsis is the second stop and names itself", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Weitere Orte" })).toHaveFocus();
    });
    await step("Enter opens the folded places as links", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeInTheDocument());
      const entries = [...document.querySelectorAll('[role="menuitem"]')];
      await expect(entries.map((entry) => entry.textContent)).toEqual(["blogs", "2026", "herbst"]);
      await expect(entries[1]).toHaveAttribute("href", "#blogs/2026");
    });
  },
};
