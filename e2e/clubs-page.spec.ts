import { randomUUID } from "node:crypto";

import { expect, type Locator, test } from "@playwright/test";

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

test("the first view shows every club", async ({ page }) => {
  await page.goto("/clubs");
  const map = page.locator(".leaflet-container");
  await expect(page.getByAltText(name)).toBeVisible();

  await expectAllMarkersInside(map);
});

// Each marker's tip (bottom middle, the club's point) lies inside the map.
async function expectAllMarkersInside(map: Locator) {
  const mapBox = await map.boundingBox();
  if (!mapBox) throw new Error("Map has no box.");
  const markers = await map.locator(".leaflet-marker-icon").all();
  expect(markers.length).toBeGreaterThan(0);
  for (const marker of markers) {
    const box = await marker.boundingBox();
    if (!box) throw new Error("Marker has no box.");
    const x = box.x + box.width / 2;
    const y = box.y + box.height;
    expect(x).toBeGreaterThan(mapBox.x);
    expect(x).toBeLessThan(mapBox.x + mapBox.width);
    expect(y).toBeGreaterThan(mapBox.y);
    expect(y).toBeLessThan(mapBox.y + mapBox.height);
  }
}

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
    // Every club is in the first view (2.12). A map that kept the size it
    // measured while hidden (0×0) would fit them into nothing instead.
    await expect(page.getByAltText(name)).toBeVisible();
    await expectAllMarkersInside(map);

    await page.getByRole("button", { name: "List" }).click();
    await expect(link).toBeVisible();
    await expect(map).toBeHidden();
  });
});
