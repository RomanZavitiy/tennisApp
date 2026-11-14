"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type Ref } from "react";

import { CalendarMonth, utcDay } from "@/components/calendar-month";
import { DateTimePicker } from "@/components/date-time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { splitLocal, type SlotRange } from "@/lib/offers/date-time-picker";
import { cn } from "@/lib/utils";

// Compact date fields: a button that looks like an input and opens the
// shared calendar in a popover. They replace <input type="date"> and
// "datetime-local" wherever a full inline picker (the offer form) would take
// too much room: the feed filters, "looking for a game", the club panel.
// With `name` they also render a hidden input, so a plain GET form (the
// filters) or a FormData read (the club panel) keeps working unchanged.

// "Fri, 20 Nov" / "pt., 20 lis": short enough for a filter column. The
// calendar's own buttons keep the full date for screen readers.
function useShortDateFormat(): Intl.DateTimeFormat {
  const locale = useLocale();
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const TRIGGER_CLASS =
  "flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

/** A day, "YYYY-MM-DD" or "" for none. */
export function DateField({
  id,
  name,
  value: controlled,
  defaultValue = "",
  onChange,
  today,
  disablePast = true,
  placeholder,
  clearable = false,
  invalid,
  describedBy,
  triggerRef,
}: {
  id: string;
  /** Renders a hidden input with this name, for plain forms. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Kraków today, "YYYY-MM-DD". */
  today: string;
  /** No day before today (every field this replaces so far). */
  disablePast?: boolean;
  placeholder: string;
  /** Offers a way back to "" (a filter's "any day"). */
  clearable?: boolean;
  invalid?: boolean;
  describedBy?: string | undefined;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const t = useTranslations("DateTimePicker");
  const shortDate = useShortDateFormat();
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const day = splitLocal(value).date;

  function change(next: string) {
    setUncontrolled(next);
    onChange?.(next);
  }

  return (
    <div className="flex items-center gap-1">
      {name && <input type="hidden" name={name} value={day ?? ""} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          ref={triggerRef}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={TRIGGER_CLASS}
        >
          <CalendarIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span
            className={cn(
              "truncate first-letter:uppercase",
              !day && "text-muted-foreground",
            )}
          >
            {day ? shortDate.format(utcDay(day)) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          <CalendarMonth
            selected={day}
            today={today}
            minDay={disablePast ? today : undefined}
            isDisabled={(d) => disablePast && d < today}
            onSelect={(d) => {
              change(d);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && day && (
        <button
          type="button"
          aria-label={t("clearDate")}
          onClick={() => {
            change("");
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

/** A day and a time, Kraków "YYYY-MM-DDTHH:mm" or "" until both are picked. */
export function DateTimeField({
  id,
  name,
  label,
  earliest,
  placeholder,
  slots,
}: {
  id: string;
  /** The hidden input's name, read back from the form's FormData. */
  name: string;
  label: string;
  /** Kraków time now, "YYYY-MM-DDTHH:mm". */
  earliest: string;
  placeholder: string;
  slots?: SlotRange;
}) {
  const shortDate = useShortDateFormat();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { date, time } = splitLocal(value);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id={id} className={TRIGGER_CLASS}>
          <CalendarIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span
            className={cn(
              "truncate first-letter:uppercase",
              !value && "text-muted-foreground",
            )}
          >
            {date && time
              ? `${shortDate.format(utcDay(date))} · ${time}`
              : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-[min(24rem,calc(100vw-2rem))]">
          <DateTimePicker
            bare
            value={value}
            onChange={(next) => {
              setValue(next);
              if (next) {
                setOpen(false);
              }
            }}
            earliest={earliest}
            label={label}
            slots={slots}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
