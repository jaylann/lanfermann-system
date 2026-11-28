import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { FileTile } from "@/components/file-tile/file-tile";
import { FILES } from "@/components/file-tile/story-files";

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
