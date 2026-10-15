import { db } from "@/lib/db";

// Our `users` row shares its id with auth.users but has no foreign key to it
// (see the schema decision for task 0.12), so code keeps the two in step: the
// sign-in callback calls this after every successful sign-in. An upsert with
// an empty update makes repeat sign-ins a no-op instead of a duplicate, and
// never overwrites profile fields filled in later.
//
// email is the one exception (task 5.1-5.6, email fallback): it's always
// synced, on both branches, rather than left alone like a profile field —
// it mirrors auth.users, which the app otherwise never reads directly (the
// secret key that could is reserved for the e2e helper, decision 1.2), and
// it's how a row created before this column existed gets it filled in.
export async function ensureUserRow(id: string, email: string) {
  await db.user.upsert({
    where: { id },
    create: { id, email },
    update: { email },
  });
}
