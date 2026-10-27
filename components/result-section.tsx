import { useTranslations } from "next-intl";

import {
  confirmResult,
  disputeResult,
  submitNoShow,
  submitResult,
} from "@/app/offers/[id]/result-actions";
import { OfferActionButton } from "@/components/offer-action-button";
import { ResultForm } from "@/components/result-form";
import type { MatchParty, OfferFormat } from "@/lib/generated/prisma/enums";
import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import type { OfferJoinResult } from "@/lib/offers/offer-details";
import type { SetScore } from "@/lib/validation/match-result";

// A join's result, from whichever side is looking (tasks 4.6, 4.7, 4.10):
// nothing before the match starts or for doubles (no result form there at
// all); the submit form once it's started and nobody has filed one yet; a
// confirm/dispute choice, or a no-show's dispute-only choice, for whoever
// didn't file it while it's still PENDING, and just the score (or report)
// for whoever did; the score and this viewer's own ELO change once
// CONFIRMED; a note once DISPUTED or NO_SHOW. Shared by the player and
// author views of /offers/[id].
export function ResultSection({
  join,
  offer,
  party,
  opponentName,
}: {
  join: { id: string; result: OfferJoinResult | null };
  offer: { format: OfferFormat; startsAt: Date };
  party: MatchParty;
  opponentName: string;
}) {
  const t = useTranslations("ResultSection");

  if (offer.format !== "SINGLES" || offer.startsAt > new Date()) {
    return null;
  }
  const { result } = join;

  if (!result) {
    return (
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          {t("submitResultSummary")}
        </summary>
        <div className="mt-2">
          <ResultForm
            action={submitResult.bind(null, join.id)}
            onNoShow={submitNoShow.bind(null, join.id)}
            viewerParty={party}
            opponentName={opponentName}
          />
        </div>
      </details>
    );
  }

  if (result.noShowParty) {
    const viewerDidntShow = result.noShowParty === party;
    if (result.status === "PENDING") {
      if (result.reportedBy === party) {
        return (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("reportedNoShowWaiting", { name: opponentName })}
          </p>
        );
      }
      return (
        <div className="mt-2 space-y-2">
          <p className="text-sm">
            {t("opponentReportedNoShow", { name: opponentName })}
          </p>
          <OfferActionButton
            action={disputeResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        </div>
      );
    }
    if (result.status === "NO_SHOW") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowConfirmed", {
            who: viewerDidntShow ? t("you") : opponentName,
          })}
        </p>
      );
    }
    if (result.status === "DISPUTED") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowDisputed")}
        </p>
      );
    }
    if (result.status === "ANNULLED") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowAnnulled")}
        </p>
      );
    }
    return null;
  }

  // The viewer's own games first — same convention as the match history
  // (4.9), so "4-6, 3-6" always means "I lost both sets" to whoever reads it.
  const score = formatScoreFor(result.score as SetScore[], party === "AUTHOR");

  if (result.status === "PENDING") {
    if (result.reportedBy === party) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("resultSubmittedWaiting", { score, name: opponentName })}
        </p>
      );
    }
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm">
          {t("opponentReported", { name: opponentName, score })}
        </p>
        <div className="flex gap-2">
          <OfferActionButton
            action={confirmResult.bind(null, result.id)}
            label={t("confirm")}
            pendingLabel={t("confirming")}
          />
          <OfferActionButton
            action={disputeResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        </div>
      </div>
    );
  }

  if (result.status === "CONFIRMED") {
    const before =
      party === "AUTHOR" ? result.authorEloBefore : result.playerEloBefore;
    const after =
      party === "AUTHOR" ? result.authorEloAfter : result.playerEloAfter;
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("confirmed", { score })}
        {before !== null && after !== null && (
          <> {t("yourElo", { change: eloChangeLabel(before, after) })}</>
        )}
      </p>
    );
  }

  if (result.status === "DISPUTED") {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("resultDisputed", { score })}
      </p>
    );
  }

  if (result.status === "ANNULLED") {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("resultAnnulled", { score })}
      </p>
    );
  }

  return null;
}
