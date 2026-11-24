import { useTranslations } from "next-intl";

import {
  confirmDoublesResult,
  disputeDoublesResult,
  rateDoublesPlayer,
} from "@/app/offers/[id]/doubles-result-actions";
import { DoublesResultForm } from "@/components/doubles-result-form";
import { OfferActionButton } from "@/components/offer-action-button";
import { RateOpponentForm } from "@/components/rate-opponent-form";
import type { FeedbackTag } from "@/lib/generated/prisma/enums";
import type { DoublesGameView } from "@/lib/offers/doubles-details";
import {
  doublesSideOf,
  settleDoublesRefusal,
} from "@/lib/offers/doubles-result-rules";
import { playersNeeded } from "@/lib/offers/players-needed";
import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import type { SetScore } from "@/lib/validation/match-result";

// A doubles game's result on /offers/[id] (slice PD4), for the people who
// played it: the form while nothing is filed (only once every place was
// taken), then who filed what, confirm / dispute for those who may, the
// outcome with the viewer's padel ELO change, and "rate the players" for a
// week after it's confirmed. The singles twin is result-section.tsx.

const PADEL_TAGS: readonly FeedbackTag[] = ["PUNCTUAL", "GOOD_GAME"];

export function DoublesResultSection({
  offerId,
  viewerId,
  game,
}: {
  offerId: string;
  viewerId: string;
  game: DoublesGameView;
}) {
  const t = useTranslations("DoublesResult");
  const { players, result } = game;
  // getDoublesGameView always puts the author first.
  const [author] = players;
  const nameOfId = (id: string | null) => {
    if (id === viewerId) {
      return t("you");
    }
    const player = players.find((one) => one.id === id);
    return player?.name ?? t("aPlayer");
  };

  if (!result) {
    // A game that never filled up wasn't a doubles match (NOT_FULL).
    if (players.length - 1 !== playersNeeded({ ...game, format: "DOUBLES" })) {
      return null;
    }
    return (
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          {t("submitSummary")}
        </summary>
        <div className="mt-3">
          <DoublesResultForm
            offerId={offerId}
            viewerId={viewerId}
            players={players}
            hasPartner={game.hasPartner}
          />
        </div>
      </details>
    );
  }

  const canSettle =
    settleDoublesRefusal({
      result: { ...result, authorId: author.id },
      userId: viewerId,
    }) === null;
  const reporter = nameOfId(result.reportedById);

  if (result.noShowUserId) {
    const who = nameOfId(result.noShowUserId);
    return (
      <div className="mt-4 space-y-2 text-sm">
        <p>
          {result.status === "PENDING"
            ? t("noShowPending", { reporter, who })
            : result.status === "NO_SHOW"
              ? t("noShowConfirmed", { who })
              : t("noShowDisputed", { who })}
        </p>
        {canSettle && (
          <OfferActionButton
            action={disputeDoublesResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        )}
      </div>
    );
  }

  const fullResult = { ...result, authorId: author.id };
  const viewerSide = doublesSideOf(fullResult, viewerId);
  const pairNames = (ids: (string | null)[]) =>
    ids
      .map((id) => (id === null ? t("authorsPartner") : nameOfId(id)))
      .join(" & ");
  const viewerPair =
    viewerSide === "PLAYER"
      ? pairNames([result.opponent1Id, result.opponent2Id])
      : pairNames([author.id, result.authorPartnerId]);
  const otherPair =
    viewerSide === "PLAYER"
      ? pairNames([author.id, result.authorPartnerId])
      : pairNames([result.opponent1Id, result.opponent2Id]);
  // The viewer's pair's games first, as in singles.
  const score = formatScoreFor(
    result.score as SetScore[],
    viewerSide !== "PLAYER",
  );
  const line = t("scoreLine", { viewerPair, otherPair, score });

  const ownChange = result.eloChanges?.find(
    (change) => change.userId === viewerId,
  );

  return (
    <div className="mt-4 space-y-3 text-sm">
      <p>
        {result.status === "PENDING"
          ? t("pending", { reporter, line })
          : result.status === "CONFIRMED"
            ? t("confirmed", { line })
            : t("disputed", { line })}
      </p>
      {result.status === "CONFIRMED" && (
        <p className="text-muted-foreground">
          {game.sport === "TENNIS"
            ? t("tennisNoRating")
            : ownChange
              ? t("yourPadelElo", {
                  change: eloChangeLabel(ownChange.before, ownChange.after),
                })
              : t("padelNotRated")}
        </p>
      )}
      {canSettle && (
        <div className="flex gap-2">
          <OfferActionButton
            action={confirmDoublesResult.bind(null, result.id)}
            label={t("confirm")}
            pendingLabel={t("confirming")}
          />
          <OfferActionButton
            action={disputeDoublesResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        </div>
      )}
      {game.toRate.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium">{t("rateThePlayers")}</p>
          {game.toRate.map((player) => (
            <div key={player.id}>
              <p className="text-muted-foreground">{nameOfId(player.id)}</p>
              <RateOpponentForm
                action={rateDoublesPlayer.bind(null, result.id, player.id)}
                withLevelSignal={false}
                {...(game.sport === "PADEL" ? { tagOptions: PADEL_TAGS } : {})}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
