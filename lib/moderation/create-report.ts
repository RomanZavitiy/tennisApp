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

const CANT_REPORT_YOURSELF = "You can't report yourself.";
const ALREADY_REPORTED = "You've already reported this.";

export async function createReport({
  reporterId,
  targetUserId,
  offerId,
  messageId,
  input,
}: {
  reporterId: string;
  targetUserId: string;
  offerId?: string;
  messageId?: string;
  input: ReportInput;
}): Promise<CreateReportResult> {
  if (targetUserId === reporterId) {
    return { ok: false, message: CANT_REPORT_YOURSELF };
  }

  const limited = await checkRateLimit(reporterId, "REPORT");
  if (!limited.ok) {
    return limited;
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
    return { ok: false, message: ALREADY_REPORTED };
  }

  await maybeAutoblock(targetUserId);
  return { ok: true };
}
