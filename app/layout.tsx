import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const siteName = t("siteName");
  return {
    title: { default: siteName, template: `%s · ${siteName}` },
    description: t("description"),
    // iOS Safari ignores the web app manifest's icons for "Add to Home
    // Screen" (task 5.14) — it only reads this tag.
    icons: { apple: "/icons/icon-192.png" },
  };
}

// Separate from `metadata` since Next.js 16 (themeColor moved out of the
// metadata object in Next 14+).
export const viewport: Viewport = { themeColor: "#0a693c" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Task 1.20: the active language always comes from the NEXT_LOCALE cookie
  // (proxy.ts sets it on first visit; i18n/request.ts reads it on every
  // request) — never from the browser alone past the first visit.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RegisterServiceWorker />
          {/* Site-wide, not just (member) pages: /offers/[id] (where "Ask to
              join" lives) is public, outside that route group. */}
          <PushSubscribePrompt />
          <SiteHeader />
          {children}
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
