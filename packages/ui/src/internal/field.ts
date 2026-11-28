/**
 * The look of a text field, for the two ways a field is built.
 *
 * A plain `Input` wears the field itself: the edge, the halo and the states sit on the `<input>`.
 * As soon as something stands beside the text (an icon, a unit, a button, steppers), a wrapper
 * has to wear the field instead and the control inside it goes bare. Then the wrapper reads the
 * control's state: `fieldShell` + `fieldShellSize` on the wrapper, `bareControl` and the
 * `data-field-control` attribute on the control.
 *
 * No `"use client"`: these are class names and one event handler, usable from any module.
 */
import type { MouseEvent } from "react";

/** What every field shares, however it is built: the white socket and how its shadow moves. */
export const fieldFace = [
  "bg-surface text-control text-fg depth-field",
  "transition-[box-shadow,background-color] spring-snap",
].join(" ");

/** How typed text and its placeholder are set. 16px on touch devices, so iOS never zooms. */
export const fieldText = [
  "pointer-coarse:text-base",
  "placeholder:text-fg-muted placeholder:italic",
].join(" ");

/**
 * The wrapper that wears the field. The halo follows the control only: a button inside the shell
 * shows its own focus outline, and the field stays quiet. Invalid beats focus, as on `Input`.
 */
const fieldShellStates = [
  "has-[[data-field-control]:focus]:depth-field-focus",
  "has-[[data-field-control][data-invalid]]:depth-field-invalid has-[[data-field-control][data-invalid]:focus]:depth-field-invalid",
  "has-[[data-field-control][data-disabled]]:cursor-default has-[[data-field-control][data-disabled]]:bg-disabled has-[[data-field-control][data-disabled]]:depth-flat has-[[data-field-control][data-disabled]]:text-on-disabled",
].join(" ");

export const fieldShell = [
  "group/field relative flex w-full min-w-0 cursor-text items-center pointer-coarse:text-base",
  fieldFace,
  fieldShellStates,
].join(" ");

/**
 * The shell of a field that grows by a line (a multi-select whose chips wrap), for the box of a
 * `Grow`: the face and the states, no height and no layout. What the field holds is laid out on
 * the `Grow`'s inner box, which is the one that is measured. The halo keeps its own transition
 * beside the height's (`--grow-also`).
 */
export const fieldShellGrowing = [
  "group/field relative block w-full min-w-0 cursor-text bg-surface text-control text-fg depth-field pointer-coarse:text-base",
  "[--grow-also:box-shadow_var(--transition-duration-spring-snap)_var(--ease-spring-snap),background-color_var(--transition-duration-spring-snap)_var(--ease-spring-snap)]",
  fieldShellStates,
].join(" ");

/**
 * The same shell cut as a dock: a field that floats over the page it belongs to (a composer at
 * the foot of a grid), with the raised face, light and long float of an `ActionBar` in place of
 * a socket's edge. With the caret in it, it takes the accent's edge and the field's halo over
 * that float. Disabled it keeps its float, since the page still runs under it, and loses its
 * gloss.
 */
export const fieldShellDock = [
  "group/field relative block w-full min-w-0 cursor-text bg-raised text-control text-fg depth-dock pointer-coarse:text-base",
  "[--grow-also:box-shadow_var(--transition-duration-spring-snap)_var(--ease-spring-snap),background-color_var(--transition-duration-spring-snap)_var(--ease-spring-snap)]",
  "has-[[data-field-control]:focus]:depth-dock-focus",
  "has-[[data-field-control][data-invalid]]:depth-dock-invalid has-[[data-field-control][data-invalid]:focus]:depth-dock-invalid",
  "has-[[data-field-control][data-disabled]]:cursor-default has-[[data-field-control][data-disabled]]:bg-disabled has-[[data-field-control][data-disabled]]:bg-none has-[[data-field-control][data-disabled]]:text-on-disabled",
].join(" ");

/** Corner and the field's variables by size, without the fixed height of `fieldShellSize`. */
export const fieldShellGrowingSize = {
  sm: "rounded-sm [--field-height:var(--control-sm)] [--field-pad:var(--field-pad-sm)] [--field-radius:var(--radius-sm)]",
  md: "rounded-md [--field-height:var(--control-md)] [--field-pad:var(--field-pad-md)] [--field-radius:var(--radius-md)]",
  lg: "rounded-lg [--field-height:var(--control-lg)] [--field-pad:var(--field-pad-lg)] [--field-radius:var(--radius-lg)]",
} as const;

/**
 * Height, corner and inline padding by size, handed to the parts inside as variables:
 * `--field-pad` (where text starts), `--field-height` and `--field-radius` (for a button that
 * has to fit concentrically).
 */
export const fieldShellSize = {
  sm: "h-(--control-sm) rounded-sm [--field-height:var(--control-sm)] [--field-pad:var(--field-pad-sm)] [--field-radius:var(--radius-sm)]",
  md: "h-(--control-md) rounded-md [--field-height:var(--control-md)] [--field-pad:var(--field-pad-md)] [--field-radius:var(--radius-md)]",
  lg: "h-(--control-lg) rounded-lg [--field-height:var(--control-lg)] [--field-pad:var(--field-pad-lg)] [--field-radius:var(--radius-lg)]",
} as const;

export type FieldSize = keyof typeof fieldShellSize;

/**
 * The control inside a shell: no face of its own, as tall as the shell, taking the room that is
 * left. Where an adornment stands beside it, 8px separate the two instead of the field padding.
 * `outline-hidden` keeps a real outline for forced colours, where the halo is gone.
 */
export const bareControl = [
  "h-full min-w-0 flex-1 bg-transparent px-(--field-pad) text-control text-fg not-first:pl-2 not-last:pr-2",
  fieldText,
  "focus:outline-hidden",
  "data-disabled:text-on-disabled",
].join(" ");

/**
 * A click on the shell's own surface, or on an icon or a unit, goes to the control: the whole
 * field is the target, as it is for a plain input. Buttons and links inside keep their click.
 */
export function focusFieldControl(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  if (target.closest("button, a, input, textarea, select, [role='button']")) return;
  const control = event.currentTarget.querySelector<HTMLElement>("[data-field-control]");
  if (!control || control.matches(":disabled, [data-disabled]")) return;
  // Without this the press would blur the control again right after it was focused.
  event.preventDefault();
  control.focus();
}
