import { expect, test } from "@playwright/test";

// The proxy sends signed-out users from protected pages to the login page and
// leaves public pages alone.

test("a protected page redirects to login and remembers where to return", async ({
  page,
}) => {
  await page.goto("/profile?tab=photo");

  await expect(page).toHaveURL("/login?next=%2Fprofile%3Ftab%3Dphoto");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

for (const path of ["/", "/clubs", "/offers", "/players/some-id", "/login"]) {
  test(`public page ${path} opens without signing in`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(path);
  });
}
