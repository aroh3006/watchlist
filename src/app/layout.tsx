import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderClient from "@/components/SessionProviderClient";

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
    <html lang="en" className={`dark ${spaceMono.variable}`}>
      <body className="font-sans antialiased">
        <SessionProviderClient>{children}</SessionProviderClient>
      </body>
    </html>
  );
}
