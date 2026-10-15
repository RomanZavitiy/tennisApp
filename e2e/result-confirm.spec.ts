import { randomUUID } from "node:crypto";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// E2E flow #4 (AGENTS.md §7): a player files a singles result, the author
// confirms it, and both sides' ELO changes (tasks 4.6-4.8). The offer and
// its join are inserted directly, already started and accepted — the same
// shortcut offer-page.spec.ts's cancel test uses — since flow #3 already
// covers the request → accept path end to end.

async function createStartedOffer(authorId: string) {
  const { data, error } = await createAdminClient()
    .from("sparring_offers")
    .insert({
      author_id: authorId,
      status: "FULL",
      starts_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      district: "PODGORZE",
    })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return data.id;
}

test("a player submits a result, the author confirms it, and ELO changes for both", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const authorName = `E2E Author ${randomUUID().slice(0, 8)}`;
  const playerName = `E2E Player ${randomUUID().slice(0, 8)}`;

  const author = await signIn();
  await completeTestProfile(admin, author.id, {
    name: authorName,
    self_rated_ntrp: 3.5,
  });
  const player = await signIn();
  await completeTestProfile(admin, player.id, {
    name: playerName,
    self_rated_ntrp: 4,
  });

  const offerId = await createStartedOffer(author.id);
  const { data: join, error: joinError } = await admin
    .from("offer_joins")
    .insert({ offer_id: offerId, user_id: player.id, status: "ACCEPTED" })
    .select("id")
    .single<{ id: string }>();
  if (joinError) throw joinError;

  // The player files the result: they won 6-4, 6-3.
  await signIn(`/offers/${offerId}`, player);
  await page.locator("summary").getByText("Submit result").click();
  await page.getByLabel(`${authorName}'s games, set 1`).fill("4");
  await page.getByLabel(`You's games, set 1`).fill("6");
  await page.getByLabel(`${authorName}'s games, set 2`).fill("3");
  await page.getByLabel(`You's games, set 2`).fill("6");
  await page.getByRole("radio", { name: "You", exact: true }).check();
  await page.getByRole("button", { name: "Submit result" }).click();
  await expect(
    page.getByText(`Result submitted (6-4, 6-3). Waiting for ${authorName}`),
  ).toBeVisible();

  // The author sees the reported score and confirms it.
  await signIn(`/offers/${offerId}`, author);
  await expect(
    page.getByText(`${playerName} reported: 4-6, 3-6.`),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Confirmed: 4-6, 3-6.")).toBeVisible();
  await expect(page.getByText(/Your ELO: 1400 → \d+/)).toBeVisible();

  // The player, back on the page, sees it confirmed from their own side too.
  await signIn(`/offers/${offerId}`, player);
  await expect(page.getByText("Confirmed: 6-4, 6-3.")).toBeVisible();
  await expect(page.getByText(/Your ELO: 1500 → \d+/)).toBeVisible();

  // Both players' public pages show the new ELO and this match.
  await page.goto(`/players/${author.id}`);
  await expect(page.getByRole("heading", { name: authorName })).toBeVisible();
  await expect(page.getByText(`Lost vs ${playerName}`)).toBeVisible();
  await page.goto(`/players/${player.id}`);
  await expect(page.getByText(`Won vs ${authorName}`)).toBeVisible();

  // A confirmed result keeps its join alive (Restrict, decisions.md
  // 2026-09-28) — deleted here so the signIn fixture's teardown can still
  // delete the test users afterwards without hitting that FK itself.
  await admin.from("match_results").delete().eq("offer_join_id", join.id);
});
