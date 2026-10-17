import { randomUUID } from "node:crypto";

import { toKrakowLocal } from "../lib/offers/krakow-time";

import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
  createTestClub,
} from "./support/supabase-admin";

// /offers/new posts a sparring offer (task 3.5); the saved row and the feed
// (3.6) are the proof.
const clubName = `E2E Offer Club ${randomUUID().slice(0, 8)}`;
let admin: ReturnType<typeof createAdminClient>;
let clubId: string;

test.beforeAll(async () => {
  admin = createAdminClient();
  clubId = await createTestClub(admin, {
    name: clubName,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
});

// The test users — and with them their offers — are gone by now, so the
// club no longer has offers holding it.
test.afterAll(async () => {
  const { error } = await admin.from("clubs").delete().eq("id", clubId);
  if (error) throw error;
});

test("a player posts a doubles offer at a club", async ({ page, signIn }) => {
  const user = await signIn();
  const name = `E2E Offer ${randomUUID().slice(0, 8)}`;
  await completeTestProfile(admin, user.id, { name, district: "PODGORZE" });
  // Three days ahead, 18:00 Kraków time.
  const day = toKrakowLocal(new Date(Date.now() + 3 * 86_400_000)).slice(0, 10);
  const startsAt = `${day}T18:00`;

  await page.goto("/offers");
  await page.getByRole("link", { name: "Post an offer" }).click();
  await expect(page).toHaveURL("/offers/new");

  // Singles by default; the partner option belongs to doubles only. The
  // district starts as the player's own.
  await expect(page.getByLabel("Singles")).toBeChecked();
  await expect(page.getByLabel("I already have a partner")).toHaveCount(0);
  await expect(page.getByLabel("District")).toHaveValue("PODGORZE");

  await page.getByLabel("Doubles").check();
  await page.getByLabel("I already have a partner").check();
  await page.getByLabel("Start time").fill(startsAt);
  // 90 minutes unless changed (slice K5).
  await expect(page.getByLabel("How long")).toHaveValue("90");
  await page.getByLabel("How long").selectOption({ label: "2 h" });
  await page
    .getByLabel("Club", { exact: true })
    .selectOption({ label: clubName });
  // Choosing the club fills in its district.
  await expect(page.getByLabel("District")).toHaveValue("STARE_MIASTO");
  await page.getByLabel("Level from (NTRP)").selectOption("3.0");
  await page.getByLabel("Level to (NTRP)").selectOption("4.5");
  await page.getByLabel("Surface").selectOption("Clay");
  await page.getByLabel("Comment").fill("Evening doubles, balls on me.");
  await page.getByRole("button", { name: "Post offer" }).click();

  // ?created=1 flags "the first offer created" for the push-permission
  // prompt (task 5.15) — present on this redirect, not part of the id.
  await expect(page).toHaveURL(/\/offers\/[0-9a-f-]{36}(\?.*)?$/);
  const id = page.url().split("/").pop()?.split("?")[0];

  const { data, error } = await admin
    .from("sparring_offers")
    .select("*")
    .eq("id", id)
    .single<Record<string, unknown>>();
  if (error) throw error;
  expect(data).toMatchObject({
    author_id: user.id,
    status: "OPEN",
    format: "DOUBLES",
    has_partner: true,
    club_id: clubId,
    district: "STARE_MIASTO",
    ntrp_min: 3,
    ntrp_max: 4.5,
    surface: "CLAY",
    comment: "Evening doubles, balls on me.",
    duration_minutes: 120,
  });
  expect(toKrakowLocal(new Date(String(data.starts_at)))).toBe(startsAt);

  // View the feed as a guest, as other players see the new offer (the
  // author's own view adds a "Your offer" badge, slice K1).
  await page.context().clearCookies();
  await page.goto("/offers");
  const card = page.getByRole("listitem").filter({ hasText: `by ${name}` });
  await expect(card).toContainText("18:00–20:00");
  await expect(card).toContainText("Doubles · has a partner");
  await expect(card).toContainText("2 spots left");
  await expect(card).toContainText(clubName);
});

test("the club page's CTA pre-selects its club on the form (task 2.10)", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(admin, user.id, { district: "PODGORZE" });

  await page.goto(`/offers/new?clubId=${clubId}`);

  await expect(page.getByLabel("Club", { exact: true })).toHaveValue(clubId);
  // The preset club's own district, not the player's.
  await expect(page.getByLabel("District")).toHaveValue("STARE_MIASTO");
});

test("an incomplete offer stays on the form with messages", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(admin, user.id);

  await page.goto("/offers/new");
  await page.getByLabel("Start time").fill("2020-01-01T10:00");
  await page.getByLabel("District").selectOption("");
  await page.getByLabel("Level from (NTRP)").selectOption("5.0");
  await page.getByLabel("Level to (NTRP)").selectOption("3.0");
  await page.getByRole("button", { name: "Post offer" }).click();

  const alerts = page.getByRole("main").getByRole("alert");
  await expect(alerts).toHaveText([
    "That time has already passed.",
    "Choose a club or a district.",
    "The highest level can't be below the lowest.",
  ]);
  await expect(page).toHaveURL("/offers/new");
});

test("a signed-out visitor is sent to sign in", async ({ page }) => {
  await page.goto("/offers/new");

  await expect(page).toHaveURL(/\/login/);
});
