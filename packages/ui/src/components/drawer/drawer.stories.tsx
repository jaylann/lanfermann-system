import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { expect, screen, waitFor, within } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Checkbox } from "@/components/checkbox/checkbox";
import { CheckboxGroup } from "@/components/checkbox-group/checkbox-group";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  type DrawerSide,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 390, height: 640 }, clip: "viewport" },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = "flex items-center gap-2.5 text-control text-fg-body";

function FilterDrawer(props: { defaultOpen?: boolean }) {
  const legend = useId();
  return (
    <div className="flex min-h-[640px] items-start justify-center p-6">
      <Drawer {...props}>
        <DrawerTrigger render={<Button />}>Filter</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Angebote filtern.</DrawerTitle>
            <DrawerDescription>Es werden nur Angebote mit diesem Status gezeigt.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div id={legend} className="mb-3 text-control font-medium text-fg">
              Status
            </div>
            <CheckboxGroup aria-labelledby={legend} defaultValue={["entwurf", "gesendet"]}>
              <label className={row}>
                <Checkbox value="entwurf" />
                Entwurf
              </label>
              <label className={row}>
                <Checkbox value="gesendet" />
                Gesendet
              </label>
              <label className={row}>
                <Checkbox value="angenommen" />
                Angenommen
              </label>
              <label className={row}>
                <Checkbox value="ueberfaellig" />
                Überfällig
              </label>
            </CheckboxGroup>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="quiet" />}>Zurücksetzen</DrawerClose>
            <DrawerClose render={<Button variant="primary" />}>Anwenden</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/**
 * A sheet from the bottom, for a phone: it arrives from its edge, follows the finger, and can be
 * thrown back down. The grabber says so.
 */
export const Default: Story = {
  parameters: {
    visual: { motion: [{ name: "open", click: '[data-slot="drawer-trigger"]', frames: 8 }] },
  },
  render: () => <FilterDrawer />,
};

export const Open: Story = { render: () => <FilterDrawer defaultOpen /> };

function DetailDrawer({ side, defaultOpen }: { side: DrawerSide; defaultOpen?: boolean }) {
  return (
    <div className="flex min-h-[560px] items-start justify-center p-6">
      <Drawer side={side} defaultOpen={defaultOpen}>
        <DrawerTrigger render={<Button />}>Angebot 2026-0421</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Schreinerei Mustermann.</DrawerTitle>
            <DrawerDescription>Website und Google-Profil, Angebot 2026-0421.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-control">
              <dt className="text-fg-muted">Status</dt>
              <dd>
                <Badge>Entwurf</Badge>
              </dd>
              <dt className="text-fg-muted">Betrag</dt>
              <dd className="text-fg tabular-nums">2.780,00 €</dd>
              <dt className="text-fg-muted">Gültig bis</dt>
              <dd className="text-fg tabular-nums">30.11.2026</dd>
              <dt className="text-fg-muted">Ansprechpartner</dt>
              <dd className="text-fg">Max Mustermann</dd>
            </dl>
          </DrawerBody>
          <DrawerFooter className="mt-auto">
            <DrawerClose render={<Button variant="quiet" />}>Schließen</DrawerClose>
            <Button variant="primary">Angebot senden</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/** From the right: the detail of a row, next to the list it belongs to. */
export const Right: Story = {
  parameters: {
    visual: {
      viewport: { width: 900, height: 560 },
      motion: [{ name: "open", click: '[data-slot="drawer-trigger"]', frames: 8 }],
    },
  },
  render: () => <DetailDrawer side="right" />,
};

export const RightOpen: Story = {
  parameters: { visual: { viewport: { width: 900, height: 560 } } },
  render: () => <DetailDrawer side="right" defaultOpen />,
};

/** From the left, where navigation lives. */
export const LeftOpen: Story = {
  parameters: { visual: { viewport: { width: 900, height: 560 } } },
  render: () => <DetailDrawer side="left" defaultOpen />,
};

/**
 * The keyboard path, as a test: opening moves the focus to the sheet, Tab walks its controls and
 * stays inside it in both directions, and Escape closes it and returns the focus to the trigger.
 */
export const Keyboard: Story = {
  render: () => <FilterDrawer />,
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Filter" });

    // Unlike a dialog, a drawer takes the focus itself: on a phone the first field would
    // otherwise call up the keyboard over the sheet that has just arrived.
    await step("Enter opens the drawer and the focus moves to the sheet", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      const drawer = await screen.findByRole("dialog", { name: "Angebote filtern." });
      await waitFor(() => expect(drawer).toHaveFocus());
    });

    await step("Tab reaches the first control inside", async () => {
      await userEvent.tab();
      const drawer = screen.getByRole("dialog");
      await waitFor(() =>
        expect(within(drawer).getByRole("checkbox", { name: "Entwurf" })).toHaveFocus(),
      );
    });

    await step("Tab and Shift+Tab never leave the drawer", async () => {
      const drawer = screen.getByRole("dialog");
      // At either end a focus guard catches the focus and hands it back in, a moment later.
      const staysInside = () =>
        waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement));
      // More presses than the drawer has stops: the focus has to wrap around inside it.
      for (let press = 0; press < 9; press++) {
        await userEvent.tab();
        await staysInside();
      }
      for (let press = 0; press < 9; press++) {
        await userEvent.tab({ shift: true });
        await staysInside();
      }
    });

    await step("Escape closes the drawer and returns the focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};
