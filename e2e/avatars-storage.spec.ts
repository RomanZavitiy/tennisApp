import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  createAdminClient,
  createPublicClient,
  createSignedInClient,
  deleteTestUser,
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

// A client signed in as a fresh test user, deleted after the file's tests.
async function signedInClient() {
  const signedIn = await createSignedInClient(admin);
  created.push(signedIn.id);
  return signedIn;
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
  const { error } = await createPublicClient()
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
