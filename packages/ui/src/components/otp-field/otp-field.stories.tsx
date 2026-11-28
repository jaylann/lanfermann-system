import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";

import { OtpField, type OtpFieldProps } from "./otp-field";

const meta = {
  title: "Components/OtpField",
  component: OtpField,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 440, height: 190 },
      target: '[data-slot="otp-field-slot"]',
    },
  },
} satisfies Meta<typeof OtpField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Code({ invalid, disabled, ...props }: OtpFieldProps & { invalid?: boolean }) {
  return (
    <Field invalid={invalid} disabled={disabled}>
      <FieldLabel>Bestätigungscode</FieldLabel>
      <OtpField {...props} />
      {invalid && (
        <FieldError match>
          Dieser Code stimmt nicht. Bitte prüfen Sie die letzte Nachricht.
        </FieldError>
      )}
      <FieldDescription>Wir haben ihn an die Nummer mit der Endung 42 gesendet.</FieldDescription>
    </Field>
  );
}

/**
 * Six slots in threes, each three sharing one socket. Type a digit: it seats into its slot and
 * the halo glides on to the next. Paste a code: every slot is filled, one digit after the other.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "type", click: '[data-slot="otp-field-input"]', type: "4", frames: 6 },
        { name: "paste", click: '[data-slot="otp-field-input"]', paste: "482913", frames: 8 },
      ],
    },
  },
  render: () => <Code />,
};

/** `variant="separate"`: every slot is a socket of its own. */
export const Separate: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "type", click: '[data-slot="otp-field-input"]', type: "4", frames: 6 },
        { name: "paste", click: '[data-slot="otp-field-input"]', paste: "482913", frames: 8 },
      ],
    },
  },
  render: () => <Code variant="separate" />,
};

/**
 * `fill`: the slots share the width of the field's place, for a dialog or a narrow card. The
 * label and the hint stay where they are.
 */
export const Fill: Story = {
  parameters: { visual: { viewport: { width: 440, height: 330 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Code fill defaultValue="482" />
      <Code fill variant="separate" defaultValue="482" />
    </div>
  ),
};

/** A code that is all there. It stands still when the page loads. */
export const Filled: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Code defaultValue="482913" />
      <Code variant="separate" defaultValue="482913" />
    </div>
  ),
  parameters: { visual: { viewport: { width: 440, height: 330 } } },
};

/** A wrong code: said in words under the field, and the slots take the danger edge. */
export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Code invalid defaultValue="482913" />
      <Code invalid variant="separate" defaultValue="482913" />
    </div>
  ),
  parameters: { visual: { viewport: { width: 440, height: 400 } } },
};

/** `mask`: the system's disc stands for each character, for a code that others must not read. */
export const Masked: Story = {
  render: () => <Code mask defaultValue="4829" />,
};

/** Not to be filled in right now: the slots lie flat. */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Code disabled defaultValue="482" />
      <Code disabled variant="separate" defaultValue="482" />
    </div>
  ),
  parameters: { visual: { viewport: { width: 440, height: 330 } } },
};

/** Eight characters in fours, letters allowed: a recovery code. */
export const Recovery: Story = {
  parameters: { visual: { viewport: { width: 520, height: 190 } } },
  render: () => (
    <Field>
      <FieldLabel>Wiederherstellungscode</FieldLabel>
      <OtpField
        length={8}
        groupSize={4}
        validationType="alphanumeric"
        defaultValue="K7QD"
        slotLabel={(position, length) => `Zeichen ${position} von ${length}`}
      />
      <FieldDescription>
        Einer der Codes, die Sie bei der Einrichtung gespeichert haben.
      </FieldDescription>
    </Field>
  ),
};

/** On a phone the six slots keep their size and fit the page; the text is 16px or larger. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 190 } } },
  render: () => <Code defaultValue="48" />,
};

/** What the field reports in the test below. */
const completed = fn();

/**
 * The keyboard path, as a test: typing moves from slot to slot, Backspace goes back, a letter
 * is not taken, a pasted code fills every slot, and the field says when the code is complete.
 */
export const Keyboard: Story = {
  render: () => <Code onValueComplete={completed} name="code" />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    completed.mockClear();
    const slots = () => canvas.getAllByRole("textbox");
    const code = () =>
      slots()
        .map((slot) => (slot as HTMLInputElement).value)
        .join("");

    await step(
      "the slots are named: the first by the label, the others by their place",
      async () => {
        await expect(slots()).toHaveLength(6);
        await expect(slots()[0]).toHaveAccessibleName("Bestätigungscode");
        await expect(slots()[3]).toHaveAccessibleName("Ziffer 4 von 6");
        await expect(slots()[0]).toHaveAttribute("autocomplete", "one-time-code");
        await expect(slots()[0]).toHaveAttribute("inputmode", "numeric");
      },
    );

    await step("typing moves on, a letter is not taken, Backspace goes back", async () => {
      await userEvent.tab();
      await expect(slots()[0]).toHaveFocus();
      await userEvent.keyboard("48x2");
      await expect(code()).toBe("482");
      await expect(slots()[3]).toHaveFocus();
      await userEvent.keyboard("{Backspace}");
      await expect(code()).toBe("48");
      await expect(slots()[2]).toHaveFocus();
    });

    await step("a pasted code fills every slot and completes the field", async () => {
      slots()[0]?.focus();
      const data = new DataTransfer();
      data.setData("text/plain", "731 905");
      // Firefox drops `clipboardData` from the constructor's options, so the event is given it.
      const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(paste, "clipboardData", { value: data });
      slots()[0]?.dispatchEvent(paste);
      await waitFor(() => expect(code()).toBe("731905"));
      await expect(completed).toHaveBeenLastCalledWith("731905", expect.anything());
      await expect(canvasElement.querySelector('input[name="code"]')).toHaveValue("731905");
    });
  },
};

/** A code the page holds, and empties when a new one is asked for. */
function Emptied() {
  const [value, setValue] = useState("482913");
  return (
    <div className="flex flex-col items-start gap-4">
      <Code value={value} onValueChange={setValue} />
      <Button onClick={() => setValue("")}>Neuen Code anfordern</Button>
    </div>
  );
}

/**
 * As a test: a controlled field that was emptied from outside (a wrong code, a new one asked
 * for). A code pasted into it afterwards still counts as arriving in one go, so its digits seat
 * one after the other.
 */
export const PastedAfterEmptied: Story = {
  render: () => <Emptied />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const slots = () => canvas.getAllByRole<HTMLInputElement>("textbox");
    await userEvent.click(canvas.getByRole("button", { name: "Neuen Code anfordern" }));
    await waitFor(() => expect(slots()[0]).toHaveValue(""));
    slots()[0]?.focus();
    const data = new DataTransfer();
    data.setData("text/plain", "731905");
    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: data });
    slots()[0]?.dispatchEvent(paste);
    await waitFor(() => expect(slots()[5]).toHaveValue("5"));
    await expect(canvasElement.querySelector('[data-slot="otp-field"]')).toHaveAttribute(
      "data-burst",
    );
  },
};
