import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { createAdminClient, createTestClub } from "./support/supabase-admin";

// One test club for the whole file; real clubs aren't loaded yet, and the
// tests must not depend on them anyway.
const name = `E2E Club ${randomUUID().slice(0, 8)}`;
let admin: ReturnType<typeof createAdminClient>;
let id: string;

test.beforeAll(async () => {
  admin = createAdminClient();
  id = await createTestClub(admin, {
    name,
    address: "Rynek Główny 1, 31-042 Kraków",
    latitude: 50.0614,
    longitude: 19.9366,
  });
});

test.afterAll(async () => {
  const { error } = await admin.from("clubs").delete().eq("id", id);
  if (error) throw error;
});

test("desktop shows the club list and the map side by side", async ({
  page,
}) => {
  await page.goto("/clubs");

  const link = page.getByRole("link", { name });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", `/clubs/${id}`);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // No switch: there is room for both.
  await expect(page.getByRole("button", { name: "Map" })).toBeHidden();

  const listBox = await link.boundingBox();
  const mapBox = await page.locator(".leaflet-container").boundingBox();
  expect(listBox?.x).toBeLessThan(mapBox?.x ?? 0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the List/Map switch shows one at a time", async ({ page }) => {
    await page.goto("/clubs");

    const link = page.getByRole("link", { name });
    const map = page.locator(".leaflet-container");
    await expect(link).toBeVisible();
    await expect(map).toBeHidden();

    await page.getByRole("button", { name: "Map" }).click();
    await expect(map).toBeVisible();
    await expect(link).toBeHidden();
    // The club sits at the map's center. A map that kept the size it measured
    // while hidden (0×0) would draw it in the top-left corner instead.
    const marker = page.getByAltText(name);
    await expect(marker).toBeVisible();
    const mapBox = await map.boundingBox();
    const markerBox = await marker.boundingBox();
    if (!mapBox || !markerBox) throw new Error("Map or marker has no box.");
    // The icon's tip (bottom middle) marks the point.
    expect(
      Math.abs(
        markerBox.x + markerBox.width / 2 - (mapBox.x + mapBox.width / 2),
      ),
    ).toBeLessThan(5);
    expect(
      Math.abs(markerBox.y + markerBox.height - (mapBox.y + mapBox.height / 2)),
    ).toBeLessThan(5);

    await page.getByRole("button", { name: "List" }).click();
    await expect(link).toBeVisible();
    await expect(map).toBeHidden();
  });
});
