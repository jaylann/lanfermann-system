import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Input } from "@/components/input/input";
import { Textarea } from "@/components/textarea/textarea";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 720, height: 560 }, clip: "viewport" },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function SendDialog(props: { defaultOpen?: boolean }) {
  return (
    <div className="flex min-h-[560px] items-center justify-center">
      <Dialog {...props}>
        <DialogTrigger render={<Button variant="primary" />}>Angebot senden</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Angebot senden.</DialogTitle>
            <DialogDescription>
              Die Schreinerei Mustermann erhält das Angebot als PDF und einen Link zum Annehmen.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field>
              <FieldLabel>E-Mail-Adresse</FieldLabel>
              <Input type="email" defaultValue="max@schreinerei-mustermann.de" />
            </Field>
            <Field>
              <FieldLabel>Nachricht</FieldLabel>
              <Textarea defaultValue="Guten Tag Herr Mustermann, anbei unser Angebot für Ihre neue Website." />
              <FieldDescription>Steht über dem Angebot in der E-Mail.</FieldDescription>
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="quiet" />}>Abbrechen</DialogClose>
            <DialogClose render={<Button variant="primary" />}>Jetzt senden</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** The sheet rises into place over a dimmed page; it leaves by fading. */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "open", click: '[data-slot="dialog-trigger"]', frames: 8 }] },
  },
  render: () => <SendDialog />,
};

export const Open: Story = { render: () => <SendDialog defaultOpen /> };

/**
 * The keyboard path, as a test: opening moves the focus to the first field, Tab stays inside the
 * dialog in both directions, and Escape closes it and returns the focus to the trigger.
 */
export const Keyboard: Story = {
  render: () => <SendDialog />,
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Angebot senden" });

    await step("Enter opens the dialog with the focus in its first field", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      const dialog = await screen.findByRole("dialog", { name: "Angebot senden." });
      await waitFor(() =>
        expect(within(dialog).getByRole("textbox", { name: "E-Mail-Adresse" })).toHaveFocus(),
      );
    });

    await step("Tab and Shift+Tab never leave the dialog", async () => {
      const dialog = screen.getByRole("dialog");
      // At either end a focus guard catches the focus and hands it back in, a moment later.
      const staysInside = () =>
        waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
      // More presses than the dialog has stops: the focus has to wrap around inside it.
      for (let press = 0; press < 7; press++) {
        await userEvent.tab();
        await staysInside();
      }
      for (let press = 0; press < 7; press++) {
        await userEvent.tab({ shift: true });
        await staysInside();
      }
    });

    await step("Escape closes the dialog and returns the focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};
