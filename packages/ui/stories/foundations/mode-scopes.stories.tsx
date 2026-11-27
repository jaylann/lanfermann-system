import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Ground } from "@/components/ground/ground";
import { Input } from "@/components/input/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu/menu";
import { Switch } from "@/components/switch/switch";

const meta = {
  title: "Foundations/Mode scopes",
  parameters: { layout: "padded", visual: { viewport: { width: 900, height: 380 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small piece of an app: a bar, a line of text, a field, a switch and both kinds of key. */
function Preview({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col bg-ground text-fg">
      <div className="flex h-9 items-center justify-between border-b border-hairline px-3 text-sm">
        <span className="font-medium">Angebote</span>
        <Badge tone="success">Gesendet</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <p className="text-sm text-fg-muted">Zwölf Angebote sind offen.</p>
        <Input size="sm" aria-label={`Suche, ${label}`} placeholder="Kunde suchen" />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-fg-body">
            <Switch defaultChecked aria-label={`Erinnern, ${label}`} />
            Erinnern
          </label>
          <span className="flex gap-1.5">
            <Button size="sm">Entwurf</Button>
            <Button size="sm" variant="primary">
              Senden
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

const frame = "h-44 w-64 overflow-hidden rounded-xl border border-hairline";

function Choices() {
  return (
    <div className="flex flex-wrap gap-6">
      <figure className="flex flex-col gap-2">
        <Ground ground="paper" mode="light" data-testid="light" className={frame}>
          <Preview label="hell" />
        </Ground>
        <figcaption className="text-sm text-fg-muted">Hell</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <Ground ground="paper" mode="dark" data-testid="dark" className={frame}>
          <Preview label="dunkel" />
        </Ground>
        <figcaption className="text-sm text-fg-muted">Dunkel</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        {/* „System“: the light half and the dark half of one preview, cut down the middle. */}
        <div className={`${frame} relative`}>
          <Ground ground="paper" mode="light" className="absolute inset-0">
            <Preview label="System, hell" />
          </Ground>
          <Ground
            ground="paper"
            mode="dark"
            aria-hidden
            inert
            className="absolute inset-0 [clip-path:inset(0_0_0_50%)]"
          >
            <Preview label="System, dunkel" />
          </Ground>
        </div>
        <figcaption className="text-sm text-fg-muted">System</figcaption>
      </figure>
    </div>
  );
}

/**
 * Both modes on one page, whatever the page's own mode: the thumbnails of an appearance setting.
 * `<Ground mode="light">` stays light on a dark page, `mode="dark"` dark on a light one, and
 * „System“ shows half of each. Switch the toolbar to dark: the first thumbnail does not move.
 */
export const Thumbnails: Story = { render: () => <Choices /> };

/** A ground inside a light scope is light as well: Tint for a quote, Indigo for the ask. */
export const NestedGrounds: Story = {
  parameters: { visual: { viewport: { width: 900, height: 260 } } },
  render: () => (
    <Ground ground="paper" mode="light" className="flex gap-3 rounded-xl bg-ground p-4 text-fg">
      {(["paper", "tint", "indigo", "ink"] as const).map((ground) => (
        <Ground
          key={ground}
          ground={ground}
          className="flex flex-1 flex-col gap-2 rounded-lg border border-hairline bg-ground p-3 text-fg"
        >
          <span className="text-sm font-medium">{ground}</span>
          <span className="text-sm text-fg-muted">Zwölf Angebote sind offen.</span>
          <Button size="sm" className="self-start">
            Ansehen
          </Button>
        </Ground>
      ))}
    </Ground>
  ),
};

/** As a test: the light scope has a light ground and the dark one a dark ground, in either mode. */
export const KeepsItsMode: Story = {
  render: () => <Choices />,
  play: async ({ canvas }) => {
    const lightness = (element: HTMLElement) => {
      const [r = 0, g = 0, b = 0] = (
        getComputedStyle(element.firstElementChild!).backgroundColor.match(/[\d.]+/g) ?? []
      ).map(Number);
      return (r + g + b) / 3;
    };
    await expect(lightness(canvas.getByTestId("light"))).toBeGreaterThan(200);
    await expect(lightness(canvas.getByTestId("dark"))).toBeLessThan(80);
    await expect(getComputedStyle(canvas.getByTestId("light")).colorScheme).toBe("light");
  },
};

/**
 * As a test: a menu opened inside a light scope is portalled to the page and still comes out
 * light, because the sheet carries the scope's mode beside its ground.
 */
export const PopupKeepsTheMode: Story = {
  render: () => (
    <Ground ground="paper" mode="light" className="rounded-xl bg-ground p-6">
      <Menu>
        <MenuTrigger render={<Button>Angebot</Button>} />
        <MenuContent>
          <MenuItem>Bearbeiten</MenuItem>
          <MenuItem>Duplizieren</MenuItem>
        </MenuContent>
      </Menu>
    </Ground>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Angebot" }));
    const sheet = await screen.findByRole("menu");
    await expect(sheet).toHaveAttribute("data-mode", "light");
    await expect(sheet).toHaveAttribute("data-theme", "paper");
    await waitFor(async () => {
      const [r = 0, g = 0, b = 0] = (
        getComputedStyle(sheet).backgroundColor.match(/[\d.]+/g) ?? []
      ).map(Number);
      await expect((r + g + b) / 3).toBeGreaterThan(200);
    });
    await userEvent.keyboard("{Escape}");
  },
};
