import { expect, test } from "./support/fixtures";
import { createAdminClient } from "./support/supabase-admin";

// Sign in → fill in the profile → land on the home page with the profile
// saved. Sending new users here automatically comes in the next task.

test("a new player fills in the profile", async ({ page, signIn }) => {
  const user = await signIn("/onboarding");

  await page.getByLabel("Name").fill("Ola");
  await page.getByLabel("Date of birth").fill("1995-04-12");
  await page.getByLabel("Gender").selectOption("Female");
  await page.getByLabel("District").selectOption("Łagiewniki-Borek Fałęcki");
  await page.getByLabel("Level (NTRP)").selectOption("3.5");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page).toHaveURL("/");

  const { data, error } = await createAdminClient()
    .from("users")
    .select(
      "name, birth_date, gender, district, self_rated_ntrp, onboarding_completed_at",
    )
    .eq("id", user.id)
    .single();
  if (error) throw error;
  expect(data).toMatchObject({
    name: "Ola",
    birth_date: "1995-04-12",
    gender: "FEMALE",
    district: "LAGIEWNIKI_BOREK_FALECKI",
    self_rated_ntrp: 3.5,
  });
  expect(data.onboarding_completed_at).not.toBeNull();

  // Done once: coming back to /onboarding goes home.
  await page.goto("/onboarding");
  await expect(page).toHaveURL("/");
});

test("an empty form shows a message for every field without saving", async ({
  page,
  signIn,
}) => {
  await signIn("/onboarding");
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });

  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText([
    "Enter your name.",
    "Enter your date of birth.",
    "Choose your gender.",
    "Choose your district.",
    "Choose your level.",
  ]);
  expect(posts).toEqual([]);
});

test("a player under 16 is turned away by the form", async ({
  page,
  signIn,
}) => {
  await signIn("/onboarding");

  await page.getByLabel("Name").fill("Kid");
  await page.getByLabel("Date of birth").fill("2015-06-01");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page.getByText("You must be at least 16 to join."),
  ).toBeVisible();
  await expect(page).toHaveURL("/onboarding");
});
