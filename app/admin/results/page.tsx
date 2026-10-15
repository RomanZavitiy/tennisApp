import type { Metadata } from "next";
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

  return (
    <section>
      <h2 className="font-semibold">Disputed ({String(results.length)})</h2>
      {results.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing waiting.</p>
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
                    {formatKrakowTime(offerJoin.offer.startsAt)}
                  </Link>
                </p>
                <p className="mt-1">
                  <Link
                    href={`/players/${offerJoin.offer.author.id}`}
                    className="hover:underline"
                  >
                    {offerJoin.offer.author.name ?? "The author"}
                  </Link>{" "}
                  vs{" "}
                  <Link
                    href={`/players/${offerJoin.user.id}`}
                    className="hover:underline"
                  >
                    {offerJoin.user.name ?? "the player"}
                  </Link>
                </p>
                {result.noShowParty ? (
                  <p className="mt-1 text-sm">
                    No-show report:{" "}
                    {result.noShowParty === "AUTHOR"
                      ? "the author"
                      : "the player"}{" "}
                    didn&apos;t show up, reported by{" "}
                    {result.reportedBy === "AUTHOR"
                      ? "the author"
                      : "the player"}
                    .
                  </p>
                ) : (
                  <p className="mt-1 text-sm">
                    Score: {formatScore(result.score as SetScore[])}{" "}
                    (author&apos;s games first), filed by{" "}
                    {result.reportedBy === "AUTHOR"
                      ? "the author"
                      : "the player"}
                    .
                  </p>
                )}
                <AdminActionForm
                  actions={[
                    {
                      key: "confirm",
                      label: "Confirm",
                      pendingLabel: "Confirming…",
                      run: confirmDisputedResult.bind(null, result.id),
                    },
                    {
                      key: "annul",
                      label: "Annul",
                      pendingLabel: "Annulling…",
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
