import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, fn, waitFor } from "storybook/test";

import { SearchField, type SearchFieldProps } from "./search-field";

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  parameters: {
    visual: { viewport: { width: 420, height: 140 }, target: '[data-slot="search-field"]' },
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj;

const CUSTOMERS = ["Schreinerei Huber", "Bäckerei Kowalski", "Metzgerei Brandl", "Café Lindner"];

/** A search over a short list of customers, filtering it as it is typed. */
function Customers({
  initial = "",
  ...props
}: { initial?: string } & Partial<Omit<SearchFieldProps, "value" | "onValueChange">>) {
  const [query, setQuery] = useState(initial);
  const found = CUSTOMERS.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <SearchField
      aria-label="Kunden suchen"
      placeholder="In Kunden suchen"
      value={query}
      onValueChange={setQuery}
      count={found.length === 1 ? "1 Treffer" : `${found.length} Treffer`}
      className="w-80"
      {...props}
    />
  );
}

/**
 * Empty, the keys that reach it stand at its end; typed into, the cross that clears it takes
 * their place, with what was found before it.
 */
export const Default: Story = {
  parameters: {
    visual: {
      viewport: { width: 420, height: 160 },
      motion: [{ name: "type", click: '[data-slot="search-field"] input', type: "k", frames: 8 }],
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Customers shortcut="mod+f" />
      <Customers shortcut="mod+f" initial="ei" />
    </div>
  ),
};

/** The three sizes of a field. Beside a `SegmentedControl` or a `md` key, take `md`. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 420, height: 220 } } },
  render: () => (
    <div className="flex flex-col gap-4">
      <Customers size="sm" shortcut="/" />
      <Customers size="md" shortcut="/" />
      <Customers size="lg" shortcut="/" />
    </div>
  ),
};

/**
 * As a test: a field that cannot be used keeps what stands in it. Its cross cannot be pressed,
 * and its keys do not bring the focus to it.
 */
export const DisabledKeepsItsText: Story = {
  render: () => <Customers shortcut="/" initial="ei" disabled />,
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("searchbox", { name: "Kunden suchen" });
    const cross = canvas.getByRole("button", { name: "Suche leeren" });
    await expect(field).toBeDisabled();
    await expect(cross).toBeDisabled();
    await fireEvent.click(cross);
    await expect(field).toHaveValue("ei");
    // The key is left to the page: nothing here takes it, so nothing is swallowed.
    let swallowed = false;
    const heard = (event: KeyboardEvent) => {
      swallowed = event.defaultPrevented;
    };
    window.addEventListener("keydown", heard);
    await userEvent.keyboard("/");
    window.removeEventListener("keydown", heard);
    await expect(swallowed).toBe(false);
    await expect(field).not.toHaveFocus();
  },
};

/** A caller's ref of the kind that cleans up after itself, for the test below. */
const attached = fn();
const cleaned = fn();
const watched = (input: HTMLInputElement | null) => {
  attached(input);
  return () => {
    cleaned();
  };
};

/**
 * The keyboard path, as a test: the keys bring the focus to the field, Escape clears what is
 * typed and pressed again leaves the field, the cross clears and keeps the focus in it.
 */
export const Keyboard: Story = {
  render: () => <Customers shortcut="/" ref={watched} />,
  play: async ({ canvas, userEvent, step }) => {
    const field = canvas.getByRole("searchbox", { name: "Kunden suchen" });
    await step("the keys bring the focus to the field", async () => {
      await userEvent.keyboard("/");
      await waitFor(() => expect(field).toHaveFocus());
    });
    await step("what is found is counted", async () => {
      await userEvent.keyboard("ei");
      await expect(canvas.getByText("3 Treffer")).toBeVisible();
      // And said: it changes while the focus is in the field.
      await expect(canvas.getByRole("status")).toHaveTextContent("3 Treffer");
    });
    await step("Escape clears, and pressed again leaves the field", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(field).toHaveValue("");
      await expect(field).toHaveFocus();
      await expect(canvas.getByRole("status")).toBeEmptyDOMElement();
      await userEvent.keyboard("{Escape}");
      await expect(field).not.toHaveFocus();
    });
    await step("the cross clears and keeps the focus in the field", async () => {
      await userEvent.click(field);
      await userEvent.keyboard("huber");
      await userEvent.click(canvas.getByRole("button", { name: "Suche leeren" }));
      await expect(field).toHaveValue("");
      await expect(field).toHaveFocus();
    });
    await step(
      "a caller's ref that cleans up is never handed null, and is cleaned up",
      async () => {
        await expect(attached).toHaveBeenCalledWith(field);
        await expect(attached).not.toHaveBeenCalledWith(null);
        // Every time but the one that holds the field now.
        await expect(cleaned).toHaveBeenCalledTimes(attached.mock.calls.length - 1);
      },
    );
  },
};
