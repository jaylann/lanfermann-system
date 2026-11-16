/*
 * Sample code for the workshop: what a reader of documentation for this library would really
 * see. Not exported from the package.
 */

export const sendQuote = `"use client";

import { Button, toast } from "@lanfermann/ui";
import { useTransition } from "react";

import { sendQuote } from "./actions";

/** Sendet das Angebot und meldet, wenn es angekommen ist. */
export function SendQuote({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="primary"
      loading={pending}
      onClick={() =>
        start(async () => {
          await sendQuote(id);
          toast({ title: "Das Angebot wurde gesendet.", tone: "success" });
        })
      }
    >
      Angebot senden
    </Button>
  );
}
`;

export const globalsBefore = `@import "tailwindcss";
@import "./theme.css";
@import "@lanfermann/ui/styles.css";

@source "../components";
`;

export const install = [
  { label: "bun", code: "bun add @lanfermann/ui", language: "sh" },
  { label: "npm", code: "npm install @lanfermann/ui", language: "sh" },
  { label: "pnpm", code: "pnpm add @lanfermann/ui", language: "sh" },
] as const;

export const passRenderer = `import PDFKit
import PassKit

/// Macht aus einem PDF einen Wallet-Pass. Das PDF verlässt dabei das iPhone nicht.
struct PassRenderer {
    let document: PDFDocument
    var scale: CGFloat = 2

    func render(page index: Int = 0) async throws -> PKPass {
        guard let page = document.page(at: index) else {
            throw RenderError.emptyDocument
        }
        let image = page.thumbnail(of: page.bounds(for: .mediaBox).size * scale, for: .mediaBox)
        let barcode = try await BarcodeReader().firstCode(in: image)
        var pass = PassTemplate.generic(title: document.title ?? "Pass")
        pass.barcode = barcode
        pass.strip = image
        return try pass.signed()
    }
}

enum RenderError: Error {
    case emptyDocument
    case noBarcode
}

extension CGSize {
    static func * (size: CGSize, factor: CGFloat) -> CGSize {
        CGSize(width: size.width * factor, height: size.height * factor)
    }
}
`;

export const readme = `## Installation

Die Bibliothek braucht Tailwind CSS ab Version 4 und React 19. Sie wird nach der Installation einmal gebaut, danach importiert eine App nur noch die Komponenten und eine Stylesheet-Datei.
`;
