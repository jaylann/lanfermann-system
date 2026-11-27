import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";
import { Input } from "@/components/input/input";

import { SelectField } from "./select-field";

const meta = {
  title: "Components/SelectField",
  component: SelectField,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 380, height: 150 },
      target: '[data-slot="select-trigger"]',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The states of a project, as a `{ value: label }` record in the order they are listed. */
const STATES = {
  building: "In Arbeit",
  live: "Live",
  paused: "Pausiert",
  archived: "Archiviert",
};

/** A project's state: the label above, the select as wide as the field. */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "open", click: '[data-slot="select-trigger"]', frames: 8 }] },
  },
  render: () => (
    <SelectField
      className="w-64"
      name="status"
      label="Status"
      items={STATES}
      defaultValue="building"
    />
  ),
};

/** Nothing chosen yet: the placeholder in italics, and a line that says what follows. */
export const WithDescription: Story = {
  name: "With description",
  parameters: { visual: { viewport: { width: 380, height: 170 } } },
  render: () => (
    <SelectField
      className="w-64"
      name="status"
      label="Status"
      description="Pausierte Projekte fehlen in der Übersicht."
      items={STATES}
    />
  ),
};

function ProjectForm(props: { errors?: Record<string, string>; defaultValue?: string }) {
  return (
    <Form className="w-72" errors={props.errors}>
      <Field name="name">
        <FieldLabel>Name</FieldLabel>
        <Input defaultValue="Website Bäckerei Kornprobst" />
      </Field>
      <SelectField
        name="status"
        label="Status"
        description="Pausierte Projekte fehlen in der Übersicht."
        items={STATES}
        defaultValue={props.defaultValue}
        required
        requiredMessage="Bitte wählen Sie einen Status."
      />
      <Button type="submit" variant="primary" className="self-start">
        Projekt anlegen
      </Button>
    </Form>
  );
}

/**
 * Required, and silent until the form is sent: then the field says what to do, the error grows
 * in under the help and the trigger takes the focus.
 */
export const Required: Story = {
  parameters: {
    visual: {
      viewport: { width: 380, height: 330 },
      target: '[data-slot="select-trigger"]',
      motion: [{ name: "submit-empty", click: 'button[type="submit"]', frames: 8 }],
    },
  },
  render: () => <ProjectForm />,
};

/** What the server rejected arrives through the form's `errors` and stands in the same line. */
export const Rejected: Story = {
  parameters: { visual: { viewport: { width: 380, height: 330 } } },
  render: () => (
    <ProjectForm
      defaultValue="archived"
      errors={{ status: "Ein neues Projekt kann nicht archiviert angelegt werden." }}
    />
  ),
};

/** Disabled: label and trigger step back together, and the value is not submitted. */
export const Disabled: Story = {
  render: () => (
    <SelectField
      className="w-64"
      name="status"
      label="Status"
      items={STATES}
      defaultValue="live"
      disabled
    />
  ),
};

/** The list, as wide as the trigger; the chosen state carries the disc. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 380, height: 300 }, clip: "viewport" } },
  render: () => (
    <SelectField
      className="w-64"
      name="status"
      label="Status"
      items={STATES}
      defaultValue="live"
      defaultOpen
      modal={false}
    />
  ),
};

/**
 * Beside a text field, in each size: the labels share a baseline, both controls are the same
 * height and their text starts at the same inset; the help lines stand level.
 */
export const BesideAnInput: Story = {
  name: "Beside an input",
  parameters: { visual: { viewport: { width: 620, height: 400 } } },
  render: () => (
    <div className="flex w-[34rem] max-w-full flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="grid grid-cols-2 items-start gap-4">
          <Field name={`name-${size}`}>
            <FieldLabel>Name</FieldLabel>
            <Input size={size} defaultValue="Website Bäckerei Kornprobst" />
            <FieldDescription>So steht es in der Übersicht.</FieldDescription>
          </Field>
          <SelectField
            name={`status-${size}`}
            label="Status"
            description="Pausierte Projekte fehlen dort."
            items={STATES}
            defaultValue="building"
            size={size}
          />
        </div>
      ))}
    </div>
  ),
};

/** On a phone the field takes the width of the form, and the trigger is a full touch target. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 360 }, motion: [] } },
  render: () => (
    <Form className="w-full">
      <Field name="name">
        <FieldLabel>Name</FieldLabel>
        <Input defaultValue="Website Bäckerei Kornprobst" />
      </Field>
      <SelectField
        name="status"
        label="Status"
        description="Pausierte Projekte fehlen in der Übersicht."
        items={STATES}
        defaultValue="building"
      />
      <Button type="submit" variant="primary" className="self-start">
        Projekt anlegen
      </Button>
    </Form>
  ),
};

/**
 * As a test: the label and the help belong to the trigger, a click on the label puts the focus
 * there without opening the list, an empty required field stops the form and says what to do,
 * and what the keyboard chooses is what the form sends.
 */
export const Keyboard: Story = {
  render: () => <ProjectForm />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const trigger = canvas.getByRole("combobox", { name: "Status" });
    const form = canvasElement.querySelector("form");
    if (!form) throw new Error("The story has no form.");
    const sent = () => new FormData(form).get("status");
    const option = (name: string) =>
      within(screen.getByRole("listbox")).getByRole("option", { name });
    const highlighted = (name: string) =>
      waitFor(async () => {
        await expect(option(name)).toHaveAttribute("data-highlighted");
        await expect(option(name)).toHaveFocus();
      });

    await step("The label names the trigger and the help describes it", async () => {
      await expect(trigger).toHaveAccessibleName("Status");
      await expect(trigger).toHaveAccessibleDescription(
        "Pausierte Projekte fehlen in der Übersicht.",
      );
      await expect(trigger).toHaveTextContent("Bitte wählen");
      await expect(sent()).toBe("");
    });

    await step(
      "A click on the label puts the focus on the trigger and leaves it closed",
      async () => {
        await userEvent.click(canvas.getByText("Status"));
        await expect(trigger).toHaveFocus();
        await expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      },
    );

    await step("Sent empty, the form stops and the field says what to do", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Projekt anlegen" }));
      const error = await canvas.findByText("Bitte wählen Sie einen Status.");
      await waitFor(() => expect(error).toBeVisible());
      // One line, not the browser's sentence beside it.
      await expect(canvasElement.querySelectorAll('[data-slot="field-error"]')).toHaveLength(1);
      await expect(trigger).toHaveAttribute("aria-invalid", "true");
      await expect(trigger).toHaveAccessibleDescription(/Bitte wählen Sie einen Status\./);
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step("Tab reaches the trigger, ArrowDown opens the list, Enter chooses", async () => {
      await userEvent.click(canvas.getByLabelText("Name"));
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("listbox")).toBeVisible());
      await highlighted("In Arbeit");
      await userEvent.keyboard("{ArrowDown}");
      await highlighted("Live");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await expect(trigger).toHaveTextContent("Live");
      await expect(trigger).toHaveFocus();
    });

    await step(
      "The form carries the value under the field's name, and the error is gone",
      async () => {
        await expect(sent()).toBe("live");
        await waitFor(() =>
          expect(canvas.queryByText("Bitte wählen Sie einen Status.")).not.toBeInTheDocument(),
        );
        await expect(trigger).not.toHaveAttribute("aria-invalid");
      },
    );
  },
};
