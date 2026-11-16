import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 640, height: 420 }, clip: "viewport" },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DeleteDialog(props: { defaultOpen?: boolean }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <AlertDialog {...props}>
        <AlertDialogTrigger render={<Button variant="danger" />}>
          Angebot löschen
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Angebot wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Angebot 2026-0418 und sein PDF werden gelöscht. Das lässt sich nicht rückgängig
              machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button />}>Behalten</AlertDialogClose>
            <AlertDialogClose render={<Button variant="danger" />}>
              Angebot löschen
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** The consequence in the title, the buttons named after what they do. */
export const Open: Story = { render: () => <DeleteDialog defaultOpen /> };

/**
 * The keyboard path, as a test: opening puts the focus on the answer that changes nothing, Tab
 * stays inside, a click beside the dialog does not dismiss it (it wants an answer), and Escape
 * closes it and returns the focus to the trigger.
 */
export const Keyboard: Story = {
  render: () => <DeleteDialog />,
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Angebot löschen" });
    const answer = (name: string) =>
      within(screen.getByRole("alertdialog")).getByRole("button", { name });

    await step("Enter opens it with the focus on the harmless answer", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await screen.findByRole("alertdialog", { name: "Angebot wirklich löschen?" });
      await waitFor(() => expect(answer("Behalten")).toHaveFocus());
    });

    await step("Tab moves between the two answers and wraps", async () => {
      await userEvent.tab();
      await waitFor(() => expect(answer("Angebot löschen")).toHaveFocus());
      await userEvent.tab();
      await waitFor(() => expect(answer("Behalten")).toHaveFocus());
    });

    await step("A click beside the dialog leaves it open", async () => {
      await userEvent.click(document.body);
      await expect(screen.getByRole("alertdialog")).toBeVisible();
    });

    await step("Escape closes it and returns the focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};
