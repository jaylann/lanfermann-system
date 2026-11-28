import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { FileTile } from "@/components/file-tile/file-tile";
import { FILES } from "@/components/file-tile/story-files";
import { cn } from "@/lib/cn";

import { EditableName } from "./editable-name";

const meta = {
  title: "Components/EditableName",
  component: EditableName,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 300 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The names already taken in the folder. */
const TAKEN = ["thumbnail.webp", "badge_neu.webp"];

/** Refuses a name that is taken or holds a slash, as a file browser's server would. */
function check(name: string): string | undefined {
  if (TAKEN.includes(name)) return "Diesen Namen gibt es hier schon.";
  if (name.includes("/")) return "Ein Name enthält keinen Schrägstrich.";
  return undefined;
}

function Renaming({
  initial = "hero.webp",
  editing: startEditing = false,
  onRename,
}: {
  initial?: string;
  editing?: boolean;
  onRename?: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const [editing, setEditing] = useState(startEditing);
  return (
    <div className="flex w-64 flex-col items-start gap-3">
      <div className="flex w-full text-control font-medium text-fg">
        <EditableName
          value={name}
          editing={editing}
          onEditingChange={setEditing}
          onRename={(next) => {
            const refused = check(next);
            if (refused) return refused;
            onRename?.(next);
            setName(next);
            return undefined;
          }}
        />
      </div>
      <Button size="sm" onClick={() => setEditing(true)}>
        Umbenennen
      </Button>
    </div>
  );
}

/** At rest the name is cut in its middle; being changed, only its base name is selected. */
export const Default: Story = {
  render: () => (
    <div className="flex gap-10">
      <Renaming initial="Angebot_Kowalski_Herbst_endgueltig.pdf" />
      <Renaming initial="Angebot_Kowalski_Herbst.pdf" editing />
    </div>
  ),
};

/** A refused name stays in the field, the reason under it in words, the name underlined. */
function Refused() {
  const [editing, setEditing] = useState(true);
  return (
    <div className="flex w-64 text-control font-medium text-fg">
      <EditableName
        value="hero.webp"
        editing={editing}
        onEditingChange={setEditing}
        onRename={check}
      />
    </div>
  );
}

export const RefusedName: Story = {
  render: () => <Refused />,
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.clear(field);
    await userEvent.type(field, "badge_neu.webp{Enter}");
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Diesen Namen gibt es hier schon.",
    );
    await expect(field).toHaveAttribute("aria-invalid", "true");
  },
};

/** In a tile the field stands in the name's place under the picture. */
function InTile() {
  const [name, setName] = useState(FILES[0]!.name);
  const [editing, setEditing] = useState(true);
  return (
    <div className="w-48">
      <FileTile
        {...FILES[0]!}
        name={name}
        nameSlot={
          <EditableName
            value={name}
            editing={editing}
            onEditingChange={setEditing}
            onRename={(next) => {
              setName(next);
              return undefined;
            }}
          />
        }
      />
    </div>
  );
}

export const InATile: Story = {
  parameters: { visual: { viewport: { width: 400, height: 320 } } },
  render: () => <InTile />,
};

/** A link's title: it may be missing, and a long one wraps in the pane. */
const TITLE = "Anmeldung zum Herbstfest der Schreinerei Huber am 12. Oktober in der Werkstatt";

function Titling({
  initial = "",
  editing: startEditing = false,
  multiline = false,
  wide = false,
  onRename,
}: {
  initial?: string;
  editing?: boolean;
  multiline?: boolean;
  /** As wide as its place (a phone's pane) instead of a pane's column. */
  wide?: boolean;
  onRename?: (title: string) => void;
}) {
  const [title, setTitle] = useState(initial);
  const [editing, setEditing] = useState(startEditing);
  return (
    <div className={cn("flex w-full flex-col items-start gap-3", !wide && "max-w-72")}>
      <div className="flex w-full text-lg leading-snug font-semibold text-pretty text-fg">
        <EditableName
          value={title}
          editing={editing}
          onEditingChange={setEditing}
          label="Titel"
          placeholder="Titel hinzufügen"
          allowEmpty
          multiline={multiline}
          onRename={(next) => {
            onRename?.(next);
            setTitle(next);
            return undefined;
          }}
        />
      </div>
      <Button size="sm" onClick={() => setEditing(true)}>
        Titel ändern
      </Button>
    </div>
  );
}

/**
 * A value that may be missing. Without one, its place reads what a press does, muted, in the
 * title's own type. Being cleared, the field shows the same words as its placeholder.
 */
export const OptionalEmpty: Story = {
  parameters: { visual: { target: "[data-slot=editable-name-placeholder]" } },
  render: () => <Titling />,
};

export const OptionalBeingCleared: Story = {
  render: () => <Titling editing />,
};

/** A long title wraps, and is changed as it stands: the lines stay, only a caret comes. */
export const Wrapped: Story = {
  render: () => <Titling initial={TITLE} multiline />,
};

export const WrappedOpen: Story = {
  render: () => <Titling initial={TITLE} multiline editing />,
};

export const WrappedEmpty: Story = {
  parameters: { visual: { target: "[data-slot=editable-name-placeholder]" } },
  render: () => <Titling multiline />,
};

export const WrappedBeingCleared: Story = {
  render: () => <Titling multiline editing />,
};

/** A refused title keeps its lines, underlined, with the reason under them. */
function RefusedTitle() {
  const [editing, setEditing] = useState(true);
  return (
    <div className="flex w-full max-w-72 text-lg leading-snug font-semibold text-pretty text-fg">
      <EditableName
        value={TITLE}
        editing={editing}
        onEditingChange={setEditing}
        label="Titel"
        multiline
        onRename={() => "Ein Titel hat höchstens 60 Zeichen."}
      />
    </div>
  );
}

export const WrappedRefused: Story = {
  render: () => <RefusedTitle />,
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Titel" });
    await waitFor(() => expect(field).toHaveFocus());
    window.getSelection()?.collapseToEnd();
    typeText(" an der Isar");
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Ein Titel hat höchstens 60 Zeichen.",
    );
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveTextContent(`${TITLE} an der Isar`);
  },
};

/** On a phone the pane is as wide as the screen; the title wraps more often and stays put. */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 300 } } },
  render: () => <Titling initial={TITLE} multiline editing wide />,
};

const renamed = fn();

/** The keyboard path: the base name is selected, Enter takes it, Escape keeps the old one. */
export const Keyboard: Story = {
  render: () => <Renaming onRename={renamed} />,
  play: async ({ canvas, userEvent, step }) => {
    renamed.mockClear();
    await step("changing begins with only the base name selected", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Umbenennen" }));
      const field = canvas.getByRole("textbox", { name: "Name" });
      await waitFor(() => expect(field).toHaveFocus());
      if (!(field instanceof HTMLInputElement)) throw new Error("the field is no input");
      await expect([field.selectionStart, field.selectionEnd]).toEqual([0, 4]);
    });
    await step("typing keeps the extension, Enter takes the name", async () => {
      await userEvent.keyboard("titel{Enter}");
      await waitFor(() => expect(renamed).toHaveBeenCalledWith("titel.webp"));
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
    });
    await step("the focus goes back to where changing began", async () => {
      await expect(canvas.getByRole("button", { name: "Umbenennen" })).toHaveFocus();
    });
    await step("Enter and Escape while a word is being composed are the word's", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Umbenennen" }));
      const field = canvas.getByRole("textbox", { name: "Name" });
      await waitFor(() => expect(field).toHaveFocus());
      await userEvent.keyboard("neu");
      for (const key of ["Enter", "Escape"]) {
        field.dispatchEvent(
          new KeyboardEvent("keydown", { key, isComposing: true, bubbles: true }),
        );
      }
      await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("neu.webp");
      await expect(renamed).toHaveBeenCalledTimes(1);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
    });
    await step("Escape keeps the name as it was", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Umbenennen" }));
      await waitFor(() => expect(canvas.getByRole("textbox", { name: "Name" })).toHaveFocus());
      await userEvent.keyboard("anders{Escape}");
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
      await expect(renamed).toHaveBeenCalledTimes(1);
      await expect(canvas.getByText("titel.webp", { selector: ".sr-only" })).toBeTruthy();
      await expect(canvas.getByRole("button", { name: "Umbenennen" })).toHaveFocus();
    });
  },
};

const asked = fn();

/** A name that is checked elsewhere: the answer comes a moment later. */
function Checked() {
  const [name, setName] = useState("hero.webp");
  const [editing, setEditing] = useState(true);
  return (
    <div className="flex w-64 text-control font-medium text-fg">
      <EditableName
        value={name}
        editing={editing}
        onEditingChange={setEditing}
        onRename={async (next) => {
          asked(next);
          await new Promise((answered) => setTimeout(answered, 150));
          setName(next);
          return undefined;
        }}
      />
    </div>
  );
}

/** As a test: a second Enter while the first name is still being checked asks nothing again. */
export const Waiting: Story = {
  render: () => <Checked />,
  play: async ({ canvas, userEvent }) => {
    asked.mockClear();
    const field = canvas.getByRole("textbox", { name: "Name" });
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.keyboard("titel{Enter}");
    await waitFor(() => expect(field).toHaveAttribute("aria-busy", "true"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
    await expect(asked).toHaveBeenCalledTimes(1);
    await expect(asked).toHaveBeenCalledWith("titel.webp");
  },
};

/**
 * Types into the field that has the focus as a keyboard would: through the browser's own
 * editing, which a text that is editable as plain text needs (the test library types only into
 * fields and rich text).
 */
function typeText(text: string): void {
  document.execCommand("insertText", false, text);
}

/** Where every line of the name stands on the page, to a hundredth of a pixel. */
function linesOf(text: Element): string[] {
  const range = document.createRange();
  range.selectNodeContents(text);
  return Array.from(range.getClientRects(), (rect) =>
    [rect.left, rect.top, rect.width, rect.height].map((each) => each.toFixed(2)).join(" "),
  );
}

/** Changing a wrapped title begins without a word moving: its lines stand where they stood. */
export const WrappedStaysInPlace: Story = {
  render: () => <Titling initial={TITLE} multiline />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const atRest = canvasElement.querySelector("[data-slot=editable-name-text]");
    if (!atRest) throw new Error("the title is not drawn");
    const before = linesOf(atRest);
    await expect(before.length).toBeGreaterThan(1);
    const box = canvasElement.querySelector("[data-slot=editable-name]")?.getBoundingClientRect();
    await userEvent.click(canvas.getByRole("button", { name: "Titel ändern" }));
    const field = canvas.getByRole("textbox", { name: "Titel" });
    await waitFor(() => expect(field).toHaveFocus());
    await expect(linesOf(field)).toEqual(before);
    await expect(
      canvasElement.querySelector("[data-slot=editable-name]")?.getBoundingClientRect(),
    ).toEqual(box);
    await expect(window.getSelection()?.toString()).toBe(TITLE);
  },
};

const retitled = fn();

/** An optional value: taking the cleared field stores nothing, and its place is a key again. */
export const KeyboardEmpty: Story = {
  render: () => <Titling initial="Herbstfest" onRename={retitled} />,
  play: async ({ canvas, userEvent, step }) => {
    retitled.mockClear();
    await step("an unchanged title asks for nothing", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Titel ändern" }));
      await waitFor(() => expect(canvas.getByRole("textbox", { name: "Titel" })).toHaveFocus());
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
      await expect(retitled).not.toHaveBeenCalled();
    });
    await step("Escape keeps a title that was cleared", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Titel ändern" }));
      const field = canvas.getByRole("textbox", { name: "Titel" });
      await waitFor(() => expect(field).toHaveFocus());
      await userEvent.keyboard("{Backspace}");
      await expect(field).toHaveAttribute("placeholder", "Titel hinzufügen");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
      await expect(retitled).not.toHaveBeenCalled();
    });
    await step("Enter takes the cleared field as no title", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Titel ändern" }));
      await waitFor(() => expect(canvas.getByRole("textbox", { name: "Titel" })).toHaveFocus());
      await userEvent.keyboard("{Backspace}{Enter}");
      await waitFor(() => expect(retitled).toHaveBeenCalledWith(""));
      // The placeholder stands in the title's place, as the key that begins the change, and
      // has the focus the field gave up.
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Titel hinzufügen" })).toHaveFocus(),
      );
    });
    await step(
      "the placeholder is pressed to add one, and the focus leaving takes it",
      async () => {
        await userEvent.keyboard("{Enter}");
        await waitFor(() => expect(canvas.getByRole("textbox", { name: "Titel" })).toHaveFocus());
        await userEvent.keyboard("Sommerfest");
        await userEvent.tab();
        await waitFor(() => expect(retitled).toHaveBeenLastCalledWith("Sommerfest"));
        await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
        await expect(retitled).toHaveBeenCalledTimes(2);
      },
    );
  },
};

/** A title that wraps: Enter takes, Escape keeps, the focus leaving takes, a break is a space. */
export const KeyboardMultiline: Story = {
  render: () => <Titling initial={TITLE} multiline onRename={retitled} />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    retitled.mockClear();
    const begin = async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Titel ändern" }));
      const field = canvas.getByRole("textbox", { name: "Titel" });
      await waitFor(() => expect(field).toHaveFocus());
      return field;
    };
    const shown = () => canvasElement.querySelector("[data-slot=editable-name-text]");
    await step("changing begins with the whole title selected", async () => {
      await begin();
      await expect(window.getSelection()?.toString()).toBe(TITLE);
    });
    await step("Enter takes what was typed and makes no line", async () => {
      typeText("Herbstfest in der Werkstatt");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(retitled).toHaveBeenCalledWith("Herbstfest in der Werkstatt"));
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
      await expect(shown()).toHaveTextContent("Herbstfest in der Werkstatt");
    });
    await step("Escape keeps the title as it was", async () => {
      await begin();
      typeText("Etwas ganz anderes");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
      await expect(retitled).toHaveBeenCalledTimes(1);
      await expect(shown()).toHaveTextContent("Herbstfest in der Werkstatt");
    });
    await step("a pasted line break becomes a space", async () => {
      const field = await begin();
      await userEvent.paste("Herbstfest\n  der Schreinerei\r\nHuber");
      await expect(field.textContent).toBe("Herbstfest der Schreinerei Huber");
      await expect(field.querySelector("br")).toBeNull();
    });
    await step("the focus leaving takes it", async () => {
      await userEvent.tab();
      await waitFor(() =>
        expect(retitled).toHaveBeenLastCalledWith("Herbstfest der Schreinerei Huber"),
      );
      await waitFor(() => expect(canvas.queryByRole("textbox")).toBeNull());
    });
    await step("cleared, it shows the placeholder, and Enter stores no title", async () => {
      const field = await begin();
      // The test library deletes nothing in a text that is editable as plain text only.
      document.execCommand("delete");
      await expect(field.textContent).toBe("");
      await expect(await canvas.findByText("Titel hinzufügen")).toBeVisible();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(retitled).toHaveBeenLastCalledWith(""));
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Titel hinzufügen" })).toHaveFocus(),
      );
    });
  },
};
