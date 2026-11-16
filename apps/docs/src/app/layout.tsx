import "./globals.css";

import { cn } from "@lanfermann/ui";
import type { Metadata } from "next";
import { JetBrains_Mono, Sofia_Sans } from "next/font/google";

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
    <html lang="de" className={cn(sofiaSans.variable, jetBrainsMono.variable, "h-full")}>
      {/* Base UI: `relative` on body for iOS Safari backdrops, `isolate` root for portaled popups. */}
      <body className="relative min-h-full bg-ground font-sans text-fg-body">
        <div className="isolate flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
