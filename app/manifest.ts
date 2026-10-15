import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

// Task 5.14: installable on Android (Chrome) and iOS 16.4+ ("Add to Home
// Screen", Safari only — see /install for the instruction). standalone hides
// the browser chrome once installed; theme_color matches the near-black
// primary the site already uses (no brand color yet, decision 0.19).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("Metadata");
  return {
    name: t("siteName"),
    short_name: "MatchFinder",
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#121212",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
