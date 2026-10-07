import { expect, test } from "@playwright/test";

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
    /^https:\/\/tile\.openstreetmap\.org\/13\//,
  );
  // OSM tile usage policy: the attribution must link to the copyright page.
  await expect(
    page.getByRole("link", { name: "OpenStreetMap" }),
  ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  expect(errors).toEqual([]);
});
