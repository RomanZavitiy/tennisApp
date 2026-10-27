import { cn } from "cn";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { BookingGrid } from "@/components/booking-grid";
import { BookingSummaryCard } from "@/components/booking-summary-card";
import { canFit, type SlotStatus } from "@/lib/booking/availability";
import { getDayGrid, type DayGridCourt } from "@/lib/booking/get-day-grid";
import { visibleRange } from "@/lib/booking/grid-layout";
import {
  BOOKING_DURATIONS,
  isBookingDuration,
  type BookingDuration,
} from "@/lib/validation/booking";
import { todayInKrakow } from "@/lib/validation/profile";

// The court × time grid (K.8, redesigned K.23-K.25 as slice K v2): entirely
// server-rendered — every choice (date, duration, court, start) lives in the
// URL, so there's no client fetching and the page works with JS off except
// for the "Send request" button itself (BookingSummaryCard, K.11). The grid
// itself (courts as columns, time as rows) lives in BookingGrid; this page
// is URL parsing, data loading, and the "closed this day" / "no courts"
// branches around it.

type BookPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DAYS_AHEAD = 14; // today + 13

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function dateOptions(today: string): string[] {
  return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
}

function parseDate(
  raw: string | string[] | undefined,
  valid: string[],
): string {
  return typeof raw === "string" && valid.includes(raw) ? raw : valid[0];
}

function parseDuration(raw: string | string[] | undefined): BookingDuration {
  const value = typeof raw === "string" ? Number(raw) : NaN;
  return isBookingDuration(value) ? value : BOOKING_DURATIONS[0];
}

function single(raw: string | string[] | undefined): string | undefined {
  return typeof raw === "string" && raw !== "" ? raw : undefined;
}

type Params = {
  date: string;
  duration: string;
  court?: string;
  start?: string;
  tab?: string;
  offerId?: string;
};

function hrefWith(current: Params, overrides: Partial<Params>): string {
  const merged = { ...current, ...overrides };
  const qs = new URLSearchParams();
  for (const key of [
    "date",
    "duration",
    "court",
    "start",
    "tab",
    "offerId",
  ] as const) {
    const value = merged[key];
    if (value) qs.set(key, value);
  }
  return `?${qs.toString()}`;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const t = await getTranslations("BookPage");
  const { id } = await params;
  const day = await getDayGrid(id, todayInKrakow());
  return { title: day ? t("title", { club: day.club.name }) : t("notFound") };
}

export default async function BookPage({
  params,
  searchParams,
}: BookPageProps) {
  // The grid depends on "now" (PAST slots) and on bookings made moments ago;
  // never serve a cached page.
  await connection();
  const { id } = await params;
  const rawParams = await searchParams;

  const today = todayInKrakow();
  const validDates = dateOptions(today);
  const date = parseDate(rawParams.date, validDates);
  const duration = parseDuration(rawParams.duration);

  const now = new Date();
  const day = await getDayGrid(id, date, now);
  if (!day) {
    notFound();
  }

  const t = await getTranslations("BookPage");
  const tSurface = await getTranslations("Surface");
  const format = await getFormatter();

  const current: Params = {
    date,
    duration: String(duration),
    court: single(rawParams.court),
    start: single(rawParams.start),
    tab: single(rawParams.tab),
    offerId: single(rawParams.offerId),
  };

  const selectedCourt = current.court
    ? day.courts.find((c) => c.id === current.court)
    : undefined;
  const selectedStart =
    selectedCourt && current.start ? new Date(current.start) : undefined;
  const fits =
    selectedCourt && selectedStart
      ? canFit(day.grid, selectedCourt.id, selectedStart, duration)
      : false;

  const activeCourtId =
    (current.tab && day.courts.some((c) => c.id === current.tab)
      ? current.tab
      : undefined) ??
    selectedCourt?.id ??
    day.courts[0]?.id;

  const timeRangeLabel = (start: Date, end: Date): string => {
    const startLabel = format.dateTime(start, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    if (end.getTime() - start.getTime() <= 30 * 60_000) return startLabel;
    const endLabel = format.dateTime(end, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    return `${startLabel}–${endLabel}`;
  };

  const slotAriaLabel = (
    court: DayGridCourt,
    start: Date,
    end: Date,
    status: SlotStatus,
  ): string =>
    t("slotAriaLabel", {
      court: court.name,
      time: timeRangeLabel(start, end),
      status: t(`status${status}` as const),
    });

  const slotHref = (court: DayGridCourt, start: Date): string =>
    hrefWith(current, {
      court: court.id,
      start: start.toISOString(),
      tab: court.id,
    });

  const tabHref = (courtId: string): string =>
    hrefWith(current, { tab: courtId });

  const range = day.courts.length > 0 ? visibleRange(day.grid) : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href={`/clubs/${id}`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← {day.club.name}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {t("title", { club: day.club.name })}
      </h1>

      <nav
        aria-label={t("dateLabel")}
        className="mt-4 flex gap-1 overflow-x-auto pb-1"
      >
        {validDates.map((d) => (
          <Link
            key={d}
            href={hrefWith(current, { date: d })}
            aria-current={d === date ? "date" : undefined}
            className={cn(
              "shrink-0 rounded-md border px-2.5 py-1.5 text-sm",
              d === date
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {format.dateTime(new Date(`${d}T00:00:00Z`), {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("durationLabel")}</span>
        {BOOKING_DURATIONS.map((minutes) => (
          <Link
            key={minutes}
            href={hrefWith(current, { duration: String(minutes) })}
            aria-current={minutes === duration ? "true" : undefined}
            className={cn(
              "rounded-md border px-2 py-1",
              minutes === duration
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {t("durationOption", { minutes })}
          </Link>
        ))}
      </div>

      {day.courts.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t("noCourts")}</p>
      ) : range === null ? (
        <p className="mt-6 text-muted-foreground">{t("closedAllDay")}</p>
      ) : (
        <BookingGrid
          day={day}
          range={range}
          t={t}
          tSurface={tSurface}
          format={format}
          duration={duration}
          selectedCourt={selectedCourt}
          selectedStart={selectedStart}
          fits={fits}
          activeCourtId={activeCourtId}
          now={now}
          isToday={date === today}
          slotHref={slotHref}
          tabHref={tabHref}
          slotAriaLabel={slotAriaLabel}
        />
      )}

      {selectedCourt && selectedStart && (
        <div className="max-w-sm">
          <BookingSummaryCard
            clubName={day.club.name}
            court={selectedCourt}
            startsAt={selectedStart}
            duration={duration}
            fits={fits}
            offerId={current.offerId}
          />
        </div>
      )}
    </main>
  );
}
