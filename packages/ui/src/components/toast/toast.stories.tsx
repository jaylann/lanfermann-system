import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";

import { toast, Toaster } from "./toast";

const meta = {
  title: "Components/Toast",
  component: Toaster,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 560, height: 420 }, clip: "viewport" },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press a few: they stack, newest in front. Hover the stack to spread it; swipe one away. */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "enter", click: '[data-slot="button"]', frames: 8 }] },
  },
  render: () => (
    <div className="flex min-h-[420px] flex-wrap content-start items-start gap-3 p-8">
      <Button onClick={() => toast("Entwurf gespeichert.")}>Speichern</Button>
      <Button
        onClick={() =>
          toast({
            title: "Angebot gesendet.",
            description: "An max@schreinerei-mustermann.de",
            tone: "success",
            action: { label: "Rückgängig", onClick: () => toast("Senden zurückgenommen.") },
          })
        }
      >
        Senden
      </Button>
      <Button
        onClick={() =>
          toast({
            title: "Das Angebot konnte nicht gesendet werden.",
            description: "Prüfen Sie die E-Mail-Adresse und senden Sie es erneut.",
            tone: "danger",
            timeout: 0,
          })
        }
      >
        Fehler
      </Button>
      <Button
        onClick={() =>
          void toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: { title: "PDF wird erstellt …" },
            success: { title: "PDF erstellt." },
            error: { title: "Das PDF konnte nicht erstellt werden." },
          })
        }
      >
        PDF erstellen
      </Button>
      <Toaster />
    </div>
  ),
};

function Seed({ expanded }: { expanded?: boolean }) {
  useEffect(() => {
    toast({ id: "seed-1", title: "Entwurf gespeichert.", timeout: 0 });
    toast({
      id: "seed-2",
      title: "Ihr Tarif endet am 30. November.",
      description: "Verlängern Sie bis dahin, damit Ihre Website online bleibt.",
      tone: "warning",
      timeout: 0,
    });
    toast({
      id: "seed-3",
      title: "Angebot gesendet.",
      description: "An max@schreinerei-mustermann.de",
      tone: "success",
      timeout: 0,
      action: { label: "Rückgängig", onClick: () => undefined },
    });
    if (expanded) {
      // Focus spreads the stack, as hovering does.
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-slot="toast-viewport"]')?.focus();
      });
    }
    return () => toast.dismiss();
  }, [expanded]);
  return (
    <div className="min-h-[420px]">
      <Toaster />
    </div>
  );
}

/** Three toasts, collapsed: the older ones peek out behind the newest. */
export const Stack: Story = { render: () => <Seed /> };

/** The same stack with the focus in it: spread into a list. */
export const Expanded: Story = { render: () => <Seed expanded /> };

function SeedUndo() {
  useEffect(() => {
    toast({
      id: "undo",
      title: "In den Papierkorb gelegt.",
      timeout: 0,
      action: { label: "Rückgängig", onClick: () => undefined },
    });
    return () => toast.dismiss();
  }, []);
  return (
    <div className="min-h-[420px]">
      <Toaster />
    </div>
  );
}

/** One line with its way back: the key and the cross stand in the middle of its height. */
export const WithUndo: Story = { render: () => <SeedUndo /> };

/**
 * The keyboard path, as a test: a toast does not take the focus, F6 jumps to the stack, Tab
 * reaches the toast and its close button, and dismissing it puts the focus back where it was.
 */
export const Keyboard: Story = {
  // The stack is one store for the whole page: leave nothing behind for the next story.
  beforeEach: () => () => toast.dismiss(),
  render: () => (
    <div className="min-h-[420px] p-8">
      <Button onClick={() => toast({ title: "Entwurf gespeichert.", timeout: 0 })}>
        Speichern
      </Button>
      <Toaster />
    </div>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const button = canvas.getByRole("button", { name: "Speichern" });

    await step("A toast appears and leaves the focus where it was", async () => {
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      await expect(await screen.findByText("Entwurf gespeichert.")).toBeInTheDocument();
      await expect(button).toHaveFocus();
    });

    await step("F6 jumps to the stack, Tab reaches the toast and its close button", async () => {
      await userEvent.keyboard("{F6}");
      const stack = screen.getByRole("region", { name: "Benachrichtigungen" });
      await expect(stack).toHaveFocus();
      await userEvent.tab();
      await expect(within(stack).getByRole("dialog")).toHaveFocus();
      await userEvent.tab();
      await expect(within(stack).getByRole("button", { name: "Schließen" })).toHaveFocus();
    });

    await step("Enter dismisses the toast and the focus goes back", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.queryByText("Entwurf gespeichert.")).not.toBeInTheDocument(),
      );
      await expect(button).toHaveFocus();
    });
  },
};
