import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import {
  leaderboardHref,
  NTRP_BAND_KEYS,
  type LeaderboardFilters,
} from "@/lib/validation/leaderboard";

// The leaderboard's filters (task L.5): a plain GET form, like the offer
// feed's (components/offer-filters.tsx) and the court search's
// (components/club-filters.tsx), so the URL holds them and no client
// JavaScript is needed.
export function LeaderboardFiltersForm({
  filters,
}: {
  filters: LeaderboardFilters;
}) {
  const t = useTranslations("LeaderboardFilters");
  const active = Object.keys(filters).length > 0;

  return (
    <form
      method="get"
      action="/leaderboard"
      // Remount on every new set of filters: the fields are uncontrolled,
      // and "Clear" must empty them, not keep what was picked.
      key={leaderboardHref(filters)}
      aria-label={t("formLabel")}
      className="mt-6 grid grid-cols-2 items-end gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-4"
    >
      <div className="space-y-1">
        <Label htmlFor="leaderboard-filter-district">
          {t("districtLabel")}
        </Label>
        <NativeSelect
          id="leaderboard-filter-district"
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
        <Label htmlFor="leaderboard-filter-level">{t("levelLabel")}</Label>
        <NativeSelect
          id="leaderboard-filter-level"
          name="level"
          className="w-full"
          defaultValue={filters.level ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {NTRP_BAND_KEYS.map((level) => (
            <NativeSelectOption key={level} value={level}>
              {t(`level.${level}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex gap-2">
        <Button type="submit">{t("submit")}</Button>
        {active && (
          <Link
            href="/leaderboard"
            className={buttonVariants({ variant: "ghost" })}
          >
            {t("clear")}
          </Link>
        )}
      </div>
    </form>
  );
}
