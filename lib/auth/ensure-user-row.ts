import { db } from "@/lib/db";

// Our `users` row shares its id with auth.users but has no foreign key to it
// (see the schema decision for task 0.12), so code keeps the two in step: the
// sign-in callback calls this after every successful sign-in. An upsert with
// an empty update makes repeat sign-ins a no-op instead of a duplicate, and
// never overwrites profile fields filled in later.
export async function ensureUserRow(id: string) {
  await db.user.upsert({ where: { id }, create: { id }, update: {} });
}
