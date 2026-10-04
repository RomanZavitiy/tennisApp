import { randomUUID } from "node:crypto";

import { test as base, expect } from "@playwright/test";

import {
  createAdminClient,
  deleteTestUser,
  TEST_EMAIL_DOMAIN,
  TEST_EMAIL_PREFIX,
} from "./supabase-admin";

export type TestUser = { id: string; email: string };

// `signIn(next)` signs the test's browser in as a fresh user without sending
// email: the admin API creates the user and returns the magic link's token,
// and the page opens /auth/callback with it — the same route a real link
// hits. Passing `as` signs in an existing test user again instead of making
// a new one. Users are deleted when the test ends, pass or fail.
export const test = base.extend<{
  signIn: (next?: string, as?: TestUser) => Promise<TestUser>;
}>({
  // Playwright calls the second argument `use`; renamed so the React hooks
  // lint rule doesn't mistake it for React's use().
  signIn: async ({ page }, provide) => {
    const admin = createAdminClient();
    const created: string[] = [];

    await provide(async (next = "/", as) => {
      const user = as ?? (await createTestUser());

      // generateLink doesn't send the email, so it doesn't use up the
      // built-in SMTP's hourly limit.
      const { data: linkData, error: linkError } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email: user.email,
        });
      if (linkError) throw linkError;

      const callback = new URLSearchParams({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
        next,
      });
      await page.goto(`/auth/callback?${callback.toString()}`);
      await expect(page).toHaveURL(next);

      return user;
    });

    for (const id of created) {
      await deleteTestUser(admin, id);
    }

    async function createTestUser(): Promise<TestUser> {
      const email = `${TEST_EMAIL_PREFIX}${randomUUID()}${TEST_EMAIL_DOMAIN}`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error) throw error;
      created.push(data.user.id);
      return { id: data.user.id, email };
    }
  },
});

export { expect };
