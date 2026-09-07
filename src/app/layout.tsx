import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderClient from "@/components/SessionProviderClient";
import { ThemeSync } from "@/components/ThemeSync";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Helvetica isn't distributable as a web font (no Google Fonts license for
// it). This stack renders genuine Helvetica on macOS/iOS, where the OS
// ships it, and falls back to Arial elsewhere, a metrically-identical clone.
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Track what you watch. Discover what's next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable} suppressHydrationWarning>
      <head>
        {/* Sets the dark class before first paint, from the stored choice or
            the OS preference, so there is no flash of the wrong theme. This
            has to run this early, a useEffect in a component would only run
            after the first (wrongly themed) frame is already on screen. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeSync />
        <SessionProviderClient>{children}</SessionProviderClient>
      </body>
    </html>
  );
}
