import { expect, test } from "./support/fixtures";

// Signed-in flows, using the email-free sign-in from support/fixtures.ts.
// /profile doesn't exist yet: reaching its 404 instead of /login proves the
// session got past the proxy.

test("a signed-in user reaches a protected page", async ({ page, signIn }) => {
  await signIn("/profile");

  await expect(page).toHaveURL("/profile");
  await expect(
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("button", { name: "Sign out" }),
  ).toBeVisible();
});

test("Sign out ends the session", async ({ page, context, signIn }) => {
  await signIn();
  const nav = page.getByRole("navigation", { name: "Main" });

  await nav.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/");
  await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
  const cookies = await context.cookies();
  expect(
    cookies.filter((cookie) => cookie.name.includes("-auth-token")),
  ).toEqual([]);

  await page.goto("/profile");
  await expect(page).toHaveURL("/login?next=%2Fprofile");
});

test.describe("mobile, 375px wide", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("Sign out from the menu ends the session", async ({ page, signIn }) => {
    await signIn();

    const menu = page.getByRole("navigation", { name: "Mobile" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await menu.getByRole("button", { name: "Sign out" }).click();

    // The test is already on "/", so the URL can't show that sign-out
    // finished; the menu offering "Sign in" again does.
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(menu.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.goto("/profile");
    await expect(page).toHaveURL("/login?next=%2Fprofile");
  });
});
