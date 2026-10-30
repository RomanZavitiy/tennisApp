"use server";

import { getTranslations } from "next-intl/server";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import {
  clubSubmissionFieldErrors,
  clubSubmissionSchema,
  type SubmitClubResult,
} from "@/lib/validation/club-submission";

// Saves /clubs/suggest (task M.4): a player's tip about a club not on the
// platform yet. This only writes a PENDING row — no admin UI yet (M2), and
// no Club row either: approving a submission still goes through the
// owner's own prisma/load-clubs.ts pipeline (see the ClubSubmission model
// comment).
export async function submitClub(input: unknown): Promise<SubmitClubResult> {
  const submitter = await requireOnboardedUser();
  const t = await getTranslations("Validation.clubSubmission");
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, submitter);
  if (blocked) {
    return { ok: false, fieldErrors: {}, message: blocked };
  }

  const parsed = clubSubmissionSchema(t).safeParse(input);
  if (!parsed.success) {
    return clubSubmissionFieldErrors(parsed.error);
  }

  const limited = await checkRateLimit(submitter.id, "CLUB_SUBMISSION");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return {
      ok: false,
      fieldErrors: {},
      message: tRateLimit("CLUB_SUBMISSION"),
    };
  }

  await db.clubSubmission.create({
    data: { ...parsed.data, submittedById: submitter.id },
    select: { id: true },
  });

  return { ok: true };
}
