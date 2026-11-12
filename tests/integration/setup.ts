import { afterAll, vi } from "vitest";

import { testDatabaseUrl } from "@/scripts/local-db-url";
import { RedirectSignal } from "@/tests/integration/helpers/next";
import { currentSessionUser } from "@/tests/integration/helpers/session";

// Runs before every integration test file imports anything from the app.
//
// The database is real. lib/db.ts reads DATABASE_URL when it is first
// imported, so it is set here, from TEST_DATABASE_URL only -- .env.local
// (the shared Supabase database) is never loaded, and testDatabaseUrl()
// throws unless the host is this machine.
process.env.DATABASE_URL = testDatabaseUrl();

// Only the thin edges are stubbed: what needs a Next.js request (the cache,
// redirects, the session cookie) and what leaves the process (push/email,
// analytics). next-intl is stubbed by tests/setup/next-intl.ts, shared with
// the unit tests.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new RedirectSignal(path);
  },
}));

// The session: who is signed in comes from runAs() (helpers/session.ts)
// instead of a Supabase cookie. requireOnboardedUser() on top of it is the
// real one, reading the real users row.
vi.mock("@/lib/auth/require-user", () => ({
  getCurrentUser: () => Promise.resolve(currentSessionUser()),
  requireUser: () => Promise.resolve(currentSessionUser()),
}));

vi.mock("@/lib/notifications/notify", () => ({
  notify: vi.fn(() => Promise.resolve()),
  notifyBookingRequested: vi.fn(() => Promise.resolve()),
  notifyBookingCancelled: vi.fn(() => Promise.resolve()),
  notifyBookingDecided: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/analytics/posthog", () => ({
  captureEvent: vi.fn(() => Promise.resolve()),
}));

afterAll(async () => {
  const { db } = await import("@/lib/db");
  await db.$disconnect();
});
