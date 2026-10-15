import type { useFormatter } from "next-intl";

// Offer times as people enter them: wall-clock time in Kraków, the
// "YYYY-MM-DDTHH:mm" string an <input type="datetime-local"> gives. The
// database stores the instant in UTC (task 3.2); these turn one into the
// other without depending on the server's or the browser's time zone.

const LOCAL_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const krakowParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Warsaw",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** The Kraków wall-clock time of an instant, as "YYYY-MM-DDTHH:mm". */
export function toKrakowLocal(date: Date): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    krakowParts.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

/**
 * The instant a Kraków wall-clock time means, or null when there is no such
 * time: a malformed string, a date like 30 February, or the hour skipped when
 * clocks go forward in March. Kraków is UTC+2 in summer and UTC+1 in winter,
 * so one of the two offsets is right; checking +2 first means the hour that
 * repeats in October is read as the first one (still summer time).
 */
export function krakowLocalToDate(local: string): Date | null {
  if (!LOCAL_FORMAT.test(local)) {
    return null;
  }
  const asIfUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asIfUtc)) {
    return null;
  }
  for (const offsetHours of [2, 1]) {
    const candidate = new Date(asIfUtc - offsetHours * 3_600_000);
    if (toKrakowLocal(candidate) === local) {
      return candidate;
    }
  }
  return null;
}

type Formatter = ReturnType<typeof useFormatter>;

/**
 * How an offer's start reads on the page, in Kraków time: "Tue 20 Oct,
 * 18:00" in English, "wt, 20 paź, 18:00" in Polish (task 1.20) — `format`
 * is a next-intl formatter (useFormatter/getFormatter), already scoped to
 * Europe/Warsaw by i18n/request.ts, so only the language varies here.
 */
export function formatKrakowTime(format: Formatter, date: Date): string {
  return format.dateTime(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
