import { useTranslations } from "next-intl";

import { RateOpponentButton } from "@/components/rate-opponent-button";
import type { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";

type FeedbackActionResult = { ok: true } | { ok: false; message: string };

export type PendingFeedback = {
  matchResultId: string;
  opponentName: string | null;
};

/**
 * "Rate your opponent" prompt (task W.1) on the profile's "My games" card --
 * the second entry point, alongside the one inline on the match in history
 * (MatchHistory's own `feedback` prop). Both bind the same server action
 * per match, so submitting from either makes the other disappear once the
 * page revalidates.
 */
export function PendingFeedbackPrompt({
  pending,
  action,
}: {
  pending: PendingFeedback[];
  action: (
    matchResultId: string,
    input: { tags: FeedbackTag[]; levelSignal: LevelSignal | null },
  ) => Promise<FeedbackActionResult>;
}) {
  const t = useTranslations("PendingFeedbackPrompt");

  if (pending.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {pending.map((item) => (
        <li key={item.matchResultId}>
          <p className="text-sm">
            {t("vsOpponent", { name: item.opponentName ?? t("aPlayer") })}
          </p>
          <RateOpponentButton action={action.bind(null, item.matchResultId)} />
        </li>
      ))}
    </ul>
  );
}
