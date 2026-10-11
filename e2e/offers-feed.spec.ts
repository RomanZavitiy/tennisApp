import { randomUUID } from "node:crypto";

import { krakowLocalToDate, toKrakowLocal } from "../lib/offers/krakow-time";

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

/** 18:00 Kraków time, `days` from today, as an ISO string for the database. */
function daysAhead(days: number): { day: string; iso: string } {
  const day = toKrakowLocal(new Date(Date.now() + days * 86_400_000)).slice(
    0,
    10,
  );
  return { day, iso: krakowLocalToDate(`${day}T18:00`)?.toISOString() ?? "" };
}

test("filters narrow the feed, live in the URL and work with back", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  const name = `E2E Filter ${randomUUID().slice(0, 8)}`;
  await completeTestProfile(admin, author.id, { name });

  const first = daysAhead(1);
  const second = daysAhead(2);
  const { error } = await admin.from("sparring_offers").insert(
    [
      // Singles in Krowodrza for NTRP 3.0–4.0, tomorrow.
      {
        author_id: author.id,
        starts_at: first.iso,
        district: "KROWODRZA",
        ntrp_min: 3,
        ntrp_max: 4,
      },
      // Doubles in Podgórze for any level, the day after.
      {
        author_id: author.id,
        starts_at: second.iso,
        district: "PODGORZE",
        format: "DOUBLES",
      },
    ],
    { defaultToNull: false },
  );
  if (error) throw error;

  const mine = page.getByRole("listitem").filter({ hasText: `by ${name}` });
  const filters = page.getByRole("form", { name: "Filter offers" });

  await page.goto("/offers");
  await expect(mine).toHaveCount(2);

  await filters.getByLabel("District").selectOption("Podgórze");
  await filters.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/[?&]district=PODGORZE/);
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText("Doubles");

  // Back returns to the unfiltered feed.
  await page.goBack();
  await expect(page).toHaveURL("/offers");
  await expect(mine).toHaveCount(2);

  // A level above the singles' range leaves only the any-level doubles.
  await filters.getByLabel("My level (NTRP)").selectOption("4.5");
  await filters.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/[?&]ntrp=4\.5/);
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText("Doubles");

  // A shared link with filters opens the same feed; Clear removes them.
  await page.goto(`/offers?date=${first.day}&format=SINGLES`);
  await expect(filters.getByLabel("Format")).toHaveValue("SINGLES");
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText("Singles");
  await page.getByRole("link", { name: "Clear" }).click();
  await expect(page).toHaveURL("/offers");
  await expect(filters.getByLabel("Format")).toHaveValue("");
  await expect(mine).toHaveCount(2);
});
