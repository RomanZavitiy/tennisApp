import { cn } from "cn";
import type { useFormatter } from "next-intl";
import Link from "next/link";

import type { DaySlot, SlotStatus } from "@/lib/booking/availability";
import type { DayGrid, DayGridCourt } from "@/lib/booking/get-day-grid";
import {
  runs,
  type SlotRun,
  type VisibleRange,
} from "@/lib/booking/grid-layout";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import type { BookingDuration } from "@/lib/validation/booking";

// The redesigned court × time grid (K.23-K.25, slice K v2): courts as
// columns, time as rows, so a laptop screen shows a whole working day
// without side-scrolling to reach 08:00 (the old K.8 grid's problem — courts
// as rows meant 48 narrow columns, most of them CLOSED). Pulled out of
// book/page.tsx for the same reason BookingSummaryCard was (AGENTS.md §6's
// 500-line ceiling): this file only renders what getDayGrid + grid-layout's
// visibleRange/runs already computed, no data fetching of its own.

type T = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;
type Formatter = ReturnType<typeof useFormatter>;

const ROW_HEIGHT_PX = 28;

const LEGEND_SWATCH: Record<SlotStatus, string> = {
  FREE: "border border-primary/50 bg-background",
  TAKEN: "booking-taken-stripes border border-border",
  PAST: "border border-border/60 bg-muted/40",
  CLOSED: "border border-dashed border-border/40 bg-transparent",
};

function overlapsRange(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function timeLabel(format: Formatter, date: Date): string {
  return format.dateTime(date, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function BookingGrid({
  day,
  range,
  t,
  tSurface,
  format,
  duration,
  selectedCourt,
  selectedStart,
  fits,
  activeCourtId,
  now,
  isToday,
  slotHref,
  tabHref,
  slotAriaLabel,
}: {
  day: DayGrid;
  range: VisibleRange;
  t: T;
  tSurface: T;
  format: Formatter;
  duration: BookingDuration;
  selectedCourt?: DayGridCourt;
  selectedStart?: Date;
  fits: boolean;
  activeCourtId?: string;
  now: Date;
  isToday: boolean;
  slotHref: (court: DayGridCourt, start: Date) => string;
  tabHref: (courtId: string) => string;
  slotAriaLabel: (
    court: DayGridCourt,
    start: Date,
    end: Date,
    status: SlotStatus,
  ) => string;
}) {
  const visibleCount = range.endIndex - range.startIndex + 1;
  const selectedEnd =
    selectedStart !== undefined
      ? new Date(selectedStart.getTime() + duration * 60_000)
      : undefined;

  const isSelected = (start: Date, end: Date, courtId: string): boolean =>
    selectedCourt?.id === courtId &&
    selectedStart !== undefined &&
    selectedEnd !== undefined &&
    overlapsRange(start, end, selectedStart, selectedEnd);

  const referenceSlots = day.grid[0]?.slots ?? [];
  const rowAt = (i: number): DaySlot | undefined =>
    referenceSlots.at(range.startIndex + i);

  const columns = day.courts.map((court) => {
    const courtGrid = day.grid.find((g) => g.courtId === court.id);
    const visibleSlots = (courtGrid?.slots ?? []).slice(
      range.startIndex,
      range.endIndex + 1,
    );
    const courtRuns = runs(visibleSlots);
    const cellAt: (SlotRun | null)[] = Array.from(
      { length: visibleCount },
      () => null,
    );
    let row = 0;
    for (const run of courtRuns) {
      cellAt[row] = run;
      row += run.slotCount;
    }
    return { court, cellAt };
  });

  let nowRowIndex: number | null = null;
  if (isToday) {
    for (let i = 0; i < visibleCount; i++) {
      const slot = rowAt(i);
      if (
        slot &&
        slot.start.getTime() <= now.getTime() &&
        now.getTime() < slot.end.getTime()
      ) {
        nowRowIndex = i;
        break;
      }
    }
  }

  const renderCell = (court: DayGridCourt, run: SlotRun) => {
    const height = run.slotCount * ROW_HEIGHT_PX;
    const label = slotAriaLabel(court, run.start, run.end, run.status);
    const selected = isSelected(run.start, run.end, court.id);

    if (run.status === "FREE") {
      return (
        <td key={court.id} rowSpan={run.slotCount} className="p-0.5 align-top">
          <Link
            href={slotHref(court, run.start)}
            aria-label={label}
            style={{ height }}
            className={cn(
              "group flex size-full items-center justify-center rounded border border-primary/40 text-[11px] text-muted-foreground hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selected &&
                (fits
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-destructive bg-destructive/10 ring-2 ring-destructive"),
            )}
          >
            <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {timeLabel(format, run.start)}
            </span>
          </Link>
        </td>
      );
    }

    if (run.status === "TAKEN") {
      return (
        <td key={court.id} rowSpan={run.slotCount} className="p-0.5 align-top">
          <span
            aria-label={label}
            style={{ height }}
            className={cn(
              "booking-taken-stripes flex size-full items-center justify-center rounded border border-border text-[11px] text-muted-foreground",
              selected && "ring-2 ring-destructive",
            )}
          >
            {t("takenLabel")}
          </span>
        </td>
      );
    }

    if (run.status === "PAST") {
      return (
        <td key={court.id} rowSpan={run.slotCount} className="p-0.5 align-top">
          <span
            aria-label={label}
            style={{ height }}
            className="block size-full rounded bg-muted/40"
          />
        </td>
      );
    }

    // CLOSED inside the visible range: blank, per K.24.
    return (
      <td key={court.id} rowSpan={run.slotCount} className="p-0.5 align-top">
        <span
          aria-label={label}
          style={{ height }}
          className="block size-full"
        />
      </td>
    );
  };

  const activeCourt = activeCourtId
    ? day.courts.find((c) => c.id === activeCourtId)
    : undefined;
  const activeGrid = activeCourtId
    ? day.grid.find((g) => g.courtId === activeCourtId)
    : undefined;
  const mobileRuns =
    activeCourt && activeGrid
      ? runs(activeGrid.slots.slice(range.startIndex, range.endIndex + 1))
      : [];

  return (
    <>
      {/* Desktop/tablet: courts as columns, time as rows (K.24). */}
      <div className="mt-6 hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-20 w-14 border-b bg-background"
              >
                <span className="sr-only">{t("timeLabel")}</span>
              </th>
              {day.courts.map((court) => (
                <th
                  key={court.id}
                  scope="col"
                  className="sticky top-0 z-10 min-w-[120px] border-b bg-background px-2 py-2 text-left align-bottom font-normal"
                >
                  <div className="text-sm font-medium text-foreground">
                    {court.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      tSurface(court.surface),
                      court.indoor ? t("courtIndoor") : t("courtOutdoor"),
                      court.pricePerHourPln != null
                        ? t("pricePerHour", { price: court.pricePerHourPln })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: visibleCount }, (_, i) => {
              const slot = rowAt(i);
              if (!slot) return null;
              const isHourMark =
                toKrakowLocal(slot.start).slice(14, 16) === "00";
              const isNowRow = nowRowIndex === i;
              return (
                <tr key={slot.start.toISOString()}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 w-14 bg-background pr-2 text-right align-top text-[0.65rem] font-normal text-muted-foreground",
                      isNowRow && "border-t-2 border-t-primary",
                    )}
                    style={{ height: ROW_HEIGHT_PX }}
                  >
                    {isHourMark ? timeLabel(format, slot.start) : null}
                  </th>
                  {columns.map(({ court, cellAt }) => {
                    const run = cellAt[i];
                    if (!run) return null; // covered by an earlier rowSpan
                    return renderCell(court, run);
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: courts as tabs, runs as a vertical list (K.25). */}
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
              href={tabHref(court.id)}
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
        {activeCourt && (
          <ul className="mt-2 space-y-1">
            {mobileRuns.map((run) => {
              const label = slotAriaLabel(
                activeCourt,
                run.start,
                run.end,
                run.status,
              );
              const selected = isSelected(run.start, run.end, activeCourt.id);

              if (run.status === "FREE") {
                return (
                  <li key={run.start.toISOString()}>
                    <Link
                      href={slotHref(activeCourt, run.start)}
                      aria-label={label}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-primary/50 px-3 py-2 text-sm hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected &&
                          (fits
                            ? "ring-2 ring-primary"
                            : "ring-2 ring-destructive"),
                      )}
                    >
                      <span>{timeLabel(format, run.start)}</span>
                      <span className="text-muted-foreground">
                        {t("statusFREE")}
                      </span>
                    </Link>
                  </li>
                );
              }

              const statusWord =
                run.status === "TAKEN"
                  ? t("takenLabel")
                  : t(`status${run.status}` as const);
              return (
                <li key={run.start.toISOString()}>
                  <span
                    aria-label={label}
                    className={cn(
                      "flex items-center rounded-md border px-3 py-2 text-sm",
                      run.status === "TAKEN" &&
                        "booking-taken-stripes border-border text-muted-foreground",
                      run.status === "PAST" &&
                        "border-border/60 bg-muted/40 text-muted-foreground/60",
                      run.status === "CLOSED" &&
                        "border-dashed border-border/40 text-muted-foreground/40",
                      selected && "ring-2 ring-destructive",
                    )}
                  >
                    {t("runRangeLabel", {
                      start: timeLabel(format, run.start),
                      end: timeLabel(format, run.end),
                      status: statusWord,
                    })}
                  </span>
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
              className={cn("block size-3 rounded", LEGEND_SWATCH[status])}
            />
            {t(`status${status}` as const)}
          </li>
        ))}
      </ul>
    </>
  );
}
