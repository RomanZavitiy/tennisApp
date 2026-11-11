import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { CoachLevel } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { coachesHref, type CoachFilters } from "@/lib/validation/coaches-query";

// The coaching directory's filters (task P.10): a plain GET form, like the
// leaderboard's (components/leaderboard-filters.tsx) and the court search's
// (components/club-filters.tsx), so the URL holds them and no client
// JavaScript is needed.
export function CoachFiltersForm({ filters }: { filters: CoachFilters }) {
  const t = useTranslations("CoachFilters");
  const tLevel = useTranslations("CoachLevel");
  const active = Object.keys(filters).length > 0;

  return (
    <form
      method="get"
      action="/coaches"
      // Remount on every new set of filters: the fields are uncontrolled,
      // and "Clear" must empty them, not keep what was picked.
      key={coachesHref(filters)}
      aria-label={t("formLabel")}
      className="surface grid grid-cols-2 items-end gap-3 p-4 sm:grid-cols-4 lg:grid-cols-2"
    >
      <div className="space-y-1">
        <Label htmlFor="coach-filter-district">{t("districtLabel")}</Label>
        <NativeSelect
          id="coach-filter-district"
          name="district"
          className="w-full"
          defaultValue={filters.district ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="coach-filter-level">{t("levelLabel")}</Label>
        <NativeSelect
          id="coach-filter-level"
          name="level"
          className="w-full"
          defaultValue={filters.level ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {Object.values(CoachLevel).map((level) => (
            <NativeSelectOption key={level} value={level}>
              {tLevel(level)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex gap-2">
        <Button type="submit">{t("submit")}</Button>
        {active && (
          <Link
            href="/coaches"
            className={buttonVariants({ variant: "ghost" })}
          >
            {t("clear")}
          </Link>
        )}
      </div>
    </form>
  );
}
