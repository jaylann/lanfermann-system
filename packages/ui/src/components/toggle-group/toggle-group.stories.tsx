import {
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Icon } from "@/components/icon/icon";
import { Toggle } from "@/components/toggle/toggle";

import { ToggleGroup, type ToggleGroupProps } from "./toggle-group";

const meta = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  parameters: {
    visual: {
      viewport: { width: 460, height: 130 },
      target: '[data-slot="toggle"]:nth-of-type(2)',
      motion: [{ name: "press", click: '[data-slot="toggle"]:nth-of-type(2)', frames: 6 }],
    },
  },
} satisfies Meta;

export default meta;
// The group requires a name, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

type Options = Pick<ToggleGroupProps, "size" | "disabled" | "orientation" | "onValueChange">;

const symbol = { sm: 14, md: 16, lg: 18 } as const;

function Marks({ size = "md", ...props }: Options) {
  return (
    <ToggleGroup multiple aria-label="Auszeichnung" defaultValue={["bold"]} size={size} {...props}>
      <Toggle iconOnly aria-label="Fett" value="bold">
        <Icon icon={TextBoldIcon} size={symbol[size]} />
      </Toggle>
      <Toggle iconOnly aria-label="Kursiv" value="italic">
        <Icon icon={TextItalicIcon} size={symbol[size]} />
      </Toggle>
      <Toggle iconOnly aria-label="Unterstrichen" value="underline">
        <Icon icon={TextUnderlineIcon} size={symbol[size]} />
      </Toggle>
    </ToggleGroup>
  );
}

function Alignment(props: Options) {
  return (
    <ToggleGroup aria-label="Ausrichtung" defaultValue={["left"]} {...props}>
      <Toggle iconOnly aria-label="Linksbündig" value="left">
        <Icon icon={TextAlignLeftIcon} size={16} />
      </Toggle>
      <Toggle iconOnly aria-label="Zentriert" value="center">
        <Icon icon={TextAlignCenterIcon} size={16} />
      </Toggle>
      <Toggle iconOnly aria-label="Rechtsbündig" value="right">
        <Icon icon={TextAlignRightIcon} size={16} />
      </Toggle>
    </ToggleGroup>
  );
}

/**
 * Keys that are on each by itself (`multiple`): one fitting, and every key that is down keeps
 * the inner shade of a press.
 */
export const Default: Story = {
  render: () => <Marks />,
};

/** One at most: pressing another key lets the first one up, pressing it again leaves none. */
export const Single: Story = {
  render: () => <Alignment />,
};

/** With words: the states a list is narrowed to. Several may be down. */
export const WithWords: Story = {
  render: () => (
    <ToggleGroup multiple aria-label="Status" defaultValue={["open", "sent"]}>
      <Toggle value="open">Offen</Toggle>
      <Toggle value="sent">Gesendet</Toggle>
      <Toggle value="paid">Bezahlt</Toggle>
      <Toggle value="expired">Abgelaufen</Toggle>
    </ToggleGroup>
  ),
};

/** The three sizes. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 460, height: 150 } } },
  render: () => (
    <div className="flex items-center gap-4">
      <Marks size="sm" />
      <Marks size="md" />
      <Marks size="lg" />
    </div>
  ),
};

/** One over the other, for a narrow column of tools. */
export const Vertical: Story = {
  parameters: { visual: { viewport: { width: 460, height: 190 } } },
  render: () => <Alignment orientation="vertical" />,
};

/** None of its keys can be pressed, and the fitting lies flat. */
export const Disabled: Story = {
  parameters: { visual: { motion: [] } },
  render: () => <Marks disabled />,
};

/** What the group reports in the test below. */
const changed = fn();

/**
 * The keyboard path, as a test: Tab reaches the group once, the arrow keys move between its
 * keys, Space presses one, and the group reports its value as a list.
 */
export const Keyboard: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Marks onValueChange={changed} />
      <Alignment />
    </div>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const key = (name: string) => canvas.getByRole("button", { name });
    changed.mockClear();

    await step("Tab reaches the group once, the arrows move inside it", async () => {
      await userEvent.tab();
      await expect(key("Fett")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(key("Kursiv")).toHaveFocus();
    });

    await step("Space presses a key without letting the others up", async () => {
      await userEvent.keyboard(" ");
      await expect(key("Kursiv")).toHaveAttribute("aria-pressed", "true");
      await expect(key("Fett")).toHaveAttribute("aria-pressed", "true");
      await expect(changed).toHaveBeenLastCalledWith(["bold", "italic"], expect.anything());
    });

    await step("Tab leaves it for the next group, where one key at most is down", async () => {
      await userEvent.tab();
      await expect(key("Linksbündig")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}{Enter}");
      await expect(key("Zentriert")).toHaveAttribute("aria-pressed", "true");
      await expect(key("Linksbündig")).toHaveAttribute("aria-pressed", "false");
    });
  },
};
