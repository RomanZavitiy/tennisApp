import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { DateField } from "@/components/date-field";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { OFFER_DURATIONS } from "@/lib/offers/duration";
import {
  feedHref,
  TIMES_OF_DAY,
  type FeedFilters,
} from "@/lib/offers/feed-filters";
import type { Sport } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { MATCH_GENDERS } from "@/lib/offers/match-gender";
import { levelsFor } from "@/lib/sport/sport";
import { todayInKrakow } from "@/lib/validation/profile";

// The feed's filters (task 3.7): a plain GET form, so the browser puts them
// in the URL itself and no client JavaScript is needed. Submitting drops
// ?page, so new filters start from the first page.
//
// `sport` (slice PD1) comes from the header switcher, not from this form:
// it decides the level scale, and hides the format for padel, which is
// always doubles.
export function OfferFilters({
  filters,
  sport,
  clubs,
}: {
  filters: FeedFilters;
  sport: Sport;
  /** The sport's clubs, by name — the "Club" filter (slice PD3). */
  clubs: { id: string; name: string }[];
}) {
  const isPadel = sport === "PADEL";
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
      className="surface grid grid-cols-2 items-end gap-3 p-4 sm:grid-cols-4 lg:grid-cols-2"
    >
      {/* Two columns wide: a picked date ("Fri, 20 Nov") and its clear
          button don't fit in one. */}
      <div className="col-span-2 space-y-1">
        <Label htmlFor="filter-date">{t("dateLabel")}</Label>
        <DateField
          id="filter-date"
          name="date"
          defaultValue={filters.date}
          today={todayInKrakow()}
          placeholder={t("anyDay")}
          clearable
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
        <Label htmlFor="filter-club">{t("clubLabel")}</Label>
        <NativeSelect
          id="filter-club"
          name="club"
          className="w-full"
          defaultValue={filters.club ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {clubs.map((club) => (
            <NativeSelectOption key={club.id} value={club.id}>
              {club.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-ntrp">
          {t(isPadel ? "padelLevelLabel" : "ntrpLabel")}
        </Label>
        <NativeSelect
          id="filter-ntrp"
          name="ntrp"
          className="w-full"
          defaultValue={filters.ntrp?.toFixed(1) ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {levelsFor(sport).map((level) => (
            <NativeSelectOption key={level} value={level.toFixed(1)}>
              {level.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {!isPadel && (
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
      )}
      <div className="space-y-1">
        <Label htmlFor="filter-gender">{t("genderLabel")}</Label>
        <NativeSelect
          id="filter-gender"
          name="gender"
          className="w-full"
          defaultValue={filters.gender ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {MATCH_GENDERS.filter((option) => option !== "ANY").map((option) => (
            <NativeSelectOption key={option} value={option}>
              {tOfferLabels(`matchGender.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-time">{t("timeLabel")}</Label>
        <NativeSelect
          id="filter-time"
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
      <div className="space-y-1">
        <Label htmlFor="filter-duration">{t("durationLabel")}</Label>
        <NativeSelect
          id="filter-duration"
          name="duration"
          className="w-full"
          defaultValue={filters.duration?.toString() ?? ""}
        >
          <NativeSelectOption value="">{t("any")}</NativeSelectOption>
          {OFFER_DURATIONS.map((minutes) => (
            <NativeSelectOption key={minutes} value={String(minutes)}>
              {tOfferLabels("duration", { hours: minutes / 60 })}
            </NativeSelectOption>
          ))}
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
