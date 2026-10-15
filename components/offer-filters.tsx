import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { feedHref, type FeedFilters } from "@/lib/offers/feed-filters";
import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";

// The feed's filters (task 3.7): a plain GET form, so the browser puts them
// in the URL itself and no client JavaScript is needed. Submitting drops
// ?page, so new filters start from the first page.
export function OfferFilters({ filters }: { filters: FeedFilters }) {
  const t = useTranslations("OfferFilters");
  const tOfferLabels = useTranslations("OfferLabels");
  const active = Object.keys(filters).length > 0;

  return (
    <form
      method="get"
      action="/offers"
      // Remount on every new set of filters: the fields are uncontrolled,
      // and "Clear" must empty them, not keep what was typed.
      key={feedHref(filters)}
      aria-label={t("formLabel")}
      className="mt-6 grid grid-cols-2 items-end gap-3 sm:grid-cols-5"
    >
      <div className="space-y-1">
        <Label htmlFor="filter-date">{t("dateLabel")}</Label>
        <Input
          id="filter-date"
          name="date"
          type="date"
          defaultValue={filters.date}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-district">{t("districtLabel")}</Label>
        <NativeSelect
          id="filter-district"
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
        <Label htmlFor="filter-ntrp">{t("ntrpLabel")}</Label>
        <NativeSelect
          id="filter-ntrp"
          name="ntrp"
          className="w-full"
          defaultValue={filters.ntrp?.toFixed(1) ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {NTRP_LEVELS.map((level) => (
            <NativeSelectOption key={level} value={level.toFixed(1)}>
              {level.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-format">{t("formatLabel")}</Label>
        <NativeSelect
          id="filter-format"
          name="format"
          className="w-full"
          defaultValue={filters.format ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          <NativeSelectOption value="SINGLES">
            {tOfferLabels("singles")}
          </NativeSelectOption>
          <NativeSelectOption value="DOUBLES">
            {tOfferLabels("doubles")}
          </NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input
          id="filter-courtBooked"
          name="courtBooked"
          type="checkbox"
          value="1"
          defaultChecked={filters.courtBooked ?? false}
        />
        <Label htmlFor="filter-courtBooked">{t("courtBookedLabel")}</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit">{t("submit")}</Button>
        {active && (
          <Link href="/offers" className={buttonVariants({ variant: "ghost" })}>
            {t("clear")}
          </Link>
        )}
      </div>
    </form>
  );
}
