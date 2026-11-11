import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { RegisterServiceWorker } from "@/components/register-service-worker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

// Inter with latin-ext: Polish letters (ą, ę, ł, ś, ż…) come from the same
// font instead of a system fallback.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Headings only (redesign): a display face with more character than Inter.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
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
export const viewport: Viewport = {
  // The browser's own chrome follows the system setting (it can't see the
  // in-app theme switch): court green in light, the page background in dark.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a693c" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Task 1.20: the active language always comes from the NEXT_LOCALE cookie
  // (proxy.ts sets it on first visit; i18n/request.ts reads it on every
  // request) — never from the browser alone past the first visit.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      // next-themes sets the theme class on <html> before React hydrates.
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <RegisterServiceWorker />
            <SiteHeader />
            {children}
            <SiteFooter />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
