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
  const tSide = useTranslations("PadelSide");

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
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {/* The banner: a forest block with the ball coming over its edge. */}
      <div aria-hidden className="relative h-28 overflow-hidden bg-brand">
        <div className="absolute -top-16 right-8 size-40 rounded-full bg-highlight" />
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="relative -mt-12 w-fit rounded-full ring-4 ring-card">
          <PlayerAvatar name={profile.name} avatarPath={profile.avatarPath} />
        </div>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          {profile.name}
        </h1>
        <p className="text-muted-foreground">
          {t("age", { age: profile.age })} · {DISTRICT_LABELS[profile.district]}
        </p>
        {/* Slice PD2: only for a player who declared a padel level. */}
        {profile.padelLevel !== null && (
          <p className="mt-1 text-sm font-medium">
            {t("padel", { level: profile.padelLevel })}
            {profile.padelSide && ` · ${tSide(profile.padelSide)}`}
          </p>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-muted px-4 py-3 first:bg-highlight first:text-highlight-foreground"
            >
              <dt className="text-xs font-semibold opacity-70">{stat.label}</dt>
              <dd className="mt-0.5 font-heading text-2xl font-extrabold tracking-tight">
                {stat.value}
              </dd>
              {stat.hint && <dd className="text-xs opacity-70">{stat.hint}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
