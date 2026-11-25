import type { ReactNode } from "react";

import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";
import { span } from "@/slides/lib/grid";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type ContactsProps = {
  /** Label, value and optionally an icon from `ICONS` before the label (`ICONS.mail`, `ICONS.globe`, `ICONS.call`, `ICONS.pin`): E-Mail, Web, Telefon, Vor Ort. Three at most. An optional fourth entry is the step the contact appears at, with its rule (`["Web", "lanfermann.dev", ICONS.globe, 1]`, or `undefined` in place of the icon); without it the contact is there from the start. */
  items: Array<[ReactNode, ReactNode, IconGlyph?, number?]>;
};

/**
 * Up to three contact routes under rules: a label and the address itself.
 *
 * Addresses are written out so they can be read from the back of a room and typed from a
 * printout. A small icon may stand before each label; no buttons, no arrows. The routes are read
 * together at the close, so they rarely need steps.
 */
export function Contacts({ items }: ContactsProps) {
  return (
    <div
      data-slot="slide-contacts"
      className="grid gap-16"
      style={{ gridTemplateColumns: `repeat(${items.length}, ${span(4)}px)` }}
    >
      {items.map(([label, value, icon, step], index) => (
        <div
          key={index}
          className="flex flex-col gap-2 border-t-2 border-rule pt-6"
          {...stepAttributes(step)}
        >
          <div className="flex items-center gap-3">
            {icon ? <Icon icon={icon} size={28} /> : null}
            <p className="text-slide-meta text-fg-muted">{label}</p>
          </div>
          {/* An address, not a heading: under the 162px title it would skip a level. */}
          <p className="text-slide-body leading-[1.3] font-semibold text-fg">{value}</p>
        </div>
      ))}
    </div>
  );
}

/** The highest step among the contacts (the fourth entry of each). */
Contacts.slideSteps = ((props) =>
  maxStep(props.items.map(([, , , step]) => ({ step })))) satisfies StepCounter<ContactsProps>;
