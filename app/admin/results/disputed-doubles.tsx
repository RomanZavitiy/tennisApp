import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  annulDisputedDoublesResult,
  confirmDisputedDoublesResult,
} from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin-action-form";
import type { DisputedDoublesResult } from "@/lib/admin/queue";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { formatScore } from "@/lib/offers/result-labels";
import type { SetScore } from "@/lib/validation/match-result";

type Player = { id: string; name: string | null } | null;

// Disputed doubles results (slice PD4 follow-up), under the singles ones on
// the disputed-results tab: a score disputed by the other pair, or a no-show
// report disputed by the player it names. Confirm applies it (padel ELO, or
// the no-show counter); annul leaves everything as it was.
export async function DisputedDoubles({
  results,
}: {
  results: DisputedDoublesResult[];
}) {
  const t = await getTranslations("AdminResultsPage");
  const tSport = await getTranslations("SportSwitcher.names");
  const format = await getFormatter();

  const nameOf = (player: Player) =>
    player ? (player.name ?? t("thePlayer")) : t("ownPartner");
  // null on the author's side: they brought their own partner (no account).
  const playerLink = (player: Player) =>
    player ? (
      <Link href={`/players/${player.id}`} className="hover:underline">
        {player.name ?? t("thePlayer")}
      </Link>
    ) : (
      t("ownPartner")
    );

  return (
    <section className="mt-8">
      <h2 className="font-semibold">
        {t("disputedDoubles", { count: results.length })}
      </h2>
      {results.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("nothingWaiting")}
        </p>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border">
          {results.map((result) => (
            <li key={result.id} className="px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <Link
                  href={`/offers/${result.offer.id}`}
                  className="hover:underline"
                >
                  {tSport(result.offer.sport)} ·{" "}
                  {formatKrakowTime(format, result.offer.startsAt)}
                </Link>
              </p>
              {result.noShowUser ? (
                <p className="mt-1 text-sm">
                  {t("doublesNoShowReport", {
                    who: nameOf(result.noShowUser),
                    reportedBy: nameOf(result.reportedBy),
                  })}
                </p>
              ) : (
                <>
                  <p className="mt-1">
                    {playerLink(result.offer.author)} &{" "}
                    {playerLink(result.authorPartner)} {t("vs")}{" "}
                    {playerLink(result.opponent1)} &{" "}
                    {playerLink(result.opponent2)}
                  </p>
                  <p className="mt-1 text-sm">
                    {t("doublesScoreFiledBy", {
                      score: formatScore(result.score as SetScore[]),
                      reportedBy: nameOf(result.reportedBy),
                    })}
                  </p>
                </>
              )}
              <AdminActionForm
                actions={[
                  {
                    key: "confirm",
                    label: t("confirm"),
                    pendingLabel: t("confirming"),
                    run: confirmDisputedDoublesResult.bind(null, result.id),
                  },
                  {
                    key: "annul",
                    label: t("annul"),
                    pendingLabel: t("annulling"),
                    variant: "outline",
                    run: annulDisputedDoublesResult.bind(null, result.id),
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
