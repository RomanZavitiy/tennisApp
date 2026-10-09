import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { createAdminClient, createTestClub } from "./support/supabase-admin";

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
    page.getByText(/^Info checked on \d{1,2} \w+ \d{4}\./),
  ).toBeVisible();

  for (const [linkName, href] of [
    ["Book a court", "https://example.com/book"],
    ["example.com", "https://example.com/club"],
  ]) {
    const link = page.getByRole("link", { name: linkName, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("the list's Details link leads to the club page", async ({ page }) => {
  await page.goto("/clubs");

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
