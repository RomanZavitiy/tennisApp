import { z } from "zod";

// Profile photo rules, shared by the upload component (task 1.14b) and the
// server action that saves the path. They mirror the avatars bucket from
// task 1.13 (5 MB; JPEG, PNG, WebP), so the user sees the error before
// Storage refuses the file.

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AvatarType = keyof typeof AVATAR_TYPES;

export function isAvatarType(type: string): type is AvatarType {
  return type in AVATAR_TYPES;
}

// Every upload gets a new random file name rather than overwriting
// "avatar.jpg": browsers and the CDN cache public URLs, so a reused name
// could keep showing the old photo. The old file is deleted instead.
export function newAvatarPath(userId: string, type: AvatarType) {
  return `${userId}/${crypto.randomUUID()}.${AVATAR_TYPES[type]}`;
}

/**
 * A path the given user may save: "{userId}/{name}.{jpg|png|webp}", one level
 * deep, no "..". Storage policies already stop uploads into someone else's
 * folder; this stops a user from pointing their profile at someone else's
 * file.
 */
export function avatarPathSchema(userId: string) {
  return z
    .string()
    .max(200)
    .refine(
      (path) =>
        path.startsWith(`${userId}/`) &&
        /^[A-Za-z0-9-]+\.(jpg|png|webp)$/.test(path.slice(userId.length + 1)),
      "Invalid photo.",
    );
}

/** Public URL of a stored photo — the bucket is public, no token needed. */
export function avatarUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
