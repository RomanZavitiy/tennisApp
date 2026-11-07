import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { TIMES_OF_DAY, type FeedFilters } from "@/lib/offers/feed-filters";
import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";

/**
 * "Шукають гру"'s own filters (task U2.2's "ті самі" filters as the offer
 * feed) — date, district, level, format, time of day, the same URL shape
 * as OfferFilters/parseFeedFilters, minus duration and courtBooked, which
 * a PlayIntent has no equivalent of.
 */
export function IntentFilters({ filters }: { filters: FeedFilters }) {
  const t = useTranslations("OfferFilters");
  const tOfferLabels = useTranslations("OfferLabels");

  return (
    <form
      method="get"
      action="/offers/looking"
      aria-label={t("formLabel")}
      className="mt-6 grid grid-cols-2 items-end gap-3 sm:grid-cols-4"
    >
      <div className="space-y-1">
        <Label htmlFor="intent-filter-date">{t("dateLabel")}</Label>
        <Input
          id="intent-filter-date"
          name="date"
          type="date"
          defaultValue={filters.date}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="intent-filter-district">{t("districtLabel")}</Label>
        <NativeSelect
          id="intent-filter-district"
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
        <Label htmlFor="intent-filter-ntrp">{t("ntrpLabel")}</Label>
        <NativeSelect
          id="intent-filter-ntrp"
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
        <Label htmlFor="intent-filter-format">{t("formatLabel")}</Label>
        <NativeSelect
          id="intent-filter-format"
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
      <div className="space-y-1">
        <Label htmlFor="intent-filter-time">{t("timeLabel")}</Label>
        <NativeSelect
          id="intent-filter-time"
          name="time"
          className="w-full"
          defaultValue={filters.time ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {TIMES_OF_DAY.map((time) => (
            <NativeSelectOption key={time} value={time}>
              {t(`time.${time}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </form>
  );
}
