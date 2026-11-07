import { useTranslations } from "next-intl";

import { inviteToOffer } from "@/app/offers/[id]/invite-actions";
import { MarkCandidatesViewed } from "@/components/mark-candidates-viewed";
import { OfferActionButton } from "@/components/offer-action-button";
import { PlayerLink } from "@/components/player-link";
import type { Candidate } from "@/lib/matching/candidates";
import { reliabilityLabel } from "@/lib/rating/reliability";

/**
 * "Кого запросити" (task S2.2): only on the author's own OPEN offer, right
 * above (or below) the join requests — each candidate's reason line is the
 * same three facts the plan asks for (level, same district, reliability);
 * district is always the offer's own, so it isn't repeated per row.
 */
export function CandidatesSection({
  offerId,
  candidates,
}: {
  offerId: string;
  candidates: Candidate[];
}) {
  const t = useTranslations("CandidatesSection");
  const tReliability = useTranslations("Reliability");

  return (
    <div>
      <MarkCandidatesViewed count={candidates.length} />
      <h2 className="font-semibold">{t("title")}</h2>
      {candidates.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("noneYet")}</p>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border">
          {candidates.map((candidate, index) => (
            <li
              key={candidate.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <PlayerLink player={candidate} />
                <p className="text-xs text-muted-foreground">
                  {t("reason", {
                    ntrp: candidate.selfRatedNtrp ?? 0,
                    reliability: reliabilityLabel(
                      tReliability,
                      candidate.reliability,
                    ),
                  })}
                </p>
              </div>
              <OfferActionButton
                action={inviteToOffer.bind(
                  null,
                  offerId,
                  candidate.id,
                  "candidates",
                  index + 1,
                )}
                label={t("invite")}
                pendingLabel={t("inviting")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
