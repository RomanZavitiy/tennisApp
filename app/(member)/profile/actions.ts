"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { AVATAR_BUCKET, avatarPathSchema } from "@/lib/profile/avatar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  profileFieldErrors,
  profileSchema,
  profileToUserData,
  type SaveProfileResult,
} from "@/lib/validation/profile";

export type SaveAvatarResult = { ok: true } | { ok: false; message: string };

// Called after the browser has uploaded a photo to Storage (task 1.14b):
// records its path on the user and deletes the previous photo, so replaced
// photos don't pile up in the bucket. Storage calls run with the user's own
// session, so the bucket policies from task 1.13 apply here too.
export async function saveAvatar(path: unknown): Promise<SaveAvatarResult> {
  const user = await requireUser();

  const parsed = avatarPathSchema(user.id).safeParse(path);
  if (!parsed.success) {
    return { ok: false, message: "Invalid photo." };
  }

  const storage = (await createSupabaseServerClient()).storage.from(
    AVATAR_BUCKET,
  );
  const { data: exists } = await storage.exists(parsed.data);
  if (!exists) {
    return { ok: false, message: "The photo didn't upload. Try again." };
  }

  const previous = await db.user.findUnique({
    where: { id: user.id },
    select: { avatarPath: true },
  });
  await db.user.update({
    where: { id: user.id },
    data: { avatarPath: parsed.data },
  });

  // Only after the new path is saved: if this fails, a stray old file is
  // left behind, never a profile pointing at a deleted photo.
  if (previous?.avatarPath && previous.avatarPath !== parsed.data) {
    await storage.remove([previous.avatarPath]);
  }

  revalidatePath("/profile");
  return { ok: true };
}

// Saves /profile/edit. Same schema and checks as onboarding; it only leaves
// onboardingCompletedAt alone and returns to the profile page.
export async function updateProfile(
  input: unknown,
): Promise<SaveProfileResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return profileFieldErrors(parsed.error);
  }

  await db.user.update({
    where: { id: user.id },
    data: profileToUserData(parsed.data),
  });

  revalidatePath("/profile");
  redirect("/profile");
}
