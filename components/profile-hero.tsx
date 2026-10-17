import { useTranslations } from "next-intl";

import { PlayerAvatar } from "@/components/player-avatar";
import type { MatchSummary } from "@/lib/players/match-history";
import type { PublicProfile } from "@/lib/players/public-profile";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";

// The top of a player's profile (slice K6), the same on their own /profile
// and on the public /players/[id]: photo, name, age and district, then the
// four numbers another player sizes them up by. Only PublicProfile fields
// appear, so the own view can't show anything the public one doesn't —
// the birth date stays an age, as everywhere else.
export function ProfileHero({
  profile,
  summary,
}: {
  profile: PublicProfile;
  summary: MatchSummary;
}) {
  const t = useTranslations("ProfileHero");
  const tReliability = useTranslations("Reliability");

  const stats = [
    { label: t("elo"), value: String(profile.elo) },
    { label: t("level"), value: profile.selfRatedNtrp.toFixed(1) },
    {
      label: t("reliability"),
      value: reliabilityLabel(tReliability, profile.reliability),
    },
    {
      label: t("record"),
      value: `${String(summary.won)}–${String(summary.lost)}`,
      hint: t("played", { count: summary.played }),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        aria-hidden
        className="h-24 bg-gradient-to-br from-primary to-primary/70"
      />
      <div className="px-5 pb-5">
        <div className="-mt-12 w-fit rounded-full ring-4 ring-card">
          <PlayerAvatar name={profile.name} avatarPath={profile.avatarPath} />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {profile.name}
        </h1>
        <p className="text-muted-foreground">
          {t("age", { age: profile.age })} · {DISTRICT_LABELS[profile.district]}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold">{stat.value}</dd>
              {stat.hint && (
                <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
