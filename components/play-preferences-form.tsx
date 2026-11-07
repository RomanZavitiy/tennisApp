"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { updatePlayPreferences } from "@/app/(member)/profile/preferences/actions";
import { Button } from "@/components/ui/button";
import type { District } from "@/lib/generated/prisma/enums";
import { TIMES_OF_DAY, type TimeOfDay } from "@/lib/offers/feed-filters";
import { DISTRICT_LABELS, WEEKDAYS, type Weekday } from "@/lib/profile/options";

export type PlayPreferences = {
  preferredDays: Weekday[];
  preferredTimes: TimeOfDay[];
  preferredDistricts: District[];
};

function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * "Коли я люблю грати" (slice U1, task U1.2): three optional checkbox
 * groups, saved together. `ownDistrict` is left out of the district list —
 * the plan asks for preferences *besides* the player's main one (task U1.1).
 */
export function PlayPreferencesForm({
  preferences,
  ownDistrict,
}: {
  preferences: PlayPreferences;
  ownDistrict: District | null;
}) {
  const t = useTranslations("PlayPreferencesForm");
  const tWeekday = useTranslations("Weekday");
  const [days, setDays] = useState(preferences.preferredDays);
  const [times, setTimes] = useState(preferences.preferredTimes);
  const [districts, setDistricts] = useState(preferences.preferredDistricts);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setMessage(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePlayPreferences({
        preferredDays: days,
        preferredTimes: times,
        preferredDistricts: districts,
      });
      if (result.ok) {
        setSaved(true);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="font-medium">{t("daysLabel")}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {WEEKDAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={days.includes(day)}
                onChange={() => {
                  setDays(toggled(days, day));
                }}
              />
              {tWeekday(day)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium">{t("timesLabel")}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {TIMES_OF_DAY.map((time) => (
            <label key={time} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={times.includes(time)}
                onChange={() => {
                  setTimes(toggled(times, time));
                }}
              />
              {t(`time.${time}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium">{t("districtsLabel")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {Object.entries(DISTRICT_LABELS)
            .filter(([value]) => value !== ownDistrict)
            .map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={districts.includes(value as District)}
                  onChange={() => {
                    setDistricts(toggled(districts, value as District));
                  }}
                />
                {label}
              </label>
            ))}
        </div>
      </fieldset>

      <Button type="button" disabled={pending} onClick={save}>
        {pending ? t("saving") : saved ? t("saved") : t("save")}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
