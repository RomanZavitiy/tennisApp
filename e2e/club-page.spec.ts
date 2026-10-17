import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { createAdminClient, createTestClub } from "./support/supabase-admin";

// Tasks 2.10 and 2.13 share this file: /clubs/[id] is where both the active
// offers section and the booking click land.

// /clubs/[id] is public and shows every known field of the club.
const name = `E2E Club Page ${randomUUID().slice(0, 8)}`;
let admin: ReturnType<typeof createAdminClient>;
let id: string;

test.beforeAll(async () => {
  admin = createAdminClient();
  id = await createTestClub(admin, {
    name,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
  const { error } = await admin
    .from("clubs")
    .update({
      surfaces: ["CLAY", "ARTIFICIAL_CLAY"],
      indoor: "WINTER_BUBBLE",
      price_info: "Summer: 60 zł/h",
      phone: "+48 12 000 00 00",
      website_url: "https://example.com/club",
      booking_url: "https://example.com/book",
    })
    .eq("id", id);
  if (error) throw error;
});

test.afterAll(async () => {
  const { error } = await admin.from("clubs").delete().eq("id", id);
  if (error) throw error;
});

test("anyone can see a club's details and book on the club's site", async ({
  page,
}) => {
  await page.goto(`/clubs/${id}`);

  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(`^${name}`));
  await expect(page.getByText("Testowa 1, 30-001 Kraków")).toBeVisible();
  await expect(page.getByText("Stare Miasto")).toBeVisible();
  await expect(page.getByText("Clay, Artificial clay")).toBeVisible();
  await expect(page.getByText("Covered in winter (bubble)")).toBeVisible();
  await expect(page.getByText("Summer: 60 zł/h")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "+48 12 000 00 00" }),
  ).toHaveAttribute("href", "tel:+48120000000");
  await expect(
    // "October 9, 2026" — next-intl's en locale formatting (task 1.20), not
    // the day-first "9 October 2026" the old hand-rolled en-GB formatter gave.
    page.getByText(/^Info checked on \w+ \d{1,2}, \d{4}\./),
  ).toBeVisible();

  for (const [linkName, href] of [
    // Tagged with utm_source for the club's own analytics and our click log
    // (task 2.13) — the "About" website link isn't a booking action, so it
    // stays untagged.
    ["Book a court", "https://example.com/book?utm_source=matchfinder"],
    ["example.com", "https://example.com/club"],
  ]) {
    const link = page.getByRole("link", { name: linkName, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }

  // No offers yet (task 2.10): the empty state's own CTA pre-selects this club.
  await expect(
    page.getByText("No open offers at this club right now."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create an offer at this club" }),
  ).toHaveAttribute("href", `/offers/new?clubId=${id}`);
});

test("an open offer at this club is listed", async ({ page }) => {
  // No sign-in needed: users.id has no foreign key to auth.users (task 1.9),
  // so a plain row is enough to be an offer's author for this read-only check
  // — and it's one fewer magic-link verification (decision 2026-10-11/14).
  const authorId = randomUUID();
  const { error: userError } = await admin
    .from("users")
    .insert({ id: authorId });
  if (userError) throw userError;
  const { error } = await admin.from("sparring_offers").insert({
    author_id: authorId,
    starts_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    club_id: id,
  });
  if (error) throw error;

  await page.goto(`/clubs/${id}`);

  await expect(page.getByRole("link", { name: /1 spot left/ })).toBeVisible();
  await expect(
    page.getByText("No open offers at this club right now."),
  ).toHaveCount(0);

  await admin.from("sparring_offers").delete().eq("club_id", id);
  await admin.from("users").delete().eq("id", authorId);
});

test("the list's Details link leads to the club page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: `${name} details` }).click();

  await expect(page).toHaveURL(`/clubs/${id}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
});

for (const unknownId of [randomUUID(), "not-a-uuid"]) {
  test(`an unknown id (${unknownId.length === 36 ? "UUID" : unknownId}) is a 404`, async ({
    page,
  }) => {
    const response = await page.goto(`/clubs/${unknownId}`);

    expect(response?.status()).toBe(404);
  });
}
