import type {
  CourtDayGrid,
  DaySlot,
  SlotStatus,
} from "@/lib/booking/availability";

// Pure display shaping for the booking grid (K.23, slice K v2 — grid
// redesign). Takes buildDayGrid's output and answers two layout questions a
// React component shouldn't have to: which rows are worth rendering at all,
// and which runs of slots collapse into one cell. No React, no clock, no DB.

export type VisibleRange = { startIndex: number; endIndex: number };

/**
 * The first and last slot index where at least one court isn't CLOSED.
 * `null` when every court is CLOSED for the whole day (hours produced no
 * open window at all) — the page shows a short message instead of a grid.
 * Courts aren't guaranteed to share one CLOSED pattern forever (hours are
 * club-wide today, per-court tomorrow), so this checks every court rather
 * than assuming they line up.
 */
export function visibleRange(grid: CourtDayGrid[]): VisibleRange | null {
  const slotCount = grid.reduce(
    (max, court) => Math.max(max, court.slots.length),
    0,
  );
  let startIndex = -1;
  let endIndex = -1;
  for (let i = 0; i < slotCount; i++) {
    const anyOpen = grid.some((court) => court.slots[i]?.status !== "CLOSED");
    if (anyOpen) {
      if (startIndex === -1) startIndex = i;
      endIndex = i;
    }
  }
  return startIndex === -1 ? null : { startIndex, endIndex };
}

export type SlotRun = {
  status: SlotStatus;
  start: Date;
  end: Date;
  slotCount: number;
};

/**
 * Merges consecutive same-status slots into one run, so a 2h TAKEN block
 * renders as one cell instead of four. FREE is the exception: each FREE
 * slot keeps its own run (slotCount 1), because each one is its own link
 * with its own href — merging them would lose that.
 */
export function runs(slots: DaySlot[]): SlotRun[] {
  const result: SlotRun[] = [];
  for (const slot of slots) {
    const last = result.at(-1);
    const canExtend =
      last !== undefined &&
      slot.status !== "FREE" &&
      last.status === slot.status &&
      last.end.getTime() === slot.start.getTime();
    if (canExtend) {
      last.end = slot.end;
      last.slotCount += 1;
    } else {
      result.push({
        status: slot.status,
        start: slot.start,
        end: slot.end,
        slotCount: 1,
      });
    }
  }
  return result;
}
