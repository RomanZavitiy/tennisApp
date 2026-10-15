import type { Metadata } from "next";

export const metadata: Metadata = { title: "Install the app" };

// Public (task 5.14): shown before sign-in too, since the iOS push hint
// (5.15, "Install the app to get notifications") links here for someone who
// hasn't signed in yet either. iOS only gets web push inside an installed
// PWA (Safari, 16.4+) — Android/Chrome gets push either way, so installing
// there is a convenience, not a requirement, and the copy says so.
export default function InstallPage() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Install MatchFinder
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Installing the app gets you a home screen icon and — on iPhone, the only
        way to get them at all — notifications for new requests, messages and
        matches.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">iPhone or iPad (Safari)</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          <li>Open this site in Safari (not Chrome or another browser).</li>
          <li>
            Tap the Share icon (a square with an arrow pointing up) in the
            toolbar.
          </li>
          <li>Scroll down and tap “Add to Home Screen”.</li>
          <li>Tap “Add” in the top-right corner.</li>
          <li>
            Open MatchFinder from the new icon on your home screen — push
            notifications only work from there, not from Safari itself.
          </li>
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          Requires iOS 16.4 or later.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Android (Chrome)</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          <li>Open this site in Chrome.</li>
          <li>
            Tap the menu (three dots, top-right) and choose “Install app” or
            “Add to Home screen”.
          </li>
          <li>Confirm by tapping “Install”.</li>
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          Chrome may also show an install banner on its own — if so, that works
          too.
        </p>
      </section>
    </main>
  );
}
