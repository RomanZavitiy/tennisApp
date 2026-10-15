import { db } from "@/lib/db";
import { maybeAutoblock } from "@/lib/moderation/autoblock";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import type { ReportInput } from "@/lib/validation/report";

// The one place a Report row is written (task 3.19) — the three thin server
// actions (reportOffer, reportPlayer, reportMessage) each resolve their own
// target and context, then call this. targetUserId always comes from a
// server-side lookup (the offer's author, the message's sender, or the
// profile page's own id) — never from the client — so the self-report
// check below also catches "report your own offer" and "report your own
// message" for free.

export type CreateReportResult = { ok: true } | { ok: false; message: string };

type ErrorsT = (key: string) => string;

export async function createReport({
  t,
  tRateLimit,
  reporterId,
  targetUserId,
  offerId,
  messageId,
  input,
}: {
  /** A translator for the "Errors" namespace (task 1.20). */
  t: ErrorsT;
  /** A translator for the "RateLimit" namespace. */
  tRateLimit: ErrorsT;
  reporterId: string;
  targetUserId: string;
  offerId?: string;
  messageId?: string;
  input: ReportInput;
}): Promise<CreateReportResult> {
  if (targetUserId === reporterId) {
    return { ok: false, message: t("cantReportYourself") };
  }

  const limited = await checkRateLimit(reporterId, "REPORT");
  if (!limited.ok) {
    return { ok: false, message: tRateLimit("REPORT") };
  }

  // One report per reporter per object (3.19): an unqualified ON CONFLICT
  // DO NOTHING (skipDuplicates) catches a conflict on whichever of the
  // three partial unique indexes applies (lib/db schema, task 3.19).
  const created = (
    await db.report.createManyAndReturn({
      data: [
        {
          reporterId,
          targetUserId,
          offerId,
          messageId,
          reason: input.reason,
          comment: input.comment,
        },
      ],
      select: { id: true },
      skipDuplicates: true,
    })
  ).at(0);
  if (!created) {
    return { ok: false, message: t("alreadyReported") };
  }

  await maybeAutoblock(targetUserId);
  return { ok: true };
}
