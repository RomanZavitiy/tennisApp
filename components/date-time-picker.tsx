"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type Ref } from "react";

import { Button } from "@/components/ui/button";
import {
  isPastDay,
  isPastSlot,
  joinLocal,
  monthGrid,
  partOfDay,
  shiftMonth,
  splitLocal,
  timeSlots,
} from "@/lib/offers/date-time-picker";
import { cn } from "@/lib/utils";

const PARTS = ["morning", "afternoon", "evening"] as const;

// The offer form's start time. It replaces <input type="datetime-local">,
// whose look and 12/24-hour clock came from the browser, not the site, so
// Polish players could get AM/PM. This is a month calendar (Monday first,
// names in the site's language) plus half-hour chips on a 24-hour clock.
// The value is the same Kraków "YYYY-MM-DDTHH:mm" string as before, and ""
// until both a day and a time are picked. Day math lives in
// lib/offers/date-time-picker.ts.
export function DateTimePicker({
  value,
  onChange,
  earliest,
  label,
  invalid,
  describedBy,
  groupRef,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Kraków time now, "YYYY-MM-DDTHH:mm": nothing at or before it can be picked. */
  earliest: string;
  label: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  /** Lets the form move focus here when the field has an error. */
  groupRef?: Ref<HTMLDivElement>;
}) {
  const t = useTranslations("DateTimePicker");
  const locale = useLocale();
  const initial = splitLocal(value);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const today = earliest.slice(0, 10);
  const shown = date ?? today;
  const [view, setView] = useState({
    year: Number(shown.slice(0, 4)),
    month: Number(shown.slice(5, 7)),
  });

  const firstMonth = {
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  };
  const atFirstMonth =
    view.year * 12 + view.month <= firstMonth.year * 12 + firstMonth.month;

  // All formatting in UTC on UTC-midnight dates: the strings are already
  // Kraków days, so no time zone may move them.
  const utc = (day: string) => new Date(`${day}T00:00:00Z`);
  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    utc(`${String(view.year)}-${String(view.month).padStart(2, "0")}-01`),
  );
  const weekdayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    weekdayFormat.format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const fullDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  function choose(nextDate: string | null, nextTime: string | null) {
    // A day change can leave the chosen time in the past (today, earlier
    // than now): drop it rather than send a time the server will refuse.
    const keptTime =
      nextDate && nextTime && isPastSlot(nextDate, nextTime, earliest)
        ? null
        : nextTime;
    setDate(nextDate);
    setTime(keptTime);
    onChange(joinLocal(nextDate, keptTime));
  }

  const slots = timeSlots(time);

  return (
    <div
      ref={groupRef}
      tabIndex={-1}
      role="group"
      aria-label={label}
      // A group can't be aria-invalid; the error text is linked instead.
      aria-describedby={describedBy}
      className={cn(
        "space-y-4 rounded-xl border bg-card p-3 outline-none sm:p-4",
        invalid && "border-destructive",
      )}
    >
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
              const selected = day === date;
              const past = isPastDay(day, earliest);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  aria-pressed={selected}
                  aria-label={fullDate.format(utc(day))}
                  onClick={() => {
                    choose(day, time);
                  }}
                  className={cn(
                    "mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : past
                        ? "text-muted-foreground/40"
                        : "hover:bg-secondary",
                    !selected && day === today && "ring-1 ring-primary",
                  )}
                >
                  {Number(day.slice(8, 10))}
                </button>
              );
            })}
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        {PARTS.map((part) => {
          const partSlots = slots.filter((slot) => partOfDay(slot) === part);
          return (
            <div key={part}>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t(part)}
              </p>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {partSlots.map((slot) => {
                  const selected = slot === time;
                  const past = date ? isPastSlot(date, slot, earliest) : false;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={past}
                      aria-pressed={selected}
                      onClick={() => {
                        choose(date, slot);
                      }}
                      className={cn(
                        "rounded-lg border py-1.5 text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary font-semibold text-primary-foreground"
                          : past
                            ? "text-muted-foreground/40"
                            : "hover:border-primary hover:bg-secondary",
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="border-t pt-3 text-sm" aria-live="polite">
        {date && time ? (
          <span className="block font-medium first-letter:uppercase">
            {fullDate.format(utc(date))} · {time}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {date ? t("pickTime") : time ? t("pickDay") : t("pickBoth")}
          </span>
        )}
      </p>
    </div>
  );
}
