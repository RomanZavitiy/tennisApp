"use client";

import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { unreadNotificationCount } from "@/app/(member)/notifications/actions";
import { buttonVariants } from "@/components/ui/button";

/** Fired after notifications are marked read, so the bell recounts at once. */
export const NOTIFICATIONS_CHANGED_EVENT = "notifications-changed";

const REFRESH_MS = 60_000;

// The header bell (slice K2b). The root layout isn't re-rendered on client
// navigation, so the count the server rendered would go stale: the bell
// recounts itself on every page change, every minute, and whenever a page
// marks notifications read.
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const t = useTranslations("NotificationBell");
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void unreadNotificationCount().then((unread) => {
        if (active) {
          setCount(unread);
        }
      });
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [pathname]);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? t("labelUnread", { count }) : t("label")}
      className={buttonVariants({
        variant: "ghost",
        size: "icon",
        className: "relative",
      })}
    >
      <BellIcon />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
