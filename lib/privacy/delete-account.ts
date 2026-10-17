import { db } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const AVATAR_BUCKET = "avatars";

// Self-service "Delete my account" (task 6.15) — the code translation of the
// manual Supabase steps in docs/ACCOUNT-DELETION.md, split in two so the
// caller can run the DB half first: cancelling the user's own data is more
// recoverable than deleting their auth user while data is still live, so
// order matters (see decision 2026-10-16).
//
// The User row itself is never deleted, only nulled — a confirmed match
// result on any of the user's joins has `onDelete: Restrict` (decision
// 2026-09-28), so a hard delete would be blocked anyway, and silently losing
// an opponent's ELO history is exactly what that Restrict exists to prevent.
export async function redactAccountData(userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.sparringOffer.updateMany({
      where: { authorId: userId, status: { in: ["OPEN", "FULL"] } },
      data: { status: "CANCELLED" },
    });
    await tx.offerJoin.updateMany({
      where: {
        userId,
        status: { in: ["REQUESTED", "ACCEPTED"] },
        result: null,
      },
      data: { status: "WITHDRAWN" },
    });
    await tx.message.updateMany({
      where: { senderId: userId },
      data: { content: "[deleted]" },
    });
    // The bell's list (slice K2a) is only ever the user's own — nothing to
    // keep for anyone else, and the nulled User row means no cascade.
    await tx.notification.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: { name: null, email: null, birthDate: null, avatarPath: null },
    });
  });
}

// Storage cleanup is best-effort: a leftover avatar file is a rare, low-harm
// leftover, while failing to delete the auth user would leave the player
// able to sign back in after "deleting" their account — so a Storage error
// is logged, never thrown.
export async function deleteAccountStorageAndAuth(
  userId: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();

  try {
    const { data: files } = await admin.storage
      .from(AVATAR_BUCKET)
      .list(userId);
    if (files?.length) {
      await admin.storage
        .from(AVATAR_BUCKET)
        .remove(files.map((file) => `${userId}/${file.name}`));
    }
  } catch (error) {
    console.error(`Couldn't delete avatar files for ${userId}:`, error);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}
