import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  annulDisputedResult,
  confirmDisputedResult,
} from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin-action-form";
import { getDisputedResults } from "@/lib/admin/queue";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { formatScore } from "@/lib/offers/result-labels";
import type { SetScore } from "@/lib/validation/match-result";

export const metadata: Metadata = { title: "Admin · Disputed results" };

// The disputed-results tab (task 6.3): a score or a no-show report, in
// either case disputed by the other party (result-actions.ts) and waiting
// on an admin to confirm it (apply ELO or the no-show counter) or annul it
// (neither applies — the dispute stands).
export default async function AdminResultsPage() {
  const results = await getDisputedResults();
  const t = await getTranslations("AdminResultsPage");
  const format = await getFormatter();

  return (
    <section>
      <h2 className="font-semibold">
        {t("disputed", { count: results.length })}
      </h2>
      {results.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("nothingWaiting")}
        </p>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border">
          {results.map((result) => {
            const { offerJoin } = result;
            return (
              <li key={result.id} className="px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/offers/${offerJoin.offerId}`}
                    className="hover:underline"
                  >
                    {formatKrakowTime(format, offerJoin.offer.startsAt)}
                  </Link>
                </p>
                <p className="mt-1">
                  <Link
                    href={`/players/${offerJoin.offer.author.id}`}
                    className="hover:underline"
                  >
                    {offerJoin.offer.author.name ?? t("theAuthor")}
                  </Link>{" "}
                  {t("vs")}{" "}
                  <Link
                    href={`/players/${offerJoin.user.id}`}
                    className="hover:underline"
                  >
                    {offerJoin.user.name ?? t("thePlayer")}
                  </Link>
                </p>
                {result.noShowParty ? (
                  <p className="mt-1 text-sm">
                    {t("noShowReport", {
                      who:
                        result.noShowParty === "AUTHOR"
                          ? t("theAuthor")
                          : t("thePlayer"),
                      reportedBy:
                        result.reportedBy === "AUTHOR"
                          ? t("theAuthor")
                          : t("thePlayer"),
                    })}
                  </p>
                ) : (
                  <p className="mt-1 text-sm">
                    {t("scoreFiledBy", {
                      score: formatScore(result.score as SetScore[]),
                      reportedBy:
                        result.reportedBy === "AUTHOR"
                          ? t("theAuthor")
                          : t("thePlayer"),
                    })}
                  </p>
                )}
                <AdminActionForm
                  actions={[
                    {
                      key: "confirm",
                      label: t("confirm"),
                      pendingLabel: t("confirming"),
                      run: confirmDisputedResult.bind(null, result.id),
                    },
                    {
                      key: "annul",
                      label: t("annul"),
                      pendingLabel: t("annulling"),
                      variant: "outline",
                      run: annulDisputedResult.bind(null, result.id),
                    },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
