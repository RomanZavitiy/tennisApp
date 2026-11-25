import { randomUUID } from "node:crypto";

import { toKrakowLocal } from "../lib/offers/krakow-time";

import type { Page } from "@playwright/test";

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
// Slice PD5 (PD5.3): the same flow in padel, at a padel-only club.
const padelClubName = `E2E Padel Club ${randomUUID().slice(0, 8)}`;
let padelClubId: string;

test.beforeAll(async () => {
  admin = createAdminClient();
  clubId = await createTestClub(admin, {
    name: clubName,
    address: "Testowa 1, 30-001 Kraków",
    latitude: 50.07,
    longitude: 19.92,
  });
  padelClubId = await createTestClub(admin, {
    name: padelClubName,
    address: "Testowa 2, 30-001 Kraków",
    latitude: 50.071,
    longitude: 19.921,
    sports: ["PADEL"],
  });
});

// The test users — and with them their offers — are gone by now, so the
// club no longer has offers holding it.
// The start time picker (components/date-time-picker.tsx): a month
// calendar, then a time chip. It opens on this month, so a day in the next
// one needs one click forward first.
async function pickStart(page: Page, day: string, time: string) {
  const thisMonth = toKrakowLocal(new Date()).slice(0, 7);
  const startTime = page.getByRole("group", { name: "Start time" });
  if (day.slice(0, 7) !== thisMonth) {
    await startTime.getByRole("button", { name: "Next month" }).click();
  }
  const dayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
  await startTime.getByRole("button", { name: dayLabel }).click();
  await startTime.getByRole("button", { name: time }).click();
}

test.afterAll(async () => {
  const { error } = await admin
    .from("clubs")
    .delete()
    .in("id", [clubId, padelClubId]);
  if (error) throw error;
});

// The header's Tennis / Padel switch (slice PD1): sets the cookie, then the
// page re-renders in place.
async function switchSport(page: Page, sport: "Tennis" | "Padel") {
  const button = page
    .getByRole("group", { name: "Sport" })
    .first()
    .getByRole("button", { name: sport });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

test("a player posts a doubles offer at a club", async ({ page, signIn }) => {
  const user = await signIn();
  const name = `E2E Offer ${randomUUID().slice(0, 8)}`;
  await completeTestProfile(admin, user.id, { name, district: "PODGORZE" });
  // Three days ahead, 18:00 Kraków time.
  const day = toKrakowLocal(new Date(Date.now() + 3 * 86_400_000)).slice(0, 10);
  const startsAt = `${day}T18:00`;

  await page.goto("/offers");
  // The feed's header and an empty "my games" both offer it.
  await page.getByRole("link", { name: "Post an offer" }).first().click();
  await expect(page).toHaveURL("/offers/new");

  // Singles by default; the partner option belongs to doubles only. The
  // district starts as the player's own.
  await expect(page.getByLabel("Singles")).toBeChecked();
  await expect(page.getByLabel("I already have a partner")).toHaveCount(0);
  await expect(page.getByLabel("District")).toHaveValue("PODGORZE");

  await page.getByLabel("Doubles").check();
  await page.getByLabel("I already have a partner").check();
  await pickStart(page, day, "18:00");
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

test("a player switches to padel, posts a padel game and sees it in the padel feed", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  const name = `E2E Padel ${randomUUID().slice(0, 8)}`;
  await completeTestProfile(admin, user.id, { name, district: "PODGORZE" });
  const day = toKrakowLocal(new Date(Date.now() + 3 * 86_400_000)).slice(0, 10);

  await page.goto("/offers");
  await switchSport(page, "Padel");
  await page.getByRole("link", { name: "Post an offer" }).first().click();
  await expect(page).toHaveURL("/offers/new");
  await expect(
    page.getByRole("heading", { name: "New padel game" }),
  ).toBeVisible();

  // Padel is always four players: no singles/doubles choice, no surface,
  // and only padel clubs to pick from.
  await expect(page.getByLabel("Singles")).toBeHidden();
  await expect(page.getByLabel("Surface")).toHaveCount(0);
  const club = page.getByLabel("Club", { exact: true });
  await expect(club.locator("option", { hasText: clubName })).toHaveCount(0);

  await pickStart(page, day, "19:00");
  await club.selectOption({ label: padelClubName });
  await page.getByLabel("Level from (1–7)").selectOption("3.0");
  await page.getByLabel("Level to (1–7)").selectOption("4.5");
  await page.getByRole("button", { name: "Post offer" }).click();

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
    sport: "PADEL",
    format: "DOUBLES",
    club_id: padelClubId,
    ntrp_min: 3,
    ntrp_max: 4.5,
    surface: null,
  });

  // As a guest: the padel feed lists it, the tennis feed doesn't.
  await page.context().clearCookies();
  await page.goto("/offers");
  const card = page.getByRole("listitem").filter({ hasText: `by ${name}` });
  await expect(card).toHaveCount(0);
  await switchSport(page, "Padel");
  await expect(card).toContainText(padelClubName);
  await expect(card).toContainText("Padel");
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
  // No day or time picked (the picker can't choose a past one at all).
  await page.getByRole("button", { name: "Post offer" }).click();
  const alerts = page.getByRole("main").getByRole("alert");
  await expect(alerts).toHaveText(["Choose the start time."]);

  const tomorrow = toKrakowLocal(new Date(Date.now() + 86_400_000)).slice(
    0,
    10,
  );
  await pickStart(page, tomorrow, "18:00");
  await page.getByLabel("District").selectOption("");
  await page.getByLabel("Level from (NTRP)").selectOption("5.0");
  await page.getByLabel("Level to (NTRP)").selectOption("3.0");
  await page.getByRole("button", { name: "Post offer" }).click();

  await expect(alerts).toHaveText([
    "Choose a club or a district.",
    "The highest level can't be below the lowest.",
  ]);
  await expect(page).toHaveURL("/offers/new");
});

test("a signed-out visitor is sent to sign in", async ({ page }) => {
  await page.goto("/offers/new");

  await expect(page).toHaveURL(/\/login/);
});
