import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { expect } from "storybook/test";

import { Checkbox } from "@/components/checkbox/checkbox";

import { CheckboxGroup, CheckboxGroupItems } from "./checkbox-group";

const meta = {
  title: "Components/Checkbox group",
  component: CheckboxGroup,
  parameters: { visual: { viewport: { width: 360, height: 220 } } },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = "flex items-center gap-2.5 text-control text-fg-body";
const services = [
  { value: "website", label: "Website" },
  { value: "google", label: "Google-Profil" },
  { value: "pflege", label: "Monatliche Pflege" },
];

function Services({ disabled }: { disabled?: boolean }) {
  const legend = useId();
  return (
    <div className="flex flex-col gap-3">
      <div id={legend} className="text-control font-medium text-fg">
        Leistungen
      </div>
      <CheckboxGroup
        aria-labelledby={legend}
        defaultValue={["website", "google"]}
        disabled={disabled}
      >
        {services.map((service) => (
          <label key={service.value} className={disabled ? `${row} text-on-disabled` : row}>
            <Checkbox value={service.value} />
            {service.label}
          </label>
        ))}
      </CheckboxGroup>
    </div>
  );
}

/** Several of a few. The value of the group is the list of what is ticked. */
export const Default: Story = {
  parameters: { visual: { target: '[data-slot="checkbox"]' } },
  render: () => <Services />,
};

export const Disabled: Story = {
  render: () => <Services disabled />,
};

function SelectAll({ initial }: { initial: string[] }) {
  const legend = useId();
  const [value, setValue] = useState(initial);
  return (
    <CheckboxGroup
      aria-labelledby={legend}
      value={value}
      onValueChange={setValue}
      allValues={services.map((service) => service.value)}
    >
      <label id={legend} className={`${row} font-medium text-fg`}>
        <Checkbox parent />
        Alle Leistungen
      </label>
      <CheckboxGroupItems>
        {services.map((service) => (
          <label key={service.value} className={row}>
            <Checkbox value={service.value} />
            {service.label}
          </label>
        ))}
      </CheckboxGroupItems>
    </CheckboxGroup>
  );
}

/**
 * A parent stands for all options: ticked when all are, empty when none is, and it wears the
 * dash while it is some. The options are set in, so their boxes start under the parent's text.
 */
export const WithParent: Story = {
  parameters: {
    visual: {
      target: '[data-slot="checkbox"]',
      motion: [{ name: "all", click: '[data-slot="checkbox"]', frames: 8 }],
    },
  },
  render: () => <SelectAll initial={["website"]} />,
};

/**
 * The keyboard path, as a test: every box is a Tab stop and Space ticks it; the parent ticks
 * all, then none, and shows "mixed" in between.
 */
export const Keyboard: Story = {
  render: () => <SelectAll initial={["website"]} />,
  play: async ({ canvas, userEvent, step }) => {
    const box = (name: string) => canvas.getByRole("checkbox", { name });

    await step("Some are ticked: the parent is mixed", async () => {
      await expect(box("Alle Leistungen")).toHaveAttribute("aria-checked", "mixed");
    });

    await step("Space on the parent ticks all", async () => {
      await userEvent.tab();
      await expect(box("Alle Leistungen")).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(box("Alle Leistungen")).toHaveAttribute("aria-checked", "true");
      await expect(box("Google-Profil")).toHaveAttribute("aria-checked", "true");
      await expect(box("Monatliche Pflege")).toHaveAttribute("aria-checked", "true");
    });

    await step("Unticking one option makes the parent mixed again", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await expect(box("Google-Profil")).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(box("Google-Profil")).toHaveAttribute("aria-checked", "false");
      await expect(box("Alle Leistungen")).toHaveAttribute("aria-checked", "mixed");
    });
  },
};
