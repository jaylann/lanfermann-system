import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, waitFor } from "storybook/test";

import { Segment, SegmentedControl } from "./segmented-control";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  parameters: { visual: { viewport: { width: 420, height: 130 } } },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two to five views of the same thing. The thumb travels and never leaves the trough; a label
 * turns dark where the thumb covers it. The thumb has weight: its tail comes after it and it
 * squashes as it lands, it reaches for a mouse over another segment, and it can be pulled.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="segment"]:not([data-pressed])',
      motion: [
        { name: "switch", click: '[data-slot="segment"]:last-of-type', frames: 8 },
        { name: "reach", hover: '[data-slot="segment"]:last-of-type', frames: 6 },
      ],
    },
  },
  render: () => (
    <SegmentedControl defaultValue="monat" aria-label="Abrechnung">
      <Segment value="monat">Monatlich</Segment>
      <Segment value="jahr">Jährlich</Segment>
      <Segment value="einmalig">Einmalig</Segment>
    </SegmentedControl>
  ),
};

/**
 * Regression check: inside a zoomed parent the thumb must still land on its segment. (A
 * scale-based layout animation once flew out of the trough here.)
 */
export const Zoomed: Story = {
  parameters: {
    visual: {
      motion: [{ name: "switch", click: '[data-slot="segment"]:not([data-pressed])', frames: 8 }],
    },
  },
  render: () => (
    <div style={{ zoom: 1.4 }}>
      <SegmentedControl defaultValue="monat" aria-label="Abrechnung">
        <Segment value="monat">Monatlich</Segment>
        <Segment value="jahr">Jährlich</Segment>
      </SegmentedControl>
    </div>
  ),
};

const areas = (
  <>
    <Segment value="anmeldung">Anmeldung</Segment>
    <Segment value="konto">Konto</Segment>
    <Segment value="profil">Profil</Segment>
  </>
);

/**
 * The round control: a pill whose thumb rides on the trough's full height, each segment with
 * its mark. On the trough every mark is a ring; the disc closes in the thumb, as it arrives.
 */
export const Round: Story = {
  parameters: {
    visual: {
      viewport: { width: 560, height: 140 },
      target: '[data-slot="segment"]:not([data-pressed])',
      motion: [
        { name: "far", click: '[data-slot="segment"]:first-of-type', frames: 10 },
        { name: "near", click: '[data-slot="segment"]:nth-of-type(2)', frames: 10 },
        { name: "reach", hover: '[data-slot="segment"]:first-of-type', frames: 6 },
      ],
    },
  },
  render: () => (
    <SegmentedControl shape="round" defaultValue="profil" aria-label="Bereich">
      {areas}
    </SegmentedControl>
  ),
};

/**
 * Without weight the thumb only glides: for a place where nothing should draw the eye. At rest
 * it looks like `Default`, so it is left out of the stills.
 */
export const Plain: Story = {
  tags: ["visual-skip"],
  parameters: {
    visual: {
      motion: [{ name: "switch", click: '[data-slot="segment"]:last-of-type', frames: 8 }],
    },
  },
  render: () => (
    <SegmentedControl inertia={false} defaultValue="monat" aria-label="Abrechnung">
      <Segment value="monat">Monatlich</Segment>
      <Segment value="jahr">Jährlich</Segment>
      <Segment value="einmalig">Einmalig</Segment>
    </SegmentedControl>
  ),
};

/**
 * The thumb as it is drawn, under zoom, against the segment it stands on: the same box to a
 * pixel, in the viewport's pixels. The written numbers cannot show this (they are layout
 * pixels and always agree with the segment's); only the drawn boxes do. Firefox drew the thumb
 * 1.4 times too wide here, past the trough's end, while its numbers were right.
 */
export const ZoomedLands: Story = {
  render: () => (
    <div style={{ zoom: 1.4 }}>
      <SegmentedControl defaultValue="monat" aria-label="Abrechnung">
        <Segment value="monat">Monatlich</Segment>
        <Segment value="jahr">Jährlich</Segment>
        <Segment value="einmalig">Einmalig</Segment>
      </SegmentedControl>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const drawn = () => {
      const thumb = canvasElement.querySelector('[data-slot="segment-thumb"]');
      const chosen = canvasElement.querySelector('[data-slot="segment"][data-pressed]');
      return { thumb: thumb?.getBoundingClientRect(), segment: chosen?.getBoundingClientRect() };
    };
    const lands = async () =>
      waitFor(
        async () => {
          const { thumb, segment } = drawn();
          await expect(thumb && segment).toBeTruthy();
          await expect(Math.abs(thumb!.left - segment!.left)).toBeLessThanOrEqual(1);
          await expect(Math.abs(thumb!.width - segment!.width)).toBeLessThanOrEqual(1);
        },
        { timeout: 2000 },
      );

    await step("At rest the thumb covers the first segment", lands);
    await step("Chosen, it lands on the middle segment at its width", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Jährlich" }));
      await lands();
    });
    await step("And on the last one, without passing the trough's end", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Einmalig" }));
      await lands();
    });
  },
};

/** The thumb's place as the control wrote it, and the chosen segment's, in layout px. */
function places(canvasElement: HTMLElement) {
  const track = canvasElement.querySelector<HTMLElement>('[data-slot="segmented-control"]');
  const chosen = track?.querySelector<HTMLElement>('[data-slot="segment"][data-pressed]');
  return {
    thumb: track?.style.getPropertyValue("--thumb-left"),
    segment: String(chosen?.offsetLeft),
  };
}

export const Keyboard: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <SegmentedControl shape="round" defaultValue="profil" aria-label="Bereich" {...args}>
      {areas}
    </SegmentedControl>
  ),
  play: async ({ args, canvas, canvasElement, userEvent, step }) => {
    const segment = (name: string) => canvas.getByRole("button", { name });

    await step("The labels the thumb shows are not controls and are not read out", async () => {
      await expect(canvas.getAllByRole("button")).toHaveLength(3);
      const copies = canvasElement.querySelectorAll('[data-slot="segment-copy"]');
      await expect(copies).toHaveLength(3);
      for (const copy of copies) await expect(copy.closest("[inert]")).not.toBeNull();
    });

    await step("Tab enters the group, the arrows move the focus and choose nothing", async () => {
      await userEvent.tab();
      await expect(segment("Anmeldung")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(segment("Konto")).toHaveFocus();
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).not.toHaveBeenCalled();
    });

    await step("Enter chooses the focused segment, and the thumb goes there", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(segment("Konto")).toHaveAttribute("aria-pressed", "true");
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "false");
      await expect(args.onValueChange).toHaveBeenLastCalledWith("konto");
      await waitFor(() => expect(places(canvasElement).thumb).toBe(places(canvasElement).segment));
    });

    await step("Enter on the chosen segment leaves it chosen", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(segment("Konto")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    });

    await step("The arrows wrap round, Space chooses as well", async () => {
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      await expect(segment("Profil")).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).toHaveBeenLastCalledWith("profil");
    });
  },
};

/** The thumb is pulled to another segment and dropped on the one its middle is nearest to. */
export const Pulled: Story = {
  args: { onValueChange: fn(), onPointerDown: fn(), onPointerMove: fn(), onPointerUp: fn() },
  render: (args) => (
    <SegmentedControl shape="round" defaultValue="profil" aria-label="Bereich" {...args}>
      {areas}
    </SegmentedControl>
  ),
  play: async ({ args, canvas, canvasElement, step }) => {
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="segmented-control"]')!;
    const segment = (name: string) => canvas.getByRole("button", { name });
    const middle = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
    };
    const pointer = { pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true };

    await step("A press on the chosen segment holds the thumb", async () => {
      await fireEvent.pointerDown(segment("Profil"), { ...pointer, ...middle(segment("Profil")) });
      await expect(track).toHaveAttribute("data-grabbed");
      await expect(track).not.toHaveAttribute("data-dragging");
      // The caller's own handler ran beside the thumb's, not in its place.
      await expect(args.onPointerDown).toHaveBeenCalledTimes(1);
    });

    await step("Pulled, it follows the pointer and nothing is chosen yet", async () => {
      const from = middle(segment("Profil"));
      const to = middle(segment("Anmeldung"));
      const width = () => Number.parseFloat(track.style.getPropertyValue("--thumb-width"));
      const widths = [segment("Profil").offsetWidth];
      for (let step = 1; step <= 6; step++) {
        const clientX = from.clientX + ((to.clientX - from.clientX) * step) / 6;
        await fireEvent.pointerMove(track, { ...pointer, clientX, clientY: from.clientY });
        widths.push(width());
      }
      // Its width follows its middle, from Profil's to Anmeldung's: a little with every move,
      // never all at once where it crosses a border.
      const jumps = widths.slice(1).map((each, index) => Math.abs(each - widths[index]!));
      const whole = Math.abs(segment("Anmeldung").offsetWidth - segment("Profil").offsetWidth);
      await expect(Math.max(...jumps)).toBeLessThan(whole / 2);
      await expect(track).toHaveAttribute("data-dragging");
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).not.toHaveBeenCalled();
      // Over Anmeldung's middle it has Anmeldung's width, and stands on it to within a pixel: a
      // pulled thumb is where the pointer is, not on the grid.
      await expect(width()).toBeCloseTo(segment("Anmeldung").offsetWidth, 1);
      const left = Number.parseFloat(track.style.getPropertyValue("--thumb-left"));
      await expect(Math.abs(left - segment("Anmeldung").offsetLeft)).toBeLessThan(1);
    });

    await step("Dropped, the segment under it is chosen, once", async () => {
      await fireEvent.pointerUp(track, {
        ...pointer,
        buttons: 0,
        ...middle(segment("Anmeldung")),
      });
      await expect(track).not.toHaveAttribute("data-grabbed");
      await expect(track).not.toHaveAttribute("data-dragging");
      await waitFor(() => expect(segment("Anmeldung")).toHaveAttribute("aria-pressed", "true"));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith("anmeldung");
      await expect(args.onPointerMove).toHaveBeenCalled();
      await expect(args.onPointerUp).toHaveBeenCalledTimes(1);
    });

    await step("A short pull falls back to where it was", async () => {
      const from = middle(segment("Anmeldung"));
      await fireEvent.pointerDown(segment("Anmeldung"), { ...pointer, ...from });
      await fireEvent.pointerMove(track, {
        ...pointer,
        clientX: from.clientX + 20,
        clientY: from.clientY,
      });
      await fireEvent.pointerUp(track, { ...pointer, buttons: 0, clientX: from.clientX + 20 });
      await expect(segment("Anmeldung")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      const { thumb, segment: chosen } = places(canvasElement);
      await expect(thumb).toBe(chosen);
    });

    await step("A second finger does not take the thumb over", async () => {
      const from = middle(segment("Anmeldung"));
      await fireEvent.pointerDown(segment("Anmeldung"), { ...pointer, ...from });
      await fireEvent.pointerMove(track, { ...pointer, ...middle(segment("Profil")) });
      await expect(track).toHaveAttribute("data-dragging");
      // It comes down on the chosen segment and lifts again: the pull is still the first one's.
      const second = { ...pointer, pointerId: 2, isPrimary: false, ...from };
      await fireEvent.pointerDown(segment("Anmeldung"), second);
      await fireEvent.pointerUp(track, { ...second, buttons: 0 });
      await expect(track).toHaveAttribute("data-dragging");
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await fireEvent.pointerUp(track, { ...pointer, buttons: 0, ...middle(segment("Profil")) });
      await expect(track).not.toHaveAttribute("data-dragging");
      await waitFor(() => expect(segment("Profil")).toHaveAttribute("aria-pressed", "true"));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith("profil");
    });

    await step("A pull the system breaks off chooses nothing", async () => {
      await fireEvent.pointerDown(segment("Profil"), { ...pointer, ...middle(segment("Profil")) });
      await fireEvent.pointerMove(track, { ...pointer, ...middle(segment("Anmeldung")) });
      await expect(track).toHaveAttribute("data-dragging");
      await fireEvent.pointerCancel(track, { ...pointer, buttons: 0 });
      await expect(track).not.toHaveAttribute("data-grabbed");
      await expect(track).not.toHaveAttribute("data-dragging");
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      const { thumb, segment: chosen } = places(canvasElement);
      await expect(thumb).toBe(chosen);
    });
  },
};

/** What the tests below press and pull with. */
const mouse = { pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, isPrimary: true };
const middleOf = (element: HTMLElement) => {
  const box = element.getBoundingClientRect();
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
};

/**
 * As a test: a control that cannot be used cannot be changed by pulling its thumb either, and a
 * thumb is not dropped on a segment that cannot be chosen. (A disabled button holds back its
 * click, not the pointer events the thumb listens to.)
 */
export const PulledDisabled: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl disabled defaultValue="profil" aria-label="Bereich" {...args}>
        {areas}
      </SegmentedControl>
      <SegmentedControl defaultValue="monat" aria-label="Abrechnung" {...args}>
        <Segment value="monat">Monatlich</Segment>
        <Segment value="jahr" disabled>
          Jährlich
        </Segment>
      </SegmentedControl>
    </div>
  ),
  play: async ({ args, canvas, canvasElement, step }) => {
    const tracks = canvasElement.querySelectorAll<HTMLElement>('[data-slot="segmented-control"]');
    const whole = tracks[0]!;
    const part = tracks[1]!;
    const segment = (name: string) => canvas.getByRole("button", { name });
    const thumbOf = (track: HTMLElement) => track.style.getPropertyValue("--thumb-left");

    await step("The thumb of a disabled control is not held and not pulled", async () => {
      const before = thumbOf(whole);
      await fireEvent.pointerDown(segment("Profil"), { ...mouse, ...middleOf(segment("Profil")) });
      await expect(whole).not.toHaveAttribute("data-grabbed");
      await fireEvent.pointerMove(whole, { ...mouse, ...middleOf(segment("Anmeldung")) });
      await fireEvent.pointerUp(whole, { ...mouse, buttons: 0, ...middleOf(segment("Anmeldung")) });
      await expect(whole).not.toHaveAttribute("data-dragging");
      await expect(thumbOf(whole)).toBe(before);
      await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).not.toHaveBeenCalled();
    });

    await step("Dropped on a disabled segment, the thumb goes back", async () => {
      await fireEvent.pointerDown(segment("Monatlich"), {
        ...mouse,
        ...middleOf(segment("Monatlich")),
      });
      await expect(part).toHaveAttribute("data-grabbed");
      await fireEvent.pointerMove(part, { ...mouse, ...middleOf(segment("Jährlich")) });
      await expect(part).toHaveAttribute("data-dragging");
      await fireEvent.pointerUp(part, { ...mouse, buttons: 0, ...middleOf(segment("Jährlich")) });
      await expect(segment("Monatlich")).toHaveAttribute("aria-pressed", "true");
      await expect(args.onValueChange).not.toHaveBeenCalled();
      await expect(thumbOf(part)).toBe(String(segment("Monatlich").offsetLeft));
    });
  },
};

/**
 * As a test: a controlled value that does not take the dropped choice. The thumb goes back to
 * the segment that is still chosen instead of standing on the one that was refused.
 */
export const PulledRefused: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <SegmentedControl shape="round" value="profil" aria-label="Bereich" {...args}>
      {areas}
    </SegmentedControl>
  ),
  play: async ({ args, canvas, canvasElement }) => {
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="segmented-control"]')!;
    const segment = (name: string) => canvas.getByRole("button", { name });
    // Once the page stands: its first layout reaches the control's observer a frame after it is
    // drawn, and a web font that arrives is one more. Either would put the thumb right by itself.
    await document.fonts.ready;
    await waitFor(() => expect(track).toHaveAttribute("data-placed"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await fireEvent.pointerDown(segment("Profil"), { ...mouse, ...middleOf(segment("Profil")) });
    await fireEvent.pointerMove(track, { ...mouse, ...middleOf(segment("Anmeldung")) });
    await fireEvent.pointerUp(track, { ...mouse, buttons: 0, ...middleOf(segment("Anmeldung")) });
    await expect(args.onValueChange).toHaveBeenLastCalledWith("anmeldung");
    await expect(segment("Profil")).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(places(canvasElement).thumb).toBe(places(canvasElement).segment));
  },
};
