import { expect, test } from "@playwright/test";

// The happy path (a real email arriving) can't run here; signing in without
// email comes with the e2e helper in task 1.18. These cover what doesn't
// send mail: validation in the browser and a bad link.

test.describe("login form", () => {
  for (const [email, message] of [
    ["", "Enter your email address."],
    ["not-an-email", "Enter a valid email address."],
  ]) {
    test(`shows "${message}" for ${JSON.stringify(email)} without calling the server`, async ({
      page,
    }) => {
      const posts: string[] = [];
      page.on("request", (request) => {
        if (request.method() === "POST") posts.push(request.url());
      });

      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page
        .getByRole("button", { name: "Email me a sign-in link" })
        .click();

      await expect(page.getByRole("main").getByRole("alert")).toHaveText(
        message,
      );
      expect(posts).toEqual([]);
    });
  }
});

test("an invalid or expired link returns to login with a message", async ({
  page,
}) => {
  const response = await page.goto(
    "/auth/callback?token_hash=expired&type=email&next=/profile",
  );

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL("/login?error=link&next=%2Fprofile");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "invalid or has expired",
  );
});
