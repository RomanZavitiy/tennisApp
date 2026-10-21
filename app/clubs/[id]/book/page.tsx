import { cn } from "cn";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  canFit,
  type CourtDayGrid,
  type DaySlot,
  type SlotStatus,
} from "@/lib/booking/availability";
import { getDayGrid, type DayGridCourt } from "@/lib/booking/get-day-grid";
import {
  BOOKING_DURATIONS,
  isBookingDuration,
  type BookingDuration,
} from "@/lib/validation/booking";
import { todayInKrakow } from "@/lib/validation/profile";

// The read-only court × time grid (K.8, slice K): twojtenis-style, entirely
// server-rendered — every choice (date, duration, court, start) lives in the
// URL, so there's no client fetching and the page works with JS off. Sending
// a request isn't wired up yet (K.10); the button here is a placeholder.

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
};

function hrefWith(current: Params, overrides: Partial<Params>): string {
  const merged = { ...current, ...overrides };
  const qs = new URLSearchParams();
  for (const key of ["date", "duration", "court", "start", "tab"] as const) {
    const value = merged[key];
    if (value) qs.set(key, value);
  }
  return `?${qs.toString()}`;
}

const STATUS_STYLE: Record<SlotStatus, string> = {
  FREE: "border-primary/50 bg-background text-foreground hover:bg-primary/10 hover:border-primary",
  TAKEN: "border-border bg-muted text-muted-foreground",
  PAST: "border-border/60 bg-muted/40 text-muted-foreground/50",
  CLOSED:
    "border-dashed border-border/50 bg-transparent text-muted-foreground/30",
};

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

  const day = await getDayGrid(id, date);
  if (!day) {
    notFound();
  }

  const t = await getTranslations("BookPage");
  const format = await getFormatter();

  const current: Params = {
    date,
    duration: String(duration),
    court: single(rawParams.court),
    start: single(rawParams.start),
    tab: single(rawParams.tab),
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

  const slotAriaLabel = (court: DayGridCourt, slot: DaySlot): string =>
    t("slotAriaLabel", {
      court: court.name,
      time: format.dateTime(slot.start, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
      status: t(`status${slot.status}` as const),
    });

  const slotHref = (court: DayGridCourt, slot: DaySlot): string =>
    hrefWith(current, {
      court: court.id,
      start: slot.start.toISOString(),
      tab: court.id,
    });

  const gridFor = (courtId: string): CourtDayGrid | undefined =>
    day.grid.find((c) => c.courtId === courtId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
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
      ) : (
        <>
          {/* Desktop/tablet: full grid, courts as rows. */}
          <div className="mt-6 hidden overflow-x-auto sm:block">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background pr-2 text-left text-sm font-medium">
                    {t("courtLabel")}
                  </th>
                  {gridFor(day.courts[0].id)?.slots.map((slot) => (
                    <th
                      key={slot.start.toISOString()}
                      className="w-9 px-0.5 pb-1 text-center text-[0.65rem] font-normal text-muted-foreground"
                    >
                      {format.dateTime(slot.start, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {day.courts.map((court) => (
                  <tr key={court.id}>
                    <td className="sticky left-0 bg-background pr-2 text-sm font-medium whitespace-nowrap">
                      {court.name}
                    </td>
                    {gridFor(court.id)?.slots.map((slot) => {
                      const isSelected =
                        selectedCourt?.id === court.id &&
                        selectedStart?.getTime() === slot.start.getTime();
                      const style = cn(
                        "block size-7 rounded border",
                        STATUS_STYLE[slot.status],
                        isSelected && "ring-2 ring-primary",
                      );
                      return (
                        <td key={slot.start.toISOString()} className="p-0.5">
                          {slot.status === "FREE" ? (
                            <Link
                              href={slotHref(court, slot)}
                              aria-label={slotAriaLabel(court, slot)}
                              className={style}
                            />
                          ) : (
                            <span
                              aria-label={slotAriaLabel(court, slot)}
                              className={style}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: courts as tabs, slots as a vertical list. */}
          <div className="mt-6 sm:hidden">
            <div
              role="tablist"
              aria-label={t("courtLabel")}
              className="flex gap-1 overflow-x-auto pb-2"
            >
              {day.courts.map((court) => (
                <Link
                  key={court.id}
                  role="tab"
                  aria-selected={court.id === activeCourtId}
                  href={hrefWith(current, { tab: court.id })}
                  className={cn(
                    "shrink-0 rounded-md border px-3 py-1.5 text-sm",
                    court.id === activeCourtId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {court.name}
                </Link>
              ))}
            </div>
            {activeCourtId && (
              <ul className="mt-2 space-y-1">
                {gridFor(activeCourtId)?.slots.map((slot) => {
                  const court = day.courts.find((c) => c.id === activeCourtId);
                  if (!court) return null;
                  const isSelected =
                    selectedCourt?.id === court.id &&
                    selectedStart?.getTime() === slot.start.getTime();
                  const style = cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                    STATUS_STYLE[slot.status],
                    isSelected && "ring-2 ring-primary",
                  );
                  const time = format.dateTime(slot.start, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hourCycle: "h23",
                  });
                  const label = t(`status${slot.status}` as const);
                  return (
                    <li key={slot.start.toISOString()}>
                      {slot.status === "FREE" ? (
                        <Link
                          href={slotHref(court, slot)}
                          aria-label={slotAriaLabel(court, slot)}
                          className={style}
                        >
                          <span>{time}</span>
                          <span>{label}</span>
                        </Link>
                      ) : (
                        <span
                          aria-label={slotAriaLabel(court, slot)}
                          className={style}
                        >
                          <span>{time}</span>
                          <span>{label}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(["FREE", "TAKEN", "PAST", "CLOSED"] as const).map((status) => (
              <li key={status} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "block size-3 rounded border",
                    STATUS_STYLE[status],
                  )}
                />
                {t(`status${status}` as const)}
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedCourt && selectedStart && (
        <section className="mt-6 rounded-lg border p-4">
          <h2 className="font-semibold">{t("summaryTitle")}</h2>
          {fits ? (
            <>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("summaryClub")}</dt>
                  <dd className="text-right font-medium">{day.club.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("summaryCourt")}</dt>
                  <dd className="text-right font-medium">
                    {selectedCourt.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("summaryDate")}</dt>
                  <dd className="text-right font-medium">
                    {format.dateTime(new Date(`${date}T00:00:00Z`), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("summaryTime")}</dt>
                  <dd className="text-right font-medium">
                    {format.dateTime(selectedStart, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hourCycle: "h23",
                    })}
                    –
                    {format.dateTime(
                      new Date(selectedStart.getTime() + duration * 60_000),
                      { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
                    )}
                  </dd>
                </div>
                {selectedCourt.pricePerHourPln != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t("summaryPrice")}
                    </dt>
                    <dd className="text-right font-medium">
                      {t("pricePerHour", {
                        price: selectedCourt.pricePerHourPln,
                      })}
                    </dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-lg border border-transparent bg-primary/50 px-2.5 py-2 text-sm font-medium text-primary-foreground"
              >
                {t("sendRequest")}
              </button>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("comingSoon")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("doesntFit", { duration })}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
