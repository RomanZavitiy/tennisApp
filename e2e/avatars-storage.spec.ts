import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  createAdminClient,
  deleteTestUser,
  TEST_EMAIL_DOMAIN,
  TEST_EMAIL_PREFIX,
} from "./support/supabase-admin";

// The avatars bucket's policies (task 1.13), checked against real Supabase
// Storage the way a browser would talk to it: with the publishable key and a
// user's session. No page is needed — these are the rules the upload
// component (1.14) will run into.

const admin = createAdminClient();
const created: string[] = [];

// A 1×1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// A Supabase client signed in as a fresh test user, via the same magic-link
// token the e2e sign-in fixture uses.
async function signedInClient(): Promise<{
  id: string;
  client: SupabaseClient;
}> {
  const email = `${TEST_EMAIL_PREFIX}${randomUUID()}${TEST_EMAIL_DOMAIN}`;
  const { data: userData, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  created.push(userData.user.id);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;

  const client = publicClient();
  const { error: otpError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError) throw otpError;

  return { id: userData.user.id, client };
}

async function filesIn(folder: string) {
  const { data } = await admin.storage.from("avatars").list(folder);
  return (data ?? []).map((file) => file.name);
}

test.afterAll(async () => {
  for (const id of created) {
    await deleteTestUser(admin, id);
  }
});

test("a player uploads to their own folder and anyone can view it", async ({
  request,
}) => {
  const { id, client } = await signedInClient();

  const { error } = await client.storage
    .from("avatars")
    .upload(`${id}/avatar.png`, PNG, { contentType: "image/png" });
  expect(error).toBeNull();

  const url = client.storage.from("avatars").getPublicUrl(`${id}/avatar.png`)
    .data.publicUrl;
  const response = await request.get(url);
  expect(response.status()).toBe(200);

  // Replacing and deleting their own photo works too (needed by 1.14).
  const replaced = await client.storage
    .from("avatars")
    .upload(`${id}/avatar.png`, PNG, {
      contentType: "image/png",
      upsert: true,
    });
  expect(replaced.error).toBeNull();
  await client.storage.from("avatars").remove([`${id}/avatar.png`]);
  expect(await filesIn(id)).toEqual([]);
});

test("a player can't write, replace or delete in someone else's folder", async () => {
  const owner = await signedInClient();
  const intruder = await signedInClient();
  await owner.client.storage
    .from("avatars")
    .upload(`${owner.id}/avatar.png`, PNG, { contentType: "image/png" });

  const upload = await intruder.client.storage
    .from("avatars")
    .upload(`${owner.id}/other.png`, PNG, { contentType: "image/png" });
  expect(upload.error).not.toBeNull();

  const replace = await intruder.client.storage
    .from("avatars")
    .upload(`${owner.id}/avatar.png`, PNG, {
      contentType: "image/png",
      upsert: true,
    });
  expect(replace.error).not.toBeNull();

  await intruder.client.storage
    .from("avatars")
    .remove([`${owner.id}/avatar.png`]);

  expect(await filesIn(owner.id)).toEqual(["avatar.png"]);
});

test("a signed-out visitor can't upload", async () => {
  const { error } = await publicClient()
    .storage.from("avatars")
    .upload(`${randomUUID()}/avatar.png`, PNG, { contentType: "image/png" });

  expect(error).not.toBeNull();
});

test("the bucket refuses files that aren't JPEG, PNG or WebP", async () => {
  const { id, client } = await signedInClient();

  for (const [name, contentType] of [
    ["photo.heic", "image/heic"],
    ["notes.txt", "text/plain"],
    ["image.svg", "image/svg+xml"],
  ]) {
    const { error } = await client.storage
      .from("avatars")
      .upload(`${id}/${name}`, PNG, { contentType });
    expect(error, contentType).not.toBeNull();
  }
  expect(await filesIn(id)).toEqual([]);
});

test("the bucket refuses files over 5 MB", async () => {
  const { id, client } = await signedInClient();
  const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1);

  const { error } = await client.storage
    .from("avatars")
    .upload(`${id}/big.png`, tooBig, { contentType: "image/png" });

  expect(error).not.toBeNull();
  expect(await filesIn(id)).toEqual([]);
});
