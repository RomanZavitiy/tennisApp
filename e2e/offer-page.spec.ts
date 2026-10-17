import { randomUUID } from "node:crypto";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
  createTestClub,
} from "./support/supabase-admin";

// /offers/[id] (task 3.13): what a guest, a player and the author each see,
// and the request → accept flow end to end. Offers go away with their test
// author.

async function createOffer(authorId: string, clubId?: string) {
  const { data, error } = await createAdminClient()
    .from("sparring_offers")
    .insert({
      author_id: authorId,
      starts_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      district: clubId ? null : "PODGORZE",
      club_id: clubId ?? null,
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

  // The player hears about it from the header bell, even without push
  // (slice K2b), and the list links to the offer.
  await signIn("/", player);
  await page.getByRole("link", { name: "Notifications, 1 unread" }).click();
  await expect(page).toHaveURL("/notifications");
  await expect(
    page.getByRole("link", { name: /^Request accepted/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Request accepted/ }).click();
  await expect(page).toHaveURL(`/offers/${id}`);

  // The player sees they're in, and their thread's welcome note (task 3.17),
  // and sends a message (E2E flow #3, part 2: tasks 3.16-3.18).
  await expect(page.getByText("You're in.")).toBeVisible();
  await expect(
    page.getByText("Meet at the court. Never send money in advance."),
  ).toBeVisible();
  await page.getByPlaceholder("Write a message…").fill("On my way!");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("You: On my way!")).toBeVisible();

  // The author finds the message in their notifications, opens the thread,
  // sees it, and replies.
  await signIn("/notifications", author);
  await expect(page.getByRole("link", { name: /^New message/ })).toBeVisible();
  await page.goto(`/offers/${id}`);
  await page.getByText("Messages", { exact: true }).click();
  await expect(page.getByText(`${playerName}: On my way!`)).toBeVisible();
  await page.getByPlaceholder("Write a message…").fill("See you soon!");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("You: See you soon!")).toBeVisible();

  // A message is never rendered as HTML (task 3.16's DoD).
  await page.getByPlaceholder("Write a message…").fill("<script>bad</script>");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("You: <script>bad</script>")).toBeVisible();
  await expect(page.locator("script", { hasText: "bad" })).toHaveCount(0);

  // A third person, with no request of their own, sees no thread at all.
  await signIn(`/offers/${id}`);
  await page.reload();
  await expect(page.getByText("Messages", { exact: true })).toHaveCount(0);
});

test("everyone sees the court status and a booking link when a club is set", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  await completeTestProfile(admin, author.id, { name: "Court Status Host" });
  const clubId = await createTestClub(admin, {
    name: `E2E Offer Club ${randomUUID().slice(0, 8)}`,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
  const { error } = await admin
    .from("clubs")
    .update({ booking_url: "https://example.com/book" })
    .eq("id", clubId);
  if (error) throw error;
  const id = await createOffer(author.id, clubId);
  await page.context().clearCookies();

  await page.goto(`/offers/${id}`);

  await expect(page.getByText("Will book once we agree")).toBeVisible();
  const link = page.getByRole("link", { name: "Book on club's site" });
  await expect(link).toHaveAttribute(
    "href",
    "https://example.com/book?utm_source=matchfinder",
  );
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");

  await admin.from("clubs").delete().eq("id", clubId);
});

test("a club with no booking link offers a call instead", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  await completeTestProfile(admin, author.id, { name: "No Booking Link" });
  const clubId = await createTestClub(admin, {
    name: `E2E Phone Club ${randomUUID().slice(0, 8)}`,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
  const { error } = await admin
    .from("clubs")
    .update({ phone: "+48 12 000 00 00" })
    .eq("id", clubId);
  if (error) throw error;
  const id = await createOffer(author.id, clubId);
  await page.context().clearCookies();

  await page.goto(`/offers/${id}`);

  await expect(
    page.getByRole("link", { name: "Book on club's site" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Call to book" }),
  ).toHaveAttribute("href", "tel:+48120000000");

  await admin.from("clubs").delete().eq("id", clubId);
});

test("the author marks the court booked after clicking through, and players are told", async ({
  page,
  signIn,
}) => {
  const admin = createAdminClient();
  const author = await signIn();
  await completeTestProfile(admin, author.id, { name: "Booking Author" });
  const player = await signIn();
  await completeTestProfile(admin, player.id, { name: "Booking Player" });
  const clubId = await createTestClub(admin, {
    name: `E2E Booked Club ${randomUUID().slice(0, 8)}`,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
  const { error } = await admin
    .from("clubs")
    .update({ booking_url: "https://example.com/book" })
    .eq("id", clubId);
  if (error) throw error;
  const id = await createOffer(author.id, clubId);
  const { error: joinError } = await admin
    .from("offer_joins")
    .insert({ offer_id: id, user_id: player.id, status: "ACCEPTED" });
  if (joinError) throw joinError;

  // A guest and the player never see the banner, even after the link exists.
  await page.context().clearCookies();
  await page.goto(`/offers/${id}`);
  await expect(page.getByText("Booked the court?")).toHaveCount(0);
  await signIn(`/offers/${id}`, player);
  await expect(page.getByText("Booked the court?")).toHaveCount(0);

  // The author clicks through to book (opens a new tab; this one stays put)
  // and the banner appears right away.
  await signIn(`/offers/${id}`, author);
  const popup = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Book on club's site" }).click();
  await (await popup).close();
  await expect(page.getByText("Booked the court?")).toBeVisible();
  await page.getByRole("button", { name: "Mark it as booked" }).click();
  await expect(page.getByText("Booked the court?")).toHaveCount(0);
  await expect(page.getByText("Court booked")).toBeVisible();

  // The player's thread got the system note.
  await signIn(`/offers/${id}`, player);
  await expect(page.getByText("The court has been booked.")).toBeVisible();

  await admin.from("clubs").delete().eq("id", clubId);
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
