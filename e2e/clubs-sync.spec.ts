import { randomUUID } from "node:crypto";

import { expect, type Page, test } from "@playwright/test";

import { createAdminClient, createTestClub } from "./support/supabase-admin";

// Two test clubs, named so they sort to the end of the list, below any real
// clubs. "Far" is at the city's edge, so the map has to move to center it;
// "near" is away from the points the other club specs use, as they run in
// parallel.
const suffix = randomUUID().slice(0, 8);
const far = { name: `Zz E2E Far ${suffix}`, id: "" };
const near = { name: `Zz E2E Near ${suffix}`, id: "" };
let admin: ReturnType<typeof createAdminClient>;

test.beforeAll(async () => {
  admin = createAdminClient();
  far.id = await createTestClub(admin, {
    name: far.name,
    address: "Far Street 1, Kraków",
    latitude: 50.12,
    longitude: 20.15,
  });
  near.id = await createTestClub(admin, {
    name: near.name,
    address: "Near Street 1, Kraków",
    latitude: 50.0564,
    longitude: 19.9266,
  });
});

test.afterAll(async () => {
  const { error } = await admin
    .from("clubs")
    .delete()
    .in("id", [far.id, near.id]);
  if (error) throw error;
});

// Leaflet gives each marker role="button" with the club's name too, so look
// inside the list.
function listEntry(page: Page, name: string) {
  return page.getByRole("list").getByRole("button", { name });
}

test("a club clicked in the list is shown on the map with its popup", async ({
  page,
}) => {
  await page.goto("/clubs");
  const map = page.locator(".leaflet-container");
  const marker = page.getByAltText(far.name);
  await expect(map).toBeVisible();

  await listEntry(page, far.name).click();

  await expect(page.locator(".leaflet-popup")).toContainText(far.name);
  await expect(marker).toBeInViewport();
  // Centered across. Not checked down: the popup pans the map to fit above.
  const mapBox = await map.boundingBox();
  const markerBox = await marker.boundingBox();
  if (!mapBox || !markerBox) throw new Error("Map or marker has no box.");
  expect(
    Math.abs(markerBox.x + markerBox.width / 2 - (mapBox.x + mapBox.width / 2)),
  ).toBeLessThan(5);
});

test("a marker click highlights its club in the list and scrolls to it", async ({
  page,
}) => {
  await page.goto("/clubs");
  const entry = listEntry(page, near.name);
  await expect(entry).toHaveAttribute("aria-pressed", "false");

  await page.getByAltText(near.name).click();

  await expect(entry).toHaveAttribute("aria-pressed", "true");
  await expect(entry).toBeInViewport();

  // Closing the popup lets go of the club.
  await page.locator(".leaflet-popup-close-button").click();
  await expect(entry).toHaveAttribute("aria-pressed", "false");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a club clicked in the list switches to the map", async ({ page }) => {
    await page.goto("/clubs");
    const entry = listEntry(page, far.name);

    await entry.click();

    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(entry).toBeHidden();
    await expect(page.locator(".leaflet-popup")).toContainText(far.name);
    await expect(page.getByAltText(far.name)).toBeInViewport();
  });
});
