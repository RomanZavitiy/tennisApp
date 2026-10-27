import { cn } from "cn";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  addBlock,
  confirmBooking,
  declineBooking,
  removeBlock,
} from "@/app/(club)/club/[clubId]/actions";
import { AddBlockForm } from "@/components/add-block-form";
import { AdminActionForm } from "@/components/admin-action-form";
import {
  blockForSlot,
  bookingForSlot,
  getClubPanelDay,
  getPendingQueue,
} from "@/lib/booking/get-club-panel-data";
import { requireClubStaff } from "@/lib/auth/require-club-staff";
import { db } from "@/lib/db";
import {
  formatKrakowTime,
  formatKrakowTimeRange,
} from "@/lib/offers/krakow-time";
import { todayInKrakow } from "@/lib/validation/profile";

// The club staff panel (K.15-K.17): the PENDING queue, then today's and
// tomorrow's grid so staff see what's coming without picking a date — a
// twojtenis owner checks this once or twice a day, not continuously, so a
// wider date range isn't worth the extra page weight. Every mutation is a
// server action (K.17); this page only reads.

export const metadata: Metadata = { title: "Club panel" };

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export default async function ClubPanelPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  await requireClubStaff(clubId);

  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { name: true },
  });
  const today = todayInKrakow();
  const tomorrow = addDays(today, 1);

  const [pending, todayDay, tomorrowDay] = await Promise.all([
    getPendingQueue(clubId),
    getClubPanelDay(clubId, today),
    getClubPanelDay(clubId, tomorrow),
  ]);
  if (!club || !todayDay || !tomorrowDay) {
    notFound();
  }

  const t = await getTranslations("ClubPanelPage");
  const tBookPage = await getTranslations("BookPage");
  const format = await getFormatter();

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">{club.name}</h1>

      <section>
        <h2 className="font-semibold">
          {t("pendingTitle", { count: pending.length })}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("nothingPending")}
          </p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {pending.map((booking) => (
              <li key={booking.id} className="px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {formatKrakowTime(format, booking.startsAt)}–
                  {formatKrakowTime(format, booking.endsAt)} ·{" "}
                  {booking.courtName}
                </p>
                <p className="mt-1 font-medium">{booking.player}</p>
                {booking.note && (
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {booking.note}
                  </p>
                )}
                <AdminActionForm
                  reasonLabel={t("declineReasonLabel")}
                  actions={[
                    {
                      key: "confirm",
                      label: t("confirm"),
                      pendingLabel: t("confirming"),
                      run: confirmBooking.bind(null, booking.id),
                    },
                    {
                      key: "decline",
                      label: t("decline"),
                      pendingLabel: t("declining"),
                      variant: "outline",
                      run: declineBooking.bind(null, booking.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {[
        { label: t("todayTitle"), day: todayDay },
        { label: t("tomorrowTitle"), day: tomorrowDay },
      ].map(({ label, day }) => (
        <section key={day.date}>
          <h2 className="font-semibold">{label}</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {day.grid.map((courtGrid) => {
                  const court = day.courts.find(
                    (c) => c.id === courtGrid.courtId,
                  );
                  if (!court) return null;
                  return (
                    <tr key={court.id}>
                      <th className="sticky left-0 bg-background pr-3 text-left font-medium whitespace-nowrap">
                        {court.name}
                      </th>
                      {courtGrid.slots.map((slot) => {
                        const booking = bookingForSlot(
                          day.bookings,
                          court.id,
                          slot.start,
                        );
                        const block = blockForSlot(
                          day.blocks,
                          court.id,
                          slot.start,
                        );
                        const time = formatKrakowTime(format, slot.start);
                        const who = booking?.player;
                        return (
                          <td
                            key={slot.start.toISOString()}
                            aria-label={`${tBookPage("slotAriaLabel", {
                              court: court.name,
                              time,
                              status: tBookPage(
                                `status${slot.status}` as const,
                              ),
                            })}${who ? ` — ${who}` : ""}`}
                            title={who ?? block?.reason ?? undefined}
                            className={cn(
                              "min-w-10 border px-1 py-1 text-center text-xs",
                              slot.status === "FREE" && "bg-background",
                              slot.status === "TAKEN" && "bg-accent",
                              (slot.status === "PAST" ||
                                slot.status === "CLOSED") &&
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {who ?? (block ? t("blocked") : "")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-semibold">{t("blocksTitle")}</h3>
            {day.blocks.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("noBlocks")}
              </p>
            ) : (
              <ul className="mt-1 space-y-2">
                {day.blocks.map((block) => {
                  const court = day.courts.find((c) => c.id === block.courtId);
                  return (
                    <li key={block.id} className="text-sm">
                      {court?.name} ·{" "}
                      {formatKrakowTimeRange(
                        format,
                        block.startsAt,
                        (block.endsAt.getTime() - block.startsAt.getTime()) /
                          60_000,
                      )}
                      {block.reason && <> · {block.reason}</>}
                      <AdminActionForm
                        actions={[
                          {
                            key: "remove",
                            label: t("removeBlock"),
                            pendingLabel: t("removingBlock"),
                            variant: "outline",
                            run: removeBlock.bind(null, block.id),
                          },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ))}

      <section>
        <h2 className="font-semibold">{t("addBlockTitle")}</h2>
        <div className="mt-2 max-w-md">
          <AddBlockForm
            courts={todayDay.courts}
            action={addBlock}
            labels={{
              courtLabel: tBookPage("courtLabel"),
              startLabel: t("blockStartLabel"),
              endLabel: t("blockEndLabel"),
              reasonLabel: t("blockReasonLabel"),
              submit: t("addBlock"),
              submitting: t("addingBlock"),
              done: t("blockAdded"),
            }}
          />
        </div>
      </section>
    </div>
  );
}
