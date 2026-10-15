// Service worker (task 5.14). It exists for two things: letting the browser
// install the app (manifest.ts + a registered, controlling worker is the
// installability check) and showing web push notifications (5.15-5.16).
// It never caches anything — every page here can show personal data
// (offers, chat, profile), and a stale cached copy of any of them would be
// the wrong kind of "fast". `fetch` is a plain passthrough so the worker
// still controls the page, which the installability check wants.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window" });
      const existing = windows.find((client) => client.url.endsWith(url));
      if (existing) {
        await existing.focus();
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
