import { expect, test } from "@playwright/test";

// Smoke test for the e2e setup: the production build starts and serves the
// home page. Real flows (sign-in, offers) get their own specs from Epic 1.
test("home page loads", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("main")).toBeVisible();
});
