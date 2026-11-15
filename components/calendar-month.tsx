"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  isoDate,
  monthGrid,
  monthIndex,
  monthOf,
  shiftMonth,
} from "@/lib/offers/date-time-picker";
import { cn } from "@/lib/utils";

// All formatting in UTC on UTC-midnight dates: the strings are already
// Kraków days, so no time zone may move them.
export function utcDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** "piątek, 20 listopada" / "Friday, November 20" in the site's language. */
export function useFullDateFormat(): Intl.DateTimeFormat {
  const locale = useLocale();
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// One month of days, Monday first, with arrows to move between months. The
// shared calendar of every date field (DateTimePicker, DateField). It knows
// nothing about forms: the caller says which day is picked, which days are
// off limits, and what happens on a click.
export function CalendarMonth({
  selected,
  today,
  onSelect,
  isDisabled,
  minDay,
}: {
  selected: string | null;
  /** Kraków today, "YYYY-MM-DD": ringed, and where the calendar opens. */
  today: string;
  onSelect: (day: string) => void;
  isDisabled: (day: string) => boolean;
  /** No arrow back past this day's month. */
  minDay?: string;
}) {
  const t = useTranslations("DateTimePicker");
  const locale = useLocale();
  const fullDate = useFullDateFormat();
  const [view, setView] = useState(monthOf(selected ?? today));
  const atFirstMonth =
    minDay !== undefined && monthIndex(view) <= monthIndex(monthOf(minDay));

  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDay(isoDate(view.year, view.month, 1)));
  const weekdayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    weekdayFormat.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("previousMonth")}
          disabled={atFirstMonth}
          onClick={() => {
            setView(shiftMonth(view.year, view.month, -1));
          }}
        >
          <ChevronLeftIcon />
        </Button>
        <p className="text-sm font-semibold capitalize" aria-live="polite">
          {monthTitle}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("nextMonth")}
          onClick={() => {
            setView(shiftMonth(view.year, view.month, 1));
          }}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <span
            key={weekday}
            aria-hidden
            className="pb-1 text-xs text-muted-foreground capitalize"
          >
            {weekday}
          </span>
        ))}
        {monthGrid(view.year, view.month)
          .flat()
          .map((day, i) => {
            if (!day) {
              return <span key={`blank-${String(i)}`} />;
            }
            const isSelected = day === selected;
            const disabled = isDisabled(day);
            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={fullDate.format(utcDay(day))}
                onClick={() => {
                  onSelect(day);
                }}
                className={cn(
                  "mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : disabled
                      ? "text-muted-foreground/40"
                      : "hover:bg-secondary",
                  !isSelected && day === today && "ring-1 ring-primary",
                )}
              >
                {Number(day.slice(8, 10))}
              </button>
            );
          })}
      </div>
    </div>
  );
}
