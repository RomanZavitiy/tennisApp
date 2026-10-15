"use client";

import { useEffect } from "react";

// Registers public/sw.js (task 5.14) once, on every page — installability
// needs a controlling service worker, and push (5.15) needs the same
// registration to subscribe against. Renders nothing.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Nothing to show for it — installability degrades gracefully to
        // "just a website" without a worker.
      });
    }
  }, []);

  return null;
}
