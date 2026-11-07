import { useTranslations } from "next-intl";
import Link from "next/link";

import { RateOpponentButton } from "@/components/rate-opponent-button";
import type { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";
import { playAgainParams } from "@/lib/offers/play-again";
import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import type { MatchHistoryEntry } from "@/lib/players/match-history";

type FeedbackActionResult = { ok: true } | { ok: false; message: string };

/** The "rate your opponent" prop (slice W) -- undefined on the public
 * /players/[id] page, where the viewer isn't necessarily a party to every
 * match shown. */
export type MatchHistoryFeedback = {
  eligibleIds: Set<string>;
  action: (
    matchResultId: string,
    input: { tags: FeedbackTag[]; levelSignal: LevelSignal | null },
  ) => Promise<FeedbackActionResult>;
};

// A player's confirmed matches (task 4.9), most recent first. Nothing
// pending or disputed ever reaches here — getMatchHistory only loads
// CONFIRMED results, so there's no "hidden while unconfirmed" branch to
// get wrong here.
export function MatchHistory({
  matches,
  feedback,
}: {
  matches: MatchHistoryEntry[];
  feedback?: MatchHistoryFeedback;
}) {
  const t = useTranslations("MatchHistory");

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noMatches")}</p>;
  }

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <li key={match.id} id={`feedback-${match.id}`} className="text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {match.won ? t("won") : t("lost")} {t("vs")}{" "}
                <Link
                  href={`/players/${match.opponentId}`}
                  className="hover:underline"
                >
                  {match.opponentName ?? t("aPlayer")}
                </Link>
              </p>
              <p className="text-muted-foreground">
                {formatScoreFor(match.sets, match.wasAuthor)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-muted-foreground">
                {eloChangeLabel(match.eloBefore, match.eloAfter)}
              </p>
              <Link
                href={`/offers/new?${playAgainParams(match).toString()}`}
                className="text-xs text-primary hover:underline"
              >
                {t("playAgain")}
              </Link>
            </div>
          </div>
          {feedback?.eligibleIds.has(match.id) && (
            <RateOpponentButton action={feedback.action.bind(null, match.id)} />
          )}
        </li>
      ))}
    </ul>
  );
}
