import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createAdminClient,
  createPublicClient,
  createSignedInClient,
  deleteTestUser,
} from "./support/supabase-admin";

// Row Level Security is deny-by-default on every table in `public` (task 1.17,
// decision for 1.2): the app reaches data only through Prisma on the server,
// so the publishable key — which ships in the browser bundle — must get
// nothing from the Data API, signed in or not.
//
// The table list comes from the Data API itself, so a table added later is
// checked without touching this file. Two `users` rows — the test user's own
// and someone else's — give it real data to fail on, so an empty answer means
// "denied", not "nothing there".

const admin = createAdminClient();
const OTHER_USER = randomUUID();

async function exposedTables(): Promise<string[]> {
  const key = process.env.SUPABASE_SECRET_KEY ?? "";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/rest/v1/`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const spec = (await response.json()) as { paths: Record<string, unknown> };
  return Object.keys(spec.paths)
    .filter((path) => path !== "/")
    .map((path) => path.slice(1));
}

let tables: string[] = [];
let signedIn: { id: string; client: SupabaseClient };

test.beforeAll(async () => {
  tables = await exposedTables();
  signedIn = await createSignedInClient(admin);
  // Their own users row, as a real sign-in would create (task 1.9), and
  // another player's.
  const { error } = await admin
    .from("users")
    .insert([{ id: signedIn.id }, { id: OTHER_USER }]);
  if (error) throw error;
});

test.afterAll(async () => {
  await deleteTestUser(admin, signedIn.id);
  await admin.from("users").delete().eq("id", OTHER_USER);
});

test("the Data API exposes the tables this test expects", () => {
  // A sanity check that the list isn't empty or truncated.
  expect(tables).toEqual(
    expect.arrayContaining([
      "users",
      "clubs",
      "sparring_offers",
      "offer_joins",
      "match_results",
      "_prisma_migrations",
    ]),
  );
});

for (const role of ["anon", "authenticated"] as const) {
  test.describe(role, () => {
    const client = () =>
      role === "anon" ? createPublicClient() : signedIn.client;

    test("reads nothing from any table", async () => {
      for (const table of tables) {
        const { data, error } = await client().from(table).select("*");
        // Either an empty list or a refusal — never rows.
        expect(error ? [] : data, table).toEqual([]);
      }
    });

    test("can't insert into any table", async () => {
      for (const table of tables) {
        const { error } = await client().from(table).insert({});
        // 42501: insufficient privilege / RLS violation.
        expect(error?.code, table).toBe("42501");
      }
    });

    test("can't change or delete user rows, not even their own", async () => {
      const ids = [OTHER_USER, signedIn.id];
      const before = await admin.from("users").select("*").in("id", ids);

      await client().from("users").update({ name: "Hacked" }).in("id", ids);
      await client().from("users").delete().in("id", ids);

      const after = await admin.from("users").select("*").in("id", ids);
      expect(after.data).toEqual(before.data);
      expect(after.data).toHaveLength(2);
    });
  });
}
