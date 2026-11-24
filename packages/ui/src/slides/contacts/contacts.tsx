import type { ReactNode } from "react";

import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";
import { span } from "@/slides/lib/grid";

export type ContactsProps = {
  /** Label, value and optionally an icon from `ICONS` before the label (`ICONS.mail`, `ICONS.globe`, `ICONS.call`, `ICONS.pin`): E-Mail, Web, Telefon, Vor Ort. Three at most. */
  items: Array<[ReactNode, ReactNode, IconGlyph?]>;
};

/**
 * Up to three contact routes under rules: a label and the address itself.
 *
 * Addresses are written out so they can be read from the back of a room and typed from a
 * printout. A small icon may stand before each label; no buttons, no arrows.
 */
export function Contacts({ items }: ContactsProps) {
  return (
    <div
      data-slot="slide-contacts"
      className="grid gap-16"
      style={{ gridTemplateColumns: `repeat(${items.length}, ${span(4)}px)` }}
    >
      {items.map(([label, value, icon], index) => (
        <div key={index} className="flex flex-col gap-2 border-t-2 border-rule pt-6">
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
