import type { MetadataRoute } from "next";

// Task 5.14: installable on Android (Chrome) and iOS 16.4+ ("Add to Home
// Screen", Safari only — see /install for the instruction). standalone hides
// the browser chrome once installed; theme_color matches the near-black
// primary the site already uses (no brand color yet, decision 0.19).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MatchFinder Kraków",
    short_name: "MatchFinder",
    description: "Find a sparring partner and a court in Kraków.",
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
