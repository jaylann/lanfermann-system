import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { kindOf } from "@/components/attachment/kinds";
import { Button } from "@/components/button/button";
import { FILES } from "@/components/file-tile/story-files";

import { FileThumbStack, type FileThumbStackFile } from "./file-thumb-stack";

const meta = {
  title: "Components/FileThumbStack",
  component: FileThumbStack,
  parameters: { layout: "padded", visual: { viewport: { width: 520, height: 200 } } },
} satisfies Meta<typeof FileThumbStack>;

export default meta;
type Story = StoryObj;

const CHOSEN: FileThumbStackFile[] = FILES.map((entry) => ({
  name: entry.name,
  type: entry.type,
  src: entry.src,
  kind: kindOf(entry),
}));

/** Four files chosen in a folder, as the head of an inspector shows them. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <FileThumbStack files={CHOSEN.slice(0, 4)} />
      <div className="flex flex-col">
        <span className="text-control font-medium text-fg">4 Dateien</span>
        <span className="text-sm text-fg-muted">zusammen 2,7 MB</span>
      </div>
    </div>
  ),
};

/** More than fit: the stack stays four pictures, and a number counts the rest. */
export const More: Story = {
  render: () => (
    <div className="p-4">
      <FileThumbStack files={CHOSEN} />
    </div>
  ),
};

const LOOKS = ["fan", "row", "pile"] as const;

/**
 * The three looks side by side, for two, three, four and more files. `fan` is the default; the
 * other two are kept as a switch until one is decided.
 */
export const Looks: Story = {
  parameters: { visual: { viewport: { width: 900, height: 420 } } },
  render: () => (
    <div className="grid grid-cols-[4rem_repeat(4,1fr)] items-center gap-x-8 gap-y-8 p-4">
      {LOOKS.map((look) => (
        <div key={look} className="contents">
          <span className="text-sm text-fg-muted">{look}</span>
          {[2, 3, 4, CHOSEN.length].map((count) => (
            <span key={count} className="flex h-20 items-center">
              <FileThumbStack look={look} files={CHOSEN.slice(0, count)} />
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
};

function Growing() {
  const [count, setCount] = useState(1);
  return (
    <div className="flex items-center gap-8 p-4">
      <span className="flex h-20 w-44 items-center">
        <FileThumbStack files={CHOSEN.slice(0, count)} />
      </span>
      <Button data-testid="more" onClick={() => setCount((now) => Math.min(now + 1, 4))}>
        Noch eine wählen
      </Button>
    </div>
  );
}

/** A file that joins seats into its place while the others make room. */
export const Joining: Story = {
  parameters: {
    visual: { motion: [{ name: "join", click: '[data-testid="more"]', frames: 8 }] },
  },
  render: () => <Growing />,
};

/** As a test: the stack is one picture named by its count, and shows no more than `max`. */
export const Named: Story = {
  render: () => <FileThumbStack files={CHOSEN} max={3} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: `${CHOSEN.length} Dateien` })).toBeInTheDocument();
    await expect(document.querySelectorAll('[data-slot="file-thumb-stack-card"]')).toHaveLength(3);
  },
};
