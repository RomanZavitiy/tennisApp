import type { Metadata } from "next";
import Link from "next/link";

import {
  blockFromReport,
  dismissReport,
  hideReport,
  unblockPlayer,
} from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin-action-form";
import { getBlockedPlayers, getOpenReports } from "@/lib/admin/queue";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { REPORT_REASON_LABELS } from "@/lib/moderation/report-labels";

export const metadata: Metadata = { title: "Admin · Reports" };

// The reports tab of the admin queue (task 6.3): open reports (dismiss /
// hide / block) and, separately, who's currently blocked (unblock) —
// unblocking isn't about any one report, so it isn't a button on a report
// row (see unblockPlayer's own comment).
export default async function AdminReportsPage() {
  const [reports, blockedPlayers] = await Promise.all([
    getOpenReports(),
    getBlockedPlayers(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold">
          Blocked players ({String(blockedPlayers.length)})
        </h2>
        {blockedPlayers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nobody is blocked.
          </p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {blockedPlayers.map((player) => (
              <li key={player.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/players/${player.id}`}
                      className="font-medium hover:underline"
                    >
                      {player.name ?? "A player"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Blocked since {formatKrakowTime(player.blockedAt)}
                    </p>
                  </div>
                </div>
                <AdminActionForm
                  actions={[
                    {
                      key: "unblock",
                      label: "Unblock",
                      pendingLabel: "Unblocking…",
                      variant: "outline",
                      run: unblockPlayer.bind(null, player.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">
          Open reports ({String(reports.length)})
        </h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing waiting.</p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {reports.map((report) => (
              <li key={report.id} className="px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {formatKrakowTime(report.createdAt)} ·{" "}
                  <Link
                    href={`/players/${report.reporter.id}`}
                    className="hover:underline"
                  >
                    {report.reporter.name ?? "A player"}
                  </Link>{" "}
                  reported{" "}
                  <Link
                    href={`/players/${report.targetUser.id}`}
                    className="hover:underline"
                  >
                    {report.targetUser.name ?? "a player"}
                  </Link>
                </p>
                <p className="mt-1 font-medium">
                  {REPORT_REASON_LABELS[report.reason]}
                </p>
                {report.comment && (
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {report.comment}
                  </p>
                )}
                {report.offer && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    About the offer:{" "}
                    <Link
                      href={`/offers/${report.offer.id}`}
                      className="hover:underline"
                    >
                      {formatKrakowTime(report.offer.startsAt)}
                    </Link>
                  </p>
                )}
                {report.message && (
                  <p className="mt-1 rounded bg-muted p-2 text-sm whitespace-pre-line">
                    {report.message.content}
                  </p>
                )}
                <AdminActionForm
                  actions={[
                    {
                      key: "dismiss",
                      label: "Dismiss",
                      pendingLabel: "Dismissing…",
                      variant: "outline",
                      run: dismissReport.bind(null, report.id),
                    },
                    ...(report.offer || report.message
                      ? [
                          {
                            key: "hide",
                            label: report.offer
                              ? "Cancel the offer"
                              : "Remove the message",
                            pendingLabel: "Hiding…",
                            variant: "outline" as const,
                            run: hideReport.bind(null, report.id),
                          },
                        ]
                      : []),
                    {
                      key: "block",
                      label: "Block player",
                      pendingLabel: "Blocking…",
                      run: blockFromReport.bind(null, report.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
