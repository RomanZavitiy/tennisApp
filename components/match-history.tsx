import { useTranslations } from "next-intl";
import Link from "next/link";

import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import type { MatchHistoryEntry } from "@/lib/players/match-history";

// A player's confirmed matches (task 4.9), most recent first. Nothing
// pending or disputed ever reaches here — getMatchHistory only loads
// CONFIRMED results, so there's no "hidden while unconfirmed" branch to
// get wrong here.
export function MatchHistory({ matches }: { matches: MatchHistoryEntry[] }) {
  const t = useTranslations("MatchHistory");

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noMatches")}</p>;
  }

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <li
          key={match.id}
          className="flex items-center justify-between gap-4 text-sm"
        >
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
          <p className="shrink-0 text-muted-foreground">
            {eloChangeLabel(match.eloBefore, match.eloAfter)}
          </p>
        </li>
      ))}
    </ul>
  );
}
