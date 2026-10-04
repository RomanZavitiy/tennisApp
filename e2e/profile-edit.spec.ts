import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// /profile/edit reuses the onboarding form, filled in with the current
// profile, and saves back to /profile.

test("a player edits their profile", async ({ page, signIn }) => {
  const user = await signIn();
  await completeTestProfile(createAdminClient(), user.id, {
    name: "Ola",
    district: "KROWODRZA",
    self_rated_ntrp: 3.5,
  });

  await page.goto("/profile");
  await page.getByRole("link", { name: "Edit profile" }).click();
  await expect(page).toHaveURL("/profile/edit");

  // The form starts from the saved profile.
  await expect(page.getByLabel("Name")).toHaveValue("Ola");
  await expect(page.getByLabel("Date of birth")).toHaveValue("1995-04-12");
  await expect(page.getByLabel("Gender")).toHaveValue("FEMALE");
  await expect(page.getByLabel("District")).toHaveValue("KROWODRZA");
  await expect(page.getByLabel("Level (NTRP)")).toHaveValue("3.5");

  await page.getByLabel("Name").fill("Aleksandra");
  await page.getByLabel("District").selectOption("Dębniki");
  await page.getByLabel("Level (NTRP)").selectOption("4.0");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL("/profile");
  await expect(page.getByRole("heading", { name: "Aleksandra" })).toBeVisible();
  await expect(page.getByText("Dębniki")).toBeVisible();
  await expect(page.getByText("4.0")).toBeVisible();
});

test("an invalid edit stays on the form with a message", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(createAdminClient(), user.id);

  await page.goto("/profile/edit");
  await page.getByLabel("Name").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Enter your name.",
  );
  await expect(page).toHaveURL("/profile/edit");
});

test("a player without a profile can't reach the edit page", async ({
  page,
  signIn,
}) => {
  await signIn();

  await page.goto("/profile/edit");

  await expect(page).toHaveURL("/onboarding");
});
