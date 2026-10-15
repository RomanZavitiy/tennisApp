import { useTranslations } from "next-intl";

import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel, type Reliability } from "@/lib/rating/reliability";

// The facts shown on a player's own profile and on their public page. Age
// only — the birth date itself is never shown. ELO (task 4.9) and
// reliability (4.12) are optional for the same reason: the profile's own
// edit page (1.15) doesn't pass them — a player editing their own fields
// has no reason to see their rating or reliability there — only the public
// page does.
export function PlayerFacts({
  age,
  district,
  selfRatedNtrp,
  elo,
  reliability,
}: {
  age: number;
  district: District;
  selfRatedNtrp: number;
  elo?: number;
  reliability?: Reliability;
}) {
  const t = useTranslations("PlayerFacts");
  const tReliability = useTranslations("Reliability");

  const facts = [
    { label: t("age"), value: String(age) },
    { label: t("district"), value: DISTRICT_LABELS[district] },
    { label: t("level"), value: selfRatedNtrp.toFixed(1) },
    ...(elo !== undefined ? [{ label: t("elo"), value: String(elo) }] : []),
    ...(reliability
      ? [
          {
            label: t("reliability"),
            value: reliabilityLabel(tReliability, reliability),
          },
        ]
      : []),
  ];

  return (
    <dl className="space-y-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
