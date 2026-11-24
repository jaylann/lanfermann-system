import type { ReactNode } from "react";

import { Contacts } from "@/slides/contacts/contacts";
import { Forms } from "@/slides/forms/forms";
import type { IconGlyph } from "@/slides/icon/icons";
import { Lead } from "@/slides/lead/lead";
import { span } from "@/slides/lib/grid";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";
import { Wordmark } from "@/slides/wordmark/wordmark";

export type ClosingSlideProps = {
  /** The ask at 162px: what the reader gets or does next. Two lines at most. */
  title: ReactNode;
  /** One or two sentences that make the ask concrete. */
  lead?: ReactNode;
  /**
   * Up to three contact routes: label, address and optionally an icon from `ICONS` before the
   * label (`ICONS.mail`, `ICONS.globe`, `ICONS.call`, `ICONS.pin`).
   */
  contacts?: Array<[ReactNode, ReactNode, IconGlyph?]>;
  /** A QR code image file, shown top right on a white pad. It takes the place of the forms. */
  qr?: string;
  /** What scanning the code does, for screen readers. „QR-Code zur Terminbuchung“ by default. */
  qrLabel?: string;
  /** The composition when there is no QR code. `set` by default. */
  forms?: "set" | "drop";
  /** The slide's id. */
  id?: string;
  /** What the presenter says here. Never drawn on the slide. */
  notes?: ReactNode;
};

/**
 * The ask on Indigo: what the reader should do next, and how to reach Justin.
 *
 * The only slide on Indigo, once, at the end. It asks for one thing. Not „Vielen Dank“, not
 * „Fragen?“: the next step in the reader's words („Eine kostenlose Analyse.“). The top right
 * corner holds the `set` forms (an ink quarter with a lavender disc below it) or a QR code, never
 * both. A QR code is black on a white pad with 16px of quiet zone; never recolour it.
 */
export function ClosingSlide({
  title,
  lead,
  contacts = [],
  qr,
  qrLabel = "QR-Code zur Terminbuchung",
  forms = "set",
  id,
  notes,
}: ClosingSlideProps) {
  return (
    <Slide ground="indigo" footer={false} gap={48} id={id} notes={notes}>
      {qr == null && <Forms name={forms} />}
      <Wordmark size={32} style={{ position: "absolute", left: 128, top: 128, width: span(5) }} />
      {qr != null && (
        // The pad is white on every ground: a code is black on white, or it does not scan.
        <div className="absolute top-32 right-32 flex size-56 bg-fg p-4">
          <img src={qr} alt={qrLabel} className="size-48 object-contain" />
        </div>
      )}
      <Spacer />
      <Title size="cover">{title}</Title>
      {lead != null && <Lead>{lead}</Lead>}
      <Contacts items={contacts} />
    </Slide>
  );
}
