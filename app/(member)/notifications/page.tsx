import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import { requireUser } from "@/lib/auth/require-user";
import { listNotifications } from "@/lib/notifications/inbox";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import { placeLabel } from "@/lib/offers/offer-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotificationsPage");
  return { title: t("title") };
}

// The list behind the header bell (slice K2b): every event notify() recorded,
// newest first, each linking to its offer. Unread ones are marked as they
// were when the page was rendered; MarkNotificationsRead then clears them,
// so the next visit shows them as read.
export default async function NotificationsPage() {
  await connection();
  const user = await requireUser();
  const notifications = await listNotifications(user.id);
  const t = await getTranslations("NotificationsPage");
  const tKind = await getTranslations("PushNotifications");
  const format = await getFormatter();
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <MarkNotificationsRead />

      {notifications.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((notification) => {
            const unread = notification.readAt === null;
            const { offer } = notification;
            return (
              <li key={notification.id}>
                <Link
                  href={`/offers/${offer.id}`}
                  className={cn(
                    "flex gap-3 rounded-lg border px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                    unread && "border-primary bg-muted/50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 size-2 shrink-0 rounded-full",
                      unread ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn(unread && "font-semibold")}>
                        {tKind(`${notification.kind}.title`)}
                        {unread && (
                          <span className="sr-only"> ({t("unread")})</span>
                        )}
                      </span>
                      <time
                        dateTime={notification.createdAt.toISOString()}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {format.relativeTime(notification.createdAt, now)}
                      </time>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {tKind(`${notification.kind}.body`)}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {[
                        formatKrakowTime(format, offer.startsAt),
                        placeLabel(
                          offer,
                          offer.district
                            ? DISTRICT_LABELS[offer.district]
                            : null,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
