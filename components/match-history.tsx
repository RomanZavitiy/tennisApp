import Link from "next/link";

import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import type { MatchHistoryEntry } from "@/lib/players/match-history";

// A player's confirmed matches (task 4.9), most recent first. Nothing
// pending or disputed ever reaches here — getMatchHistory only loads
// CONFIRMED results, so there's no "hidden while unconfirmed" branch to
// get wrong here.
export function MatchHistory({ matches }: { matches: MatchHistoryEntry[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">No matches yet.</p>;
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
              {match.won ? "Won" : "Lost"} vs{" "}
              <Link
                href={`/players/${match.opponentId}`}
                className="hover:underline"
              >
                {match.opponentName ?? "A player"}
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
