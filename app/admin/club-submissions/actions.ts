"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";

// The club-submission queue's two decisions (task M.9). Both are a
// PENDING-only guard via updateMany's count, the same idiom every other
// admin action in app/admin/actions.ts uses to refuse a double decision.
// Neither writes an AdminAction row: unlike a report or a disputed result,
// a submission already carries its own "who, when, what" in reviewedById/
// reviewedAt/status, and admin_actions has no column to point at one.
// Neither creates a `Club` row either — see the ClubSubmission model
// comment, M.1's decision stands.

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const SUBMISSION_NOT_FOUND = "This club submission doesn't exist.";
const ALREADY_DECIDED = "This submission was already decided.";

export async function approveSubmission(
  submissionId: unknown,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(submissionId);
  if (!id.success) {
    return { ok: false, message: SUBMISSION_NOT_FOUND };
  }

  const { count } = await db.clubSubmission.updateMany({
    where: { id: id.data, status: "PENDING" },
    data: {
      status: "APPROVED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  if (count === 0) {
    return { ok: false, message: ALREADY_DECIDED };
  }
  revalidatePath("/admin/club-submissions");
  return { ok: true };
}

export async function rejectSubmission(
  submissionId: unknown,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const id = z.uuid().safeParse(submissionId);
  if (!id.success) {
    return { ok: false, message: SUBMISSION_NOT_FOUND };
  }

  const { count } = await db.clubSubmission.updateMany({
    where: { id: id.data, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
  if (count === 0) {
    return { ok: false, message: ALREADY_DECIDED };
  }
  revalidatePath("/admin/club-submissions");
  return { ok: true };
}
