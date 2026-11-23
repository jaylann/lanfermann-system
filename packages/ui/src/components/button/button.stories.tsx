import { Delete02Icon, Download01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Icon } from "@/components/icon/icon";

import { Button } from "./button";
import { buttonVariants } from "./button-variants";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Entwurf speichern" },
  parameters: { visual: { viewport: { width: 320, height: 120 } } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: everything that deserves a visible button. */
export const Secondary: Story = {};

/** The committed action of a view. One per view. */
export const Primary: Story = { args: { variant: "primary", children: "Angebot senden" } };

/** The ask. Indigo, at most once per view. */
export const Ask: Story = { args: { variant: "ask", children: "Analyse anfragen" } };

/** Only where the danger is real, and never as the default action. */
export const Danger: Story = { args: { variant: "danger", children: "Angebot löschen" } };

/** An action that should not compete: toolbars, rows, cancel. */
export const Quiet: Story = { args: { variant: "quiet", children: "Abbrechen" } };

export const Disabled: Story = { args: { disabled: true, children: "Gesperrt" } };

const VARIANTS = ["primary", "secondary", "ask", "danger", "quiet"] as const;
const LABELS = {
  primary: "Angebot senden",
  secondary: "Entwurf speichern",
  ask: "Analyse anfragen",
  danger: "Löschen",
  quiet: "Abbrechen",
} as const;

/** Every variant in every size. Icons are 14px in `sm`, 16px in `md`, 18px in `lg`. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 900, height: 300 } } },
  render: () => (
    <div className="grid grid-cols-[auto_repeat(5,auto)] items-center gap-x-4 gap-y-5">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="contents">
          <span className="pr-4 text-sm text-fg-muted">{size}</span>
          {VARIANTS.map((variant) => (
            <div key={variant}>
              <Button variant={variant} size={size}>
                {variant === "secondary" && (
                  <Icon
                    icon={PencilEdit02Icon}
                    size={size === "sm" ? 14 : size === "lg" ? 18 : 16}
                  />
                )}
                {LABELS[variant]}
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** German is long. A label never truncates and never wraps; the button grows. */
export const LongLabel: Story = {
  parameters: { visual: { viewport: { width: 420, height: 120 } } },
  render: () => (
    <Button variant="primary">
      <Icon icon={Download01Icon} />
      Auftragsbestätigung herunterladen
    </Button>
  ),
};

/**
 * The action is under way. The spinner takes the label's place, so the width does not jump, and
 * the button keeps focus.
 */
export const Loading: Story = {
  parameters: { visual: { viewport: { width: 560, height: 120 } } },
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary" loading>
        Angebot senden
      </Button>
      <Button loading>Entwurf speichern</Button>
      <Button variant="ask" loading>
        Analyse anfragen
      </Button>
      <Button size="sm" loading>
        Senden
      </Button>
    </div>
  ),
};

/**
 * What was asked for went through: the tick is drawn in the label's place for a moment, at the
 * button's width, as a copy is confirmed.
 */
export const Done: Story = {
  parameters: { visual: { viewport: { width: 560, height: 120 } } },
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary" done>
        Angebot senden
      </Button>
      <Button done>Entwurf speichern</Button>
      <Button size="sm" done>
        Senden
      </Button>
    </div>
  ),
};

/**
 * A label that changes while the button is on screen: with `resize` the button eases to its new
 * width instead of jumping, and the button beside it moves along.
 */
export const Resize: Story = {
  parameters: {
    visual: {
      viewport: { width: 480, height: 120 },
      motion: [{ name: "label", click: '[data-step="label"]' }],
    },
  },
  render: function Render() {
    const [all, setAll] = useState(false);
    return (
      <div className="flex items-center gap-3">
        <Button resize data-step="label" onClick={() => setAll(!all)}>
          {all ? "Nur offene Angebote zeigen" : "Alle zeigen"}
        </Button>
        <Button variant="quiet">Abbrechen</Button>
      </div>
    );
  },
};

/** One icon, no label: it needs an `aria-label`, and usually a tooltip. */
export const IconOnly: Story = {
  parameters: { visual: { viewport: { width: 420, height: 120 } } },
  render: () => (
    <div className="flex items-center gap-3">
      <Button iconOnly size="sm" aria-label="Bearbeiten">
        <Icon icon={PencilEdit02Icon} size={14} />
      </Button>
      <Button iconOnly aria-label="Bearbeiten">
        <Icon icon={PencilEdit02Icon} />
      </Button>
      <Button iconOnly variant="quiet" aria-label="Löschen">
        <Icon icon={Delete02Icon} />
      </Button>
      <Button iconOnly variant="primary" size="lg" aria-label="Herunterladen">
        <Icon icon={Download01Icon} size={18} />
      </Button>
    </div>
  ),
};

/** A link keeps its own semantics: style an `<a>` with `buttonVariants()`. */
export const AsLink: Story = {
  render: () => (
    <a href="#angebot" className={buttonVariants({ variant: "primary" })}>
      Angebot ansehen
    </a>
  ),
};
