import { expect, test } from "./support/fixtures";
import {
  completeTestProfile,
  createAdminClient,
} from "./support/supabase-admin";

// Profile photo on /profile: preview before saving, errors for files the
// bucket would refuse, and a new photo replacing the old one in Storage.

const admin = createAdminClient();

// A 1×1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function storedPhotos(userId: string) {
  const { data } = await admin.storage.from("avatars").list(userId);
  return (data ?? []).map((file) => `${userId}/${file.name}`);
}

async function savedPath(userId: string): Promise<string | null> {
  const { data } = await admin
    .from("users")
    .select("avatar_path")
    .eq("id", userId)
    .single();
  // The admin client has no generated types, so the row is untyped.
  const path: unknown = data?.avatar_path;
  return typeof path === "string" ? path : null;
}

test("a new photo is previewed, saved, and replaces the old one", async ({
  page,
  signIn,
}) => {
  const user = await signIn();
  await completeTestProfile(admin, user.id);
  await page.goto("/profile");
  const photoInput = page.getByLabel("Change photo");

  // First photo: preview first, nothing stored until Save.
  await photoInput.setInputFiles({
    name: "first.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByAltText("New photo preview")).toBeVisible();
  expect(await storedPhotos(user.id)).toEqual([]);

  await page.getByRole("button", { name: "Save photo" }).click();
  await expect(page.getByAltText("Ola's photo")).toBeVisible();
  const first = await savedPath(user.id);
  expect(await storedPhotos(user.id)).toEqual([first]);

  // Second photo: the profile points at it and the first file is gone.
  await photoInput.setInputFiles({
    name: "second.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Save photo" }).click();
  // The page refreshes only after saveAvatar has finished, old-file delete
  // included; the database alone changes before that.
  await expect(page.getByAltText("Ola's photo")).not.toHaveAttribute(
    "src",
    new RegExp(`${String(first)}$`),
  );
  const second = await savedPath(user.id);
  expect(second).not.toBe(first);
  expect(await storedPhotos(user.id)).toEqual([second]);
  await expect(page.getByAltText("Ola's photo")).toHaveAttribute(
    "src",
    new RegExp(`${String(second)}$`),
  );
});

test("Cancel drops the preview without uploading", async ({ page, signIn }) => {
  const user = await signIn();
  await completeTestProfile(admin, user.id);
  await page.goto("/profile");

  await page.getByLabel("Change photo").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByAltText("New photo preview")).toHaveCount(0);
  expect(await storedPhotos(user.id)).toEqual([]);
});

for (const { file, message } of [
  {
    file: { name: "photo.heic", mimeType: "image/heic", buffer: PNG },
    message: "Choose a JPEG, PNG or WebP image.",
  },
  {
    file: { name: "notes.txt", mimeType: "text/plain", buffer: PNG },
    message: "Choose a JPEG, PNG or WebP image.",
  },
  {
    file: {
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    },
    message: "The photo is over 5 MB. Choose a smaller one.",
  },
]) {
  test(`${file.name} is refused in the browser`, async ({ page, signIn }) => {
    const user = await signIn();
    await completeTestProfile(admin, user.id);
    await page.goto("/profile");

    await page.getByLabel("Change photo").setInputFiles(file);

    await expect(page.getByRole("main").getByRole("alert")).toHaveText(message);
    await expect(page.getByAltText("New photo preview")).toHaveCount(0);
    expect(await storedPhotos(user.id)).toEqual([]);
  });
}
