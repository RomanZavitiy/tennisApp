import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// Pages in the (member) group need a finished profile. /profile is the first
// of them; later member pages get the same check from the shared layout.

test("a player without a profile is sent to onboarding first", async ({
  page,
  signIn,
}) => {
  await signIn();

  await page.goto("/profile");

  await expect(page).toHaveURL("/onboarding");
  await expect(
    page.getByRole("heading", { name: "Set up your profile" }),
  ).toBeVisible();
});

test("an onboarded player sees their profile, with age instead of birth date", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(createAdminClient(), user.id, {
    district: "PODGORZE_DUCHACKIE",
    self_rated_ntrp: 4,
  });

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Profile" })
    .click();

  await expect(page).toHaveURL("/profile");
  await expect(page.getByRole("heading", { name: "Ola" })).toBeVisible();
  await expect(page.getByText("Podgórze Duchackie")).toBeVisible();
  await expect(page.getByText("4.0")).toBeVisible();
  await expect(page.getByText("1995")).toHaveCount(0);
});
