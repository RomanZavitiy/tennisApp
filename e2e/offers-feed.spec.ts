import { randomUUID } from "node:crypto";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// /offers lists open offers that haven't started yet (task 3.6). The
// database is shared, so the test finds its own offers by the author's
// unique name rather than counting cards.

const HOUR = 3_600_000;

test("the feed shows open upcoming offers only, with format and spots left", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  const name = `E2E Feed ${randomUUID().slice(0, 8)}`;
  await completeTestProfile(admin, author.id, { name });

  const soon = new Date(Date.now() + 2 * HOUR).toISOString();
  // defaultToNull: false lets rows that skip a column (status) get the
  // database default instead of null.
  const { error } = await admin.from("sparring_offers").insert(
    [
      // Shown: open, upcoming doubles, all three places free.
      {
        author_id: author.id,
        starts_at: soon,
        district: "PODGORZE",
        format: "DOUBLES",
        ntrp_min: 3,
        ntrp_max: 4.5,
      },
      // Hidden: already started.
      {
        author_id: author.id,
        starts_at: new Date(Date.now() - HOUR).toISOString(),
        district: "PODGORZE",
      },
      // Hidden: cancelled.
      {
        author_id: author.id,
        starts_at: soon,
        district: "PODGORZE",
        status: "CANCELLED",
      },
    ],
    { defaultToNull: false },
  );
  if (error) throw error;

  await page.goto("/offers");

  const cards = page.getByRole("listitem").filter({ hasText: `by ${name}` });
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("Doubles");
  await expect(cards).toContainText("3 spots left");
  await expect(cards).toContainText("Podgórze");
  await expect(cards).toContainText("NTRP 3.0–4.5");
});

test("a page past the end says there's nothing more", async ({ page }) => {
  await page.goto("/offers?page=9999");

  await expect(page.getByText("No more offers.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
});
