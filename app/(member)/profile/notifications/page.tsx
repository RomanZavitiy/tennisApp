import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { NotificationSettingsForm } from "@/components/notification-settings-form";
import { PushSubscribeControl } from "@/components/push-subscribe-control";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotificationSettingsPage");
  return { title: t("title") };
}

// The three switches (task 5.3) plus the push on/off control (5.15). The
// settings themselves aren't part of requireOnboardedUser()'s own select —
// most pages don't need them — so this page reads them itself.
export default async function NotificationSettingsPage() {
  const user = await requireOnboardedUser();
  const settings = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      notifyMatches: true,
      notifyNewOffers: true,
      notifyEmailFallback: true,
    },
  });
  const t = await getTranslations("NotificationSettingsPage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="mt-6">
        <PushSubscribeControl />
      </div>
      <div className="mt-8">
        <NotificationSettingsForm settings={settings} />
      </div>
      <Link
        href="/profile"
        className={buttonVariants({
          variant: "outline",
          className: "mt-8 w-full",
        })}
      >
        {t("backToProfile")}
      </Link>
    </main>
  );
}
