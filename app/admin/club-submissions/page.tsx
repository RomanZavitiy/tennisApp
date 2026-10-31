import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  approveSubmission,
  rejectSubmission,
} from "@/app/admin/club-submissions/actions";
import { AdminActionForm } from "@/components/admin-action-form";
import { getOpenClubSubmissions } from "@/lib/admin/queue";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { firstNameAndInitial } from "@/lib/privacy/opponent-name";

export const metadata: Metadata = { title: "Admin · Club submissions" };

// The club-submission queue (task M.8): PENDING tips, oldest first.
// Approving or rejecting (M.9) never creates a Club row — the owner still
// loads the real club by hand through prisma/load-clubs.ts once verified.
export default async function AdminClubSubmissionsPage() {
  const submissions = await getOpenClubSubmissions();
  const t = await getTranslations("AdminClubSubmissionsPage");
  const format = await getFormatter();

  return (
    <section>
      <h2 className="font-semibold">
        {t("pending", { count: submissions.length })}
      </h2>
      {submissions.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("nothingWaiting")}
        </p>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border">
          {submissions.map((submission) => (
            <li key={submission.id} className="px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {formatKrakowTime(format, submission.createdAt)} ·{" "}
                <Link
                  href={`/players/${submission.submittedBy.id}`}
                  className="hover:underline"
                >
                  {firstNameAndInitial(submission.submittedBy.name)}
                </Link>
              </p>
              <p className="mt-1 font-medium">{submission.name}</p>
              <p className="text-sm text-muted-foreground">
                {submission.address}
                {submission.districtGuess &&
                  ` · ${DISTRICT_LABELS[submission.districtGuess]}`}
              </p>
              {submission.notes && (
                <p className="mt-1 text-sm whitespace-pre-line">
                  {submission.notes}
                </p>
              )}
              <AdminActionForm
                reasonLabel={t("rejectionReasonLabel")}
                actions={[
                  {
                    key: "approve",
                    label: t("approve"),
                    pendingLabel: t("approving"),
                    run: approveSubmission.bind(null, submission.id),
                  },
                  {
                    key: "reject",
                    label: t("reject"),
                    pendingLabel: t("rejecting"),
                    variant: "outline",
                    run: rejectSubmission.bind(null, submission.id),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
