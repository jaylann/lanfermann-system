import {
  Analytics01Icon,
  Calendar03Icon,
  Folder01Icon,
  FolderAddIcon,
  Home01Icon,
  Invoice01Icon,
  Logout01Icon,
  NoteEditIcon,
  PaintBoardIcon,
  Search01Icon,
  Settings01Icon,
  UserAdd01Icon,
  UserMultipleIcon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef } from "react";
import { expect, fn, screen, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Shortcut, ShortcutProvider } from "@/components/shortcut/shortcut";

import {
  Command,
  CommandContent,
  type CommandEntry,
  CommandFooter,
  CommandInput,
  CommandList,
  type CommandProps,
  type CommandSection,
  CommandTrigger,
} from "./command";

const meta = {
  title: "Components/Command",
  component: Command,
  // Every story builds its own palette (`Palette`); these only satisfy the component's types.
  args: { items: [], children: null },
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 560 }, clip: "viewport" },
  },
  // The keys are drawn for one keyboard, so the pictures are the same on every machine.
  decorators: [
    (Story) => (
      <ShortcutProvider platform="apple">
        <Story />
      </ShortcutProvider>
    ),
  ],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const customers = [
  "Bäckerei Sonnleitner",
  "Gärtnerei Weiß",
  "Metzgerei Aigner",
  "Schreinerei Huber",
  "Zimmerei Oberhofer",
].map((name) => ({ value: name, label: name }));

function commands(onSelect: (value: string) => void = () => {}): CommandSection[] {
  const does = (value: string) => () => onSelect(value);
  return [
    {
      value: "Vorschläge",
      items: [
        {
          value: "angebot-schreiben",
          label: "Angebot schreiben",
          icon: NoteEditIcon,
          keywords: ["neu", "erstellen"],
          shortcut: "mod+n",
          onSelect: does("angebot-schreiben"),
        },
        {
          value: "rechnung-schreiben",
          label: "Rechnung schreiben",
          icon: Invoice01Icon,
          keywords: ["neu", "erstellen"],
          onSelect: does("rechnung-schreiben"),
        },
        {
          value: "kunden-anlegen",
          label: "Kunden anlegen",
          icon: UserAdd01Icon,
          keywords: ["neu", "erstellen"],
          onSelect: does("kunden-anlegen"),
        },
      ],
    },
    {
      value: "Seiten",
      items: [
        { value: "uebersicht", label: "Übersicht", icon: Home01Icon, onSelect: does("uebersicht") },
        {
          value: "angebote",
          label: "Angebote",
          icon: NoteEditIcon,
          detail: "12 offen",
          onSelect: does("angebote"),
        },
        {
          value: "rechnungen",
          label: "Rechnungen",
          icon: Invoice01Icon,
          onSelect: does("rechnungen"),
        },
        { value: "kunden", label: "Kunden", icon: UserMultipleIcon, onSelect: does("kunden") },
        { value: "termine", label: "Termine", icon: Calendar03Icon, onSelect: does("termine") },
        {
          value: "auswertung",
          label: "Auswertung",
          icon: Analytics01Icon,
          onSelect: does("auswertung"),
        },
        {
          value: "einstellungen",
          label: "Einstellungen",
          icon: Settings01Icon,
          shortcut: "mod+,",
          onSelect: does("einstellungen"),
        },
      ],
    },
    {
      value: "Weiteres",
      items: [
        {
          value: "kunden-zuweisen",
          label: "Kunden zuweisen …",
          icon: UserSwitchIcon,
          page: customers.map((customer) => ({ ...customer, onSelect: does(customer.value) })),
          pagePlaceholder: "z. B. Schreinerei Huber",
        },
        {
          value: "darstellung",
          label: "Darstellung wechseln …",
          icon: PaintBoardIcon,
          page: ["Hell", "Dunkel", "Wie das Gerät"].map((name) => ({
            value: name,
            label: name,
            onSelect: does(name),
          })),
        },
        { value: "abmelden", label: "Abmelden", icon: Logout01Icon, onSelect: does("abmelden") },
      ],
    },
  ];
}

type PaletteProps = Partial<CommandProps> & {
  onSelect?: (value: string) => void;
};

function Palette({ onSelect, ...props }: PaletteProps) {
  return (
    <Command items={commands(onSelect)} locale="de-DE" {...props}>
      <CommandTrigger render={<Button className="w-56 justify-start text-fg-muted" />}>
        <Icon icon={Search01Icon} size={16} />
        Suchen
        <Shortcut keys="mod+k" className="ml-auto" />
      </CommandTrigger>
      <CommandContent>
        <CommandInput placeholder="z. B. Angebot schreiben" />
        <CommandList empty="Zu dieser Suche wurde kein Befehl gefunden." />
        <CommandFooter />
      </CommandContent>
    </Command>
  );
}

/** Closed: the button says where the palette is and which keys open it. Press it, or ⌘K. */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="command-trigger"]',
      motion: [{ name: "open", click: '[data-slot="command-trigger"]', frames: 6 }],
    },
  },
  render: () => <Palette />,
};

/** Open, before anything is typed: the first entry is highlighted and Enter would take it. */
export const Open: Story = {
  parameters: {
    visual: {
      target: '[data-slot="command-item"]:not([data-highlighted])',
      motion: [{ name: "page", click: '[data-slot="command-item"][data-page]', frames: 8 }],
    },
  },
  render: () => <Palette defaultOpen modal={false} />,
};

/** A few letters typed: what matches by label or keyword stays, and the sheet follows. */
export const Filtered: Story = {
  render: () => <Palette defaultOpen modal={false} defaultQuery="ang" />,
};

/** Nothing matches: one sentence that says so, and no button. */
export const NothingFound: Story = {
  render: () => <Palette defaultOpen modal={false} defaultQuery="steuer" />,
};

/** Presses the entry that opens a page once the story stands, for a still picture of it. */
function InPage({ children }: { children: ReactNode }) {
  const pressed = useRef(false);
  useEffect(() => {
    if (pressed.current) return;
    const frame = requestAnimationFrame(() => {
      const entry = document.querySelector<HTMLElement>('[data-slot="command-item"][data-page]');
      if (!entry) return;
      pressed.current = true;
      entry.click();
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return children;
}

/**
 * Inside „Kunden zuweisen“: the page stands before the text as a plug, its entries have taken
 * the list, and Backspace in the empty field goes back.
 */
export const Page: Story = {
  render: () => (
    <InPage>
      <Palette defaultOpen modal={false} />
    </InPage>
  ),
};

/** On a phone it keeps to the top of the window, above the keyboard, and shows no key hints. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 700 }, clip: "viewport" } },
  render: () => <Palette defaultOpen modal={false} />,
};

/** The folders of a link collection, each after the one it is in, with what it holds. */
const folders: { path: string[]; count: number }[] = [
  { path: ["Bewerbung"], count: 3 },
  { path: ["Bewerbung", "Check24"], count: 2 },
  { path: ["Bewerbung", "Check24", "2026"], count: 0 },
  { path: ["Bewerbung", "Check24", "2026", "Zweitgespräch"], count: 4 },
  { path: ["Bewerbung", "Check24", "2026", "Unterlagen für das Zweitgespräch"], count: 12 },
  { path: ["Kunden", "Bäckerei Kornprobst", "Website"], count: 18 },
  { path: ["Kunden", "Gärtnerei Weiß", "Angebotsportal", "Entwürfe"], count: 7 },
  { path: ["Talks"], count: 5 },
  { path: ["Talks", "Ohne Folien"], count: 1 },
];

/**
 * A folder picker's entries: the top level first, where the link is now, so it is shown but
 * cannot be chosen again; then every folder, named by its own name with the folders above it
 * as the `prefix`.
 */
function folderEntries(onSelect: (value: string) => void = () => {}): CommandEntry[] {
  return [
    { value: "top", label: "Ohne Ordner", icon: Home01Icon, detail: "Hier", disabled: true },
    ...folders.map(({ path, count }): CommandEntry => {
      const value = path.join("/");
      return {
        value,
        label: path[path.length - 1] ?? "",
        prefix: path.length > 1 ? `${path.slice(0, -1).join(" / ")} / ` : undefined,
        icon: Folder01Icon,
        detail: count > 0 ? String(count) : undefined,
        onSelect: () => onSelect(value),
      };
    }),
  ];
}

function FolderPicker({
  onSelect,
  items,
  ...props
}: Partial<CommandProps> & { onSelect?: (value: string) => void }) {
  return (
    <Command
      items={items ?? folderEntries(onSelect)}
      label="Ordner wählen"
      locale="de-DE"
      shortcut={false}
      {...props}
    >
      <CommandContent>
        <CommandInput placeholder="z. B. Zweitgespräch" />
        <CommandList empty="Zu dieser Suche wurde kein Ordner gefunden." />
        <CommandFooter />
      </CommandContent>
    </Command>
  );
}

/**
 * A folder picker: the top level stands first and cannot be chosen (the link is there), so the
 * highlight starts on the first folder that can. Each folder is named by its own name; the
 * folders above it lead up to it, muted.
 */
export const Paths: Story = {
  parameters: {
    visual: { target: '[data-slot="command-item"]:not([data-highlighted], [data-disabled])' },
  },
  render: () => <FolderPicker defaultOpen modal={false} />,
};

/**
 * The same in a narrow window: a path gives way from its start, so the folder's own name and
 * the nearest folders above it stay; only a name too long for the row is cut at its end.
 */
export const PathsNarrow: Story = {
  name: "Paths, narrow",
  parameters: { visual: { viewport: { width: 360, height: 560 }, clip: "viewport" } },
  render: () => <FolderPicker defaultOpen modal={false} />,
};

/** A piece of a path typed: folders are found by the folders above them as well. */
export const PathsFiltered: Story = {
  name: "Paths, filtered",
  render: () => <FolderPicker defaultOpen modal={false} defaultQuery="check24 / 2026" />,
};

/** What the palette of the test below was asked to do. */
const chosen = fn<(value: string) => void>();

/**
 * The keyboard path, as a test: ⌘K opens it with the field focused, typing filters, the arrows
 * move the highlight, Enter takes the entry and closes; an entry with a page opens it and
 * Backspace leaves it again; Escape closes and the focus goes back to where it was.
 */
export const Keyboard: Story = {
  render: () => (
    <ShortcutProvider platform="other">
      <Palette onSelect={chosen} />
    </ShortcutProvider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    chosen.mockClear();
    const trigger = canvas.getByRole("button", { name: /Suchen/ });
    const field = () => screen.getByRole("combobox", { name: "Befehle" });
    const highlighted = (name: string | RegExp) =>
      waitFor(() =>
        expect(screen.getByRole("option", { name })).toHaveAttribute("data-highlighted"),
      );

    await step("Strg and K opens the palette with the field focused", async () => {
      trigger.focus();
      await userEvent.keyboard("{Control>}k{/Control}");
      await waitFor(() => expect(field()).toHaveFocus());
      await highlighted(/Angebot schreiben/);
    });

    await step("typing filters by label and by keyword, ignoring accents", async () => {
      await userEvent.keyboard("ubers");
      await highlighted("Übersicht");
      await expect(screen.queryByRole("option", { name: /Rechnungen/ })).not.toBeInTheDocument();
      await userEvent.clear(field());
      await userEvent.keyboard("erstellen");
      await expect(screen.getAllByRole("option")).toHaveLength(3);
    });

    await step("the arrows move the highlight, and Enter takes the entry", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await highlighted(/Rechnung schreiben/);
      await userEvent.keyboard("{Enter}");
      await expect(chosen).toHaveBeenCalledWith("rechnung-schreiben");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });

    await step("an entry with a page opens it instead of closing", async () => {
      await userEvent.keyboard("{Control>}k{/Control}");
      await waitFor(() => expect(field()).toHaveFocus());
      await expect(field()).toHaveValue("");
      await userEvent.keyboard("zuweisen{Enter}");
      await highlighted("Bäckerei Sonnleitner");
      await expect(field()).toHaveValue("");
      await expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    await step("Backspace in the empty field goes back to the first list", async () => {
      await userEvent.keyboard("{Backspace}");
      await highlighted(/Angebot schreiben/);
    });

    await step("Escape closes it and the focus returns", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};

/** The picker of the test below: folders, and an entry that opens a page with a full first row. */
function TestedFolderPicker() {
  return (
    <FolderPicker
      defaultOpen
      items={[
        ...folderEntries(chosen),
        {
          value: "neu",
          label: "Neuen Ordner anlegen …",
          icon: FolderAddIcon,
          pagePlaceholder: "z. B. Bewerbung",
          page: [
            { value: "neu:top", label: "Auf oberster Ebene", detail: "Voll", disabled: true },
            { value: "neu:bewerbung", label: "In Bewerbung", onSelect: () => chosen("neu") },
            { value: "neu:talks", label: "In Talks", onSelect: () => chosen("neu") },
          ],
        },
      ]}
    />
  );
}

/**
 * As a test, with a first row that cannot be chosen: the highlight starts on the first row that
 * can (when the palette opens, after each letter, inside a page and back out of it), so Enter
 * always has something to take. The arrows still stop on every row, the disabled ones too, and
 * a folder is found by the folders above it.
 */
export const KeyboardWithDisabledRows: Story = {
  name: "Keyboard, disabled rows",
  render: () => <TestedFolderPicker />,
  play: async ({ userEvent, step }) => {
    chosen.mockClear();
    const field = () => screen.getByRole("combobox", { name: "Ordner wählen" });
    const row = (name: string | RegExp) => screen.getByRole("option", { name });
    const highlighted = (name: string | RegExp) =>
      waitFor(async () => {
        await expect(row(name)).toHaveAttribute("data-highlighted");
        await expect(
          screen.getAllByRole("option").filter((each) => each.hasAttribute("data-highlighted")),
        ).toHaveLength(1);
      });

    await step("it opens with the first row that can be chosen highlighted", async () => {
      await waitFor(() => expect(field()).toHaveFocus());
      await expect(row(/Ohne Ordner/)).toHaveAttribute("aria-disabled", "true");
      await highlighted("Bewerbung 3");
      await expect(row(/Ohne Ordner/)).not.toHaveAttribute("data-highlighted");
    });

    await step(
      "the arrows still stop on a disabled row, and Enter does nothing there",
      async () => {
        await userEvent.keyboard("{ArrowUp}");
        await highlighted(/Ohne Ordner/);
        await userEvent.keyboard("{Enter}");
        await expect(chosen).not.toHaveBeenCalled();
        await expect(screen.getByRole("dialog")).toBeVisible();
        await userEvent.keyboard("{ArrowDown}");
        await highlighted("Bewerbung 3");
      },
    );

    await step("a query whose first match is disabled highlights the next match", async () => {
      await userEvent.keyboard("ohne");
      await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
      await expect(screen.getAllByRole("option")[0]).toHaveAccessibleName(/Ohne Ordner/);
      await highlighted(/Ohne Folien/);
    });

    await step(
      "a folder is found by a folder above it, and named with its whole path",
      async () => {
        await userEvent.clear(field());
        await highlighted("Bewerbung 3");
        await userEvent.keyboard("gartnerei");
        await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
        await highlighted("Kunden / Gärtnerei Weiß / Angebotsportal / Entwürfe 7");
      },
    );

    await step(
      "a page whose first row is disabled starts on its second, and back again",
      async () => {
        await userEvent.clear(field());
        await userEvent.keyboard("anlegen{Enter}");
        await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(3));
        await highlighted("In Bewerbung");
        await userEvent.keyboard("{Backspace}");
        await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(3));
        await highlighted("Bewerbung 3");
      },
    );

    await step("Enter takes the highlighted folder and closes", async () => {
      await userEvent.keyboard("ohne{Enter}");
      await expect(chosen).toHaveBeenCalledWith("Talks/Ohne Folien");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  },
};
