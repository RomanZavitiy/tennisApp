import { randomUUID } from "node:crypto";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// /offers/[id] (task 3.13): what a guest, a player and the author each see,
// and the request → accept flow end to end. Offers go away with their test
// author.

async function createOffer(authorId: string) {
  const { data, error } = await createAdminClient()
    .from("sparring_offers")
    .insert({
      author_id: authorId,
      starts_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      district: "PODGORZE",
      comment: "Bring balls, please.",
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data.id;
}

test("a guest sees the offer and a link to sign in", async ({
  page,
  signIn,
}) => {
  const author = await signIn();
  await completeTestProfile(createAdminClient(), author.id, { name: "Ola" });
  const id = await createOffer(author.id);
  await page.context().clearCookies();

  await page.goto(`/offers/${id}`);

  await expect(page.getByText("Singles")).toBeVisible();
  await expect(page.getByText("1 spot left")).toBeVisible();
  await expect(page.getByText("Podgórze")).toBeVisible();
  await expect(page.getByText("Bring balls, please.")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Ola/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in to join" }),
  ).toHaveAttribute(
    "href",
    `/login?next=${encodeURIComponent(`/offers/${id}`)}`,
  );
});

test("a player asks to join and the author accepts", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  await completeTestProfile(admin, author.id, { name: "Author" });
  const id = await createOffer(author.id);
  const playerName = `E2E Player ${randomUUID().slice(0, 8)}`;

  // The player asks to join.
  const player = await signIn(`/offers/${id}`);
  await completeTestProfile(admin, player.id, {
    name: playerName,
    self_rated_ntrp: 4,
  });
  await page.reload();
  await page.getByRole("button", { name: "Ask to join" }).click();
  await expect(page.getByText("Request sent.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Withdraw" })).toBeVisible();

  // The author sees the request and accepts it; the singles is then full.
  await signIn(`/offers/${id}`, author);
  await expect(
    page.getByRole("heading", { name: "Requests (1)" }),
  ).toBeVisible();
  const request = page.getByRole("listitem").filter({ hasText: playerName });
  await expect(request).toContainText("NTRP 4.0");
  await request.getByRole("button", { name: "Accept" }).click();

  await expect(
    page.getByRole("heading", { name: "Players in (1)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Requests (0)" }),
  ).toBeVisible();
  await expect(page.getByText("Full")).toBeVisible();

  // The player sees they're in.
  await signIn(`/offers/${id}`, player);
  await expect(page.getByText("You're in.")).toBeVisible();
});

test("an unknown offer is a 404", async ({ page }) => {
  const response = await page.goto(`/offers/${randomUUID()}`);

  expect(response?.status()).toBe(404);
});

test("the author cancels a full offer; it leaves the feed and the player sees it cancelled", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const authorName = `E2E Cancel ${randomUUID().slice(0, 8)}`;
  const author = await signIn();
  await completeTestProfile(admin, author.id, { name: authorName });
  const player = await signIn();
  await completeTestProfile(admin, player.id, { name: "Player" });

  // A singles that the player is already in.
  const id = await createOffer(author.id);
  const { error } = await admin
    .from("offer_joins")
    .insert({ offer_id: id, user_id: player.id, status: "ACCEPTED" });
  if (error) throw error;
  const { error: fullError } = await admin
    .from("sparring_offers")
    .update({ status: "FULL" })
    .eq("id", id);
  if (fullError) throw fullError;

  await signIn(`/offers/${id}`, author);
  await page.getByRole("button", { name: "Cancel offer" }).click();
  // The first click only asks to confirm.
  await page.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel offer" })).toHaveCount(
    0,
  );

  await page.goto("/offers");
  await expect(
    page.getByRole("listitem").filter({ hasText: `by ${authorName}` }),
  ).toHaveCount(0);

  await signIn(`/offers/${id}`, player);
  await expect(
    page.getByText("The author has cancelled this game."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Withdraw" })).toHaveCount(0);
});
