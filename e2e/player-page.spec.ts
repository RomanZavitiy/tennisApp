import { randomUUID } from "node:crypto";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// /players/[id] is public: anyone can see a player's name, photo, age,
// district and level — never the birth date or email.

test("anyone can see an onboarded player's public profile", async ({
  page,
  context,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(createAdminClient(), user.id, {
    name: "Ola",
    birth_date: "1995-04-12",
    district: "NOWA_HUTA",
    self_rated_ntrp: 5,
  });
  // Look at it signed out, the way a stranger would.
  await context.clearCookies();

  const response = await page.goto(`/players/${user.id}`);

  await expect(page.getByRole("heading", { name: "Ola" })).toBeVisible();
  await expect(page.getByText("Nowa Huta")).toBeVisible();
  await expect(page.getByText("5.0")).toBeVisible();
  await expect(page).toHaveTitle(/^Ola/);
  // The whole HTML, including the data Next.js embeds in <script> tags for
  // hydration — not just the visible text.
  const html = (await response?.text()) ?? "";
  expect(html).not.toContain("1995");
  expect(html).not.toContain(user.email);
});

test("a player who hasn't finished onboarding has no public page", async ({
  page,
  signIn,
}) => {
  const user = await signIn();

  const response = await page.goto(`/players/${user.id}`);

  expect(response?.status()).toBe(404);
});

for (const id of [randomUUID(), "not-a-uuid"]) {
  test(`an unknown id (${id.length === 36 ? "UUID" : id}) is a 404`, async ({
    page,
  }) => {
    const response = await page.goto(`/players/${id}`);

    expect(response?.status()).toBe(404);
  });
}
