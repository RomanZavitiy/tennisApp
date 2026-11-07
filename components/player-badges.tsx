import { useTranslations } from "next-intl";

import type { AchievementId } from "@/lib/achievements/achievements";
import type { FeedbackTag } from "@/lib/generated/prisma/enums";

/**
 * Public badges on a profile (slice W, task W.2/W.4): achievements and
 * feedback-tag badges, both computed, never stored individually. Shown on
 * both the player's own /profile and the public /players/[id] -- unlike
 * the level-signal hint, which stays private to the player themselves.
 */
export function PlayerBadges({
  achievements,
  feedbackBadges,
}: {
  achievements: AchievementId[];
  feedbackBadges: FeedbackTag[];
}) {
  const tAchievement = useTranslations("Achievement");
  const tTag = useTranslations("FeedbackTag");

  if (achievements.length === 0 && feedbackBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((id) => (
        <span
          key={id}
          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tAchievement(id)}
        </span>
      ))}
      {feedbackBadges.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {tTag(tag)}
        </span>
      ))}
    </div>
  );
}
