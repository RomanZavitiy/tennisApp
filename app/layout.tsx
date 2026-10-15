import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PushSubscribePrompt } from "@/components/push-subscribe-prompt";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MatchFinder Kraków",
    template: "%s · MatchFinder Kraków",
  },
  description: "Find a sparring partner and a court in Kraków.",
  // iOS Safari ignores the web app manifest's icons for "Add to Home
  // Screen" (task 5.14) — it only reads this tag.
  icons: { apple: "/icons/icon-192.png" },
};

// Separate from `metadata` since Next.js 16 (themeColor moved out of the
// metadata object in Next 14+).
export const viewport: Viewport = { themeColor: "#121212" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        {/* Site-wide, not just (member) pages: /offers/[id] (where "Ask to
            join" lives) is public, outside that route group. */}
        <PushSubscribePrompt />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
