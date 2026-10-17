import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { clubsHref, type ClubFilters } from "@/lib/clubs/club-filters";
import { Surface } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// The court search's filters (slice K4): a plain GET form, like the offer
// feed's (components/offer-filters.tsx), so the URL holds them and no client
// JavaScript is needed.
export function ClubFiltersForm({ filters }: { filters: ClubFilters }) {
  const t = useTranslations("ClubFilters");
  const tSurface = useTranslations("Surface");
  const active = Object.keys(filters).length > 0;

  return (
    <form
      method="get"
      action="/"
      // Remount on every new set of filters: the fields are uncontrolled,
      // and "Clear" must empty them, not keep what was picked.
      key={clubsHref(filters)}
      aria-label={t("formLabel")}
      className="mt-6 grid grid-cols-2 items-end gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-4"
    >
      <div className="space-y-1">
        <Label htmlFor="club-filter-district">{t("districtLabel")}</Label>
        <NativeSelect
          id="club-filter-district"
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
        <Label htmlFor="club-filter-surface">{t("surfaceLabel")}</Label>
        <NativeSelect
          id="club-filter-surface"
          name="surface"
          className="w-full"
          defaultValue={filters.surface ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {Object.values(Surface).map((surface) => (
            <NativeSelectOption key={surface} value={surface}>
              {tSurface(surface)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input
          id="club-filter-indoor"
          name="indoor"
          type="checkbox"
          value="1"
          defaultChecked={filters.indoor ?? false}
        />
        <Label htmlFor="club-filter-indoor">{t("indoorLabel")}</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit">{t("submit")}</Button>
        {active && (
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            {t("clear")}
          </Link>
        )}
      </div>
    </form>
  );
}
