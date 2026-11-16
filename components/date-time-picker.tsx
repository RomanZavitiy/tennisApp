"use client";

import { useTranslations } from "next-intl";
import { useState, type Ref } from "react";

import {
  CalendarMonth,
  useFullDateFormat,
  utcDay,
} from "@/components/calendar-month";
import {
  isPastDay,
  isPastSlot,
  joinLocal,
  OFFER_SLOTS,
  partOfDay,
  splitLocal,
  timeSlots,
  type SlotRange,
} from "@/lib/offers/date-time-picker";
import { cn } from "@/lib/utils";

const PARTS = ["morning", "afternoon", "evening"] as const;

// A day and a start time: the offer form's start, and (inside
// DateTimeField) the club panel's block times. It replaces
// <input type="datetime-local">, whose look and 12/24-hour clock came from
// the browser, not the site, so Polish players could get AM/PM. This is a
// month calendar (CalendarMonth) plus half-hour chips on a 24-hour clock.
// The value is a Kraków "YYYY-MM-DDTHH:mm" string, "" until both a day and
// a time are picked. Day math lives in lib/offers/date-time-picker.ts.
export function DateTimePicker({
  value,
  onChange,
  earliest,
  label,
  invalid,
  describedBy,
  groupRef,
  slots: range = OFFER_SLOTS,
  bare = false,
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
  /** Which times are offered; an offer's start by default. */
  slots?: SlotRange;
  /** Without its own border, for use inside a popover. */
  bare?: boolean;
}) {
  const t = useTranslations("DateTimePicker");
  const fullDate = useFullDateFormat();
  const initial = splitLocal(value);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const today = earliest.slice(0, 10);

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

  const slots = timeSlots(time, range);

  return (
    <div
      ref={groupRef}
      tabIndex={-1}
      role="group"
      aria-label={label}
      // A group can't be aria-invalid; the error text is linked instead.
      aria-describedby={describedBy}
      className={cn(
        "space-y-4 outline-none",
        !bare && "rounded-2xl border bg-card p-3 sm:p-4",
        invalid && "border-destructive",
      )}
    >
      <CalendarMonth
        selected={date}
        today={today}
        minDay={today}
        isDisabled={(day) => isPastDay(day, earliest, range)}
        onSelect={(day) => {
          choose(day, time);
        }}
      />

      <div className="space-y-3 border-t pt-3">
        {PARTS.map((part) => {
          const partSlots = slots.filter((slot) => partOfDay(slot) === part);
          if (partSlots.length === 0) {
            return null;
          }
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
            {fullDate.format(utcDay(date))} · {time}
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
