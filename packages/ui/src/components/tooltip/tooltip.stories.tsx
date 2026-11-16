import { Copy01Icon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Kbd } from "@/components/kbd/kbd";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { visual: { viewport: { width: 360, height: 170 }, clip: "viewport" } },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Labels for controls without one. Inside a provider, the neighbours of an open tooltip open at
 * once. Hover the first, then move along.
 */
export const Toolbar: Story = {
  parameters: {
    visual: { motion: [{ name: "show", hover: '[data-slot="tooltip-trigger"]', frames: 8 }] },
  },
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button iconOnly variant="quiet" aria-label="Bearbeiten">
                <Icon icon={PencilEdit02Icon} />
              </Button>
            }
          />
          <TooltipContent>Bearbeiten</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button iconOnly variant="quiet" aria-label="Duplizieren">
                <Icon icon={Copy01Icon} />
              </Button>
            }
          />
          <TooltipContent>Duplizieren</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button iconOnly variant="quiet" aria-label="Löschen">
                <Icon icon={Delete02Icon} />
              </Button>
            }
          />
          <TooltipContent>Löschen</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

/** Held open for the screenshots. It speaks on Ink on every ground, and may name a shortcut. */
export const Open: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger
        render={
          <Button iconOnly aria-label="Duplizieren">
            <Icon icon={Copy01Icon} />
          </Button>
        }
      />
      <TooltipContent className="flex items-center gap-2">
        Duplizieren
        <span className="flex gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>D</Kbd>
        </span>
      </TooltipContent>
    </Tooltip>
  ),
};
