import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { createAdminClient, createTestClub } from "./support/supabase-admin";

test("courts page shows the OSM map without errors", async ({ page }) => {
  // A broken Leaflet setup shows up as an uncaught error in the browser.
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/clubs");

  await expect(page.locator(".leaflet-container")).toBeVisible();
  // Checks the tile URL, not the image itself, so the test doesn't depend on
  // the OSM tile servers being reachable.
  await expect(page.locator("img.leaflet-tile").first()).toHaveAttribute(
    "src",
    /^https:\/\/tile\.openstreetmap\.org\/\d+\//,
  );
  // OSM tile usage policy: the attribution must link to the copyright page.
  await expect(
    page.getByRole("link", { name: "OpenStreetMap" }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  expect(errors).toEqual([]);
});

test("a club shows as a marker with its details in a popup", async ({
  page,
}) => {
  const admin = createAdminClient();
  const name = `E2E Club ${randomUUID().slice(0, 8)}`;
  const address = "Rynek Główny 1, 31-042 Kraków";
  // Not where the other club specs put theirs: the files run in parallel,
  // and markers on the same spot would cover each other.
  const id = await createTestClub(admin, {
    name,
    address,
    latitude: 50.0664,
    longitude: 19.9466,
  });

  try {
    await page.goto("/clubs");
    await page.getByAltText(name).click();

    const popup = page.locator(".leaflet-popup");
    await expect(popup).toContainText(name);
    await expect(popup).toContainText(address);
    await expect(
      popup.getByRole("link", { name: "Club details" }),
    ).toHaveAttribute("href", `/clubs/${id}`);
  } finally {
    const { error } = await admin.from("clubs").delete().eq("id", id);
    if (error) throw error;
  }
});
