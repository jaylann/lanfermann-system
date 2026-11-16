import {
  Add01Icon,
  Archive02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Copy01Icon,
  Download01Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu/menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select/select";
import { ChevronDownGlyph } from "@/internal/glyphs";

import { ButtonGroup, type ButtonGroupProps } from "./button-group";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: {
    visual: {
      viewport: { width: 520, height: 140 },
      target: "[data-group-key]:nth-of-type(2)",
      motion: [{ name: "press", press: "[data-group-key]:nth-of-type(2)", frames: 6 }],
    },
  },
} satisfies Meta;

export default meta;
// The group requires a name, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

type Options = Pick<ButtonGroupProps, "variant" | "size" | "disabled">;

function QuoteActions(props: Options) {
  return (
    <ButtonGroup aria-label="Angebot A-2026-041" {...props}>
      <Button>
        <Icon icon={Copy01Icon} size={props.size === "sm" ? 14 : 16} />
        Duplizieren
      </Button>
      <Button>
        <Icon icon={Download01Icon} size={props.size === "sm" ? 14 : 16} />
        Als PDF
      </Button>
      <Button>
        <Icon icon={Archive02Icon} size={props.size === "sm" ? 14 : 16} />
        Archivieren
      </Button>
    </ButtonGroup>
  );
}

/** Three steps on the same thing: one fitting, three keys, a seam between two of them. */
export const Default: Story = {
  render: () => <QuoteActions />,
};

function SendSplit({ defaultOpen, ...props }: Options & { defaultOpen?: boolean }) {
  return (
    <ButtonGroup aria-label="Angebot senden" variant="primary" {...props}>
      <Button>Angebot senden</Button>
      <Menu modal={false} defaultOpen={defaultOpen}>
        <MenuTrigger
          render={<Button iconOnly aria-label="Weitere Wege zu senden" className="group/more" />}
        >
          <ChevronDownGlyph className="transition-[rotate] spring-seat group-data-popup-open/more:rotate-180 motion-reduce:transition-none" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem>
            <Icon icon={Clock01Icon} size={16} />
            Morgen um 8 Uhr senden
          </MenuItem>
          <MenuItem>
            <Icon icon={Download01Icon} size={16} />
            Als PDF herunterladen
          </MenuItem>
        </MenuContent>
      </Menu>
    </ButtonGroup>
  );
}

/** An action and the menu of its other forms: the committed key, split. */
export const Split: Story = {
  parameters: {
    visual: {
      target: "[data-group-key]:first-of-type",
      motion: [
        { name: "press", press: "[data-group-key]:first-of-type", frames: 6 },
        { name: "open", click: "[data-group-key]:nth-of-type(2)", frames: 8 },
      ],
    },
  },
  render: () => <SendSplit />,
};

/** The menu open: the key that opened it stays marked, and its chevron has turned over. */
export const SplitOpen: Story = {
  parameters: { visual: { viewport: { width: 520, height: 220 }, clip: "viewport" } },
  render: () => <SendSplit defaultOpen />,
};

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "xrechnung", label: "XRechnung" },
  { value: "csv", label: "CSV" },
];

/** A choice and the action that uses it: the select's trigger is a key of the same fitting. */
export const WithSelect: Story = {
  parameters: {
    visual: {
      target: "[data-group-key]:first-of-type",
      motion: [{ name: "press", press: "[data-group-key]:last-of-type", frames: 6 }],
    },
  },
  render: () => (
    <ButtonGroup aria-label="Rechnung exportieren">
      <Select items={FORMATS} defaultValue="pdf" modal={false}>
        <SelectTrigger aria-label="Format" />
        <SelectContent>
          {FORMATS.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button>Exportieren</Button>
    </ButtonGroup>
  ),
};

/** A pair of arrows: keys that hold one icon are square, and each has a name. */
export const Icons: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 120 },
      target: "[data-group-key]:first-of-type",
      motion: [{ name: "press", press: "[data-group-key]:first-of-type", frames: 6 }],
    },
  },
  render: () => (
    <ButtonGroup aria-label="Zwischen Angeboten blättern">
      <Button iconOnly aria-label="Vorheriges Angebot">
        <Icon icon={ArrowLeft01Icon} size={16} />
      </Button>
      <Button iconOnly aria-label="Nächstes Angebot">
        <Icon icon={ArrowRight01Icon} size={16} />
      </Button>
    </ButtonGroup>
  ),
};

/** The three sizes of a control. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 560, height: 220 } } },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <QuoteActions size="sm" />
      <QuoteActions size="md" />
      <QuoteActions size="lg" />
    </div>
  ),
};

/** The neutral fitting, the committed key and the ask. A view has one ask at most. */
export const Tones: Story = {
  parameters: { visual: { viewport: { width: 560, height: 220 } } },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <QuoteActions />
      <QuoteActions variant="primary" />
      <QuoteActions variant="ask" />
    </div>
  ),
};

/** One over the other: the seam runs across. */
export const Vertical: Story = {
  parameters: {
    visual: {
      viewport: { width: 320, height: 160 },
      target: "[data-group-key]:first-of-type",
      motion: [{ name: "press", press: "[data-group-key]:first-of-type", frames: 6 }],
    },
  },
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Ansicht vergrößern oder verkleinern">
      <Button iconOnly aria-label="Vergrößern">
        <Icon icon={Add01Icon} size={16} />
      </Button>
      <Button iconOnly aria-label="Verkleinern">
        <Icon icon={MinusSignIcon} size={16} />
      </Button>
    </ButtonGroup>
  ),
};

/** A key that cannot be pressed lies flat in the fitting; a whole group that cannot, lies flat. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 560, height: 170 } } },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup aria-label="Angebot A-2026-041">
        <Button>Duplizieren</Button>
        <Button disabled>Als PDF</Button>
        <Button>Archivieren</Button>
      </ButtonGroup>
      <QuoteActions disabled />
    </div>
  ),
};

/**
 * The keyboard path, as a test: the group has a name, Tab goes from key to key, Enter on the
 * chevron opens its menu on the first row, and Escape gives the focus back to the chevron.
 */
export const Keyboard: Story = {
  render: () => <SendSplit />,
  play: async ({ canvas, userEvent, step }) => {
    const send = canvas.getByRole("button", { name: "Angebot senden" });
    const more = canvas.getByRole("button", { name: "Weitere Wege zu senden" });

    await step("The group is named", async () => {
      await expect(canvas.getByRole("group", { name: "Angebot senden" })).toBeVisible();
    });

    await step("Tab goes from key to key", async () => {
      await userEvent.tab();
      await expect(send).toHaveFocus();
      await userEvent.tab();
      await expect(more).toHaveFocus();
    });

    await step("Enter opens the menu on its first row", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: "Morgen um 8 Uhr senden" })).toHaveFocus(),
      );
    });

    await step("Escape closes it, and the focus is back on the chevron", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(more).toHaveFocus());
    });
  },
};
