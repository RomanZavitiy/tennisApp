import { expect, test } from "@playwright/test";

const LINKS = [
  { label: "Sparring", path: "/offers" },
  { label: "Courts", path: "/clubs" },
  { label: "Sign in", path: "/login" },
];

test.describe("desktop header", () => {
  for (const { label, path } of LINKS) {
    test(`${label} leads to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: label })
        .click();

      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

test.describe("mobile, 375px wide", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const { label, path } of LINKS) {
    test(`menu link ${label} leads to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Open menu" }).click();
      await page
        .getByRole("navigation", { name: "Mobile" })
        .getByRole("link", { name: label })
        .click();

      await expect(page).toHaveURL(path);
      await expect(
        page.getByRole("navigation", { name: "Mobile" }),
      ).toBeHidden();
    });
  }

  for (const path of ["/", ...LINKS.map((link) => link.path)]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }
});
