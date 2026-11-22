import "./globals.css";

import { cn, ThemeScript } from "@lanfermann/ui";
import type { Metadata } from "next";
import { JetBrains_Mono, Sofia_Sans } from "next/font/google";

import { Consent } from "./consent";

// The library reads these two variables (see @lanfermann/ui styles/type.css). They must sit on
// <html>: the root font stack resolves there, before <body> exists.
const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "lanfermann-system",
  description: "Consumer smoke test for the @lanfermann/ui component library.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `ThemeScript` writes `data-mode` on <html> before React hydrates: the DOM wins there.
    <html
      lang="de"
      className={cn(sofiaSans.variable, jetBrainsMono.variable, "h-full")}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      {/* Base UI: `relative` on body for iOS Safari backdrops, `isolate` root for portaled popups. */}
      <body className="relative min-h-full bg-ground font-sans text-fg-body">
        <div className="isolate flex min-h-full flex-col">
          <Consent>{children}</Consent>
        </div>
      </body>
    </html>
  );
}
