import { randomUUID } from "node:crypto";

import { test as base, expect } from "@playwright/test";

import {
  createAdminClient,
  TEST_EMAIL_DOMAIN,
  TEST_EMAIL_PREFIX,
} from "./supabase-admin";

type TestUser = { id: string; email: string };

// `signIn(next)` signs the test's browser in as a fresh user without sending
// email: the admin API creates the user and returns the magic link's token,
// and the page opens /auth/callback with it — the same route a real link
// hits. The user is deleted when the test ends, pass or fail.
export const test = base.extend<{
  signIn: (next?: string) => Promise<TestUser>;
}>({
  // Playwright calls the second argument `use`; renamed so the React hooks
  // lint rule doesn't mistake it for React's use().
  signIn: async ({ page }, provide) => {
    const admin = createAdminClient();
    const created: string[] = [];

    await provide(async (next = "/") => {
      const email = `${TEST_EMAIL_PREFIX}${randomUUID()}${TEST_EMAIL_DOMAIN}`;

      const { data: userData, error: createError } =
        await admin.auth.admin.createUser({ email, email_confirm: true });
      if (createError) throw createError;
      created.push(userData.user.id);

      // generateLink doesn't send the email, so it doesn't use up the
      // built-in SMTP's hourly limit.
      const { data: linkData, error: linkError } =
        await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw linkError;

      const callback = new URLSearchParams({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
        next,
      });
      await page.goto(`/auth/callback?${callback.toString()}`);
      await expect(page).toHaveURL(next);

      return { id: userData.user.id, email };
    });

    for (const id of created) {
      await admin.auth.admin.deleteUser(id);
    }
  },
});

export { expect };
