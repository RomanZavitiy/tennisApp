import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// The facts shown on a player's own profile and on their public page. Age
// only — the birth date itself is never shown.
export function PlayerFacts({
  age,
  district,
  selfRatedNtrp,
}: {
  age: number;
  district: District;
  selfRatedNtrp: number;
}) {
  const facts = [
    { label: "Age", value: String(age) },
    { label: "District", value: DISTRICT_LABELS[district] },
    { label: "Level (NTRP)", value: selfRatedNtrp.toFixed(1) },
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
