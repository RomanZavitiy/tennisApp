"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type Ref } from "react";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  birthDays,
  birthYears,
  composeBirthDate,
  splitBirthDate,
} from "@/lib/profile/birth-date";

// Date of birth as day / month / year selects (lib/profile/birth-date.ts
// says why not a calendar). Month names come from the site's language. The
// value is "YYYY-MM-DD", or "" while a part is still missing.
export function BirthDateSelect({
  id,
  value,
  onChange,
  today,
  invalid,
  describedBy,
  dayRef,
}: {
  /** Goes on the day select, so the field's <label> points at it. */
  id: string;
  value: string | undefined;
  onChange: (value: string) => void;
  /** Kraków today, "YYYY-MM-DD". */
  today: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  dayRef?: Ref<HTMLSelectElement>;
}) {
  const t = useTranslations("BirthDateSelect");
  const locale = useLocale();
  const [parts, setParts] = useState(() => splitBirthDate(value));
  const monthName = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  });

  function update(next: Partial<typeof parts>) {
    const merged = { ...parts, ...next };
    // 31 March → February: drop a day the new month doesn't have.
    if (merged.day && merged.day > birthDays(merged.month, merged.year)) {
      merged.day = null;
    }
    setParts(merged);
    onChange(composeBirthDate(merged.day, merged.month, merged.year));
  }

  const aria = {
    "aria-invalid": invalid ? true : undefined,
    "aria-describedby": describedBy,
  };
  const number = (raw: string) => (raw === "" ? null : Number(raw));

  return (
    <div className="grid grid-cols-[1fr_2fr_1.4fr] gap-2">
      <NativeSelect
        id={id}
        ref={dayRef}
        aria-label={t("day")}
        className="w-full"
        value={parts.day?.toString() ?? ""}
        onChange={(event) => {
          update({ day: number(event.target.value) });
        }}
        {...aria}
      >
        <NativeSelectOption value="" disabled>
          {t("day")}
        </NativeSelectOption>
        {Array.from(
          { length: birthDays(parts.month, parts.year) },
          (_, i) => i + 1,
        ).map((day) => (
          <NativeSelectOption key={day} value={String(day)}>
            {day}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t("month")}
        className="w-full"
        value={parts.month?.toString() ?? ""}
        onChange={(event) => {
          update({ month: number(event.target.value) });
        }}
        {...aria}
      >
        <NativeSelectOption value="" disabled>
          {t("month")}
        </NativeSelectOption>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <NativeSelectOption key={month} value={String(month)}>
            {monthName.format(new Date(Date.UTC(2000, month - 1, 1)))}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t("year")}
        className="w-full"
        value={parts.year?.toString() ?? ""}
        onChange={(event) => {
          update({ year: number(event.target.value) });
        }}
        {...aria}
      >
        <NativeSelectOption value="" disabled>
          {t("year")}
        </NativeSelectOption>
        {birthYears(today).map((year) => (
          <NativeSelectOption key={year} value={String(year)}>
            {year}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
