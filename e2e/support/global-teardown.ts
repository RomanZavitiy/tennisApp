import {
  createAdminClient,
  deleteTestClub,
  deleteTestUser,
  TEST_CLUB_SLUG_PREFIX,
  TEST_EMAIL_DOMAIN,
  TEST_EMAIL_PREFIX,
} from "./supabase-admin";

// Safety net for test users a killed run never deleted. Preview and
// production share one Supabase project for now, so leftovers would sit among
// real users. Only users older than an hour are removed: a run happening at
// the same moment (CI and a laptop) must not lose its users mid-test.
const STALE_AFTER_MS = 60 * 60 * 1000;

export default async function globalTeardown() {
  // Importing supabase-admin has already loaded .env.local. Without a key no
  // test could have created users, so there's nothing to clean up.
  if (!process.env.SUPABASE_SECRET_KEY) {
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  const cutoff = Date.now() - STALE_AFTER_MS;
  const stale = data.users.filter(
    (user) =>
      user.email?.startsWith(TEST_EMAIL_PREFIX) &&
      user.email.endsWith(TEST_EMAIL_DOMAIN) &&
      Date.parse(user.created_at) < cutoff,
  );

  // One leftover that can't be deleted mustn't keep the rest — or the clubs
  // below — around, so failures are logged and the cleanup goes on.
  for (const user of stale) {
    try {
      await deleteTestUser(admin, user.id);
    } catch (cause) {
      console.warn(`Teardown: couldn't delete test user ${user.id}:`, cause);
    }
  }

  // Test clubs would show on the real map, so leftovers go the same way,
  // together with any offers still pointing at them.
  const { data: clubs, error: clubsError } = await admin
    .from("clubs")
    .select("id")
    .like("slug", `${TEST_CLUB_SLUG_PREFIX}%`)
    .lt("created_at", new Date(cutoff).toISOString())
    .overrideTypes<{ id: string }[], { merge: false }>();
  if (clubsError) throw clubsError;

  for (const club of clubs) {
    try {
      await deleteTestClub(admin, club.id);
    } catch (cause) {
      console.warn(`Teardown: couldn't delete test club ${club.id}:`, cause);
    }
  }
}
