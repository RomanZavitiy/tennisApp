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

// Google itself can't be driven from a test. What can be checked is our half:
// the button sends the browser to Supabase's authorize endpoint for Google,
// asks to come back to our callback with `next`, and starts PKCE (the code
// challenge in the URL, the verifier in a cookie for /auth/callback).
test("Continue with Google starts the OAuth flow back to our callback", async ({
  page,
  context,
  baseURL,
}) => {
  await page.route("**/auth/v1/authorize?**", (route) =>
    route.fulfill({ status: 200, body: "Google sign-in stub" }),
  );

  await page.goto("/login?next=/profile");
  const [request] = await Promise.all([
    page.waitForRequest("**/auth/v1/authorize?**"),
    page.getByRole("button", { name: "Continue with Google" }).click(),
  ]);

  const authorize = new URL(request.url());
  expect(authorize.searchParams.get("provider")).toBe("google");
  expect(authorize.searchParams.get("redirect_to")).toBe(
    `${String(baseURL)}/auth/callback?next=%2Fprofile`,
  );
  expect(authorize.searchParams.get("code_challenge")).toBeTruthy();

  const cookies = await context.cookies();
  expect(
    cookies.some((cookie) => cookie.name.endsWith("-auth-token-code-verifier")),
  ).toBe(true);
});
