import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SplitShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AccountDeletedPage");
  return { title: t("title") };
}

// Redirect target after /profile/delete (task 6.15). Public — the session is
// already gone by the time a player lands here (see lib/auth/routes.ts).
export default async function AccountDeletedPage() {
  const t = await getTranslations("AccountDeletedPage");

  return (
    <SplitShell className="text-center">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("body")}</p>
      <Link
        href="/"
        className={buttonVariants({ variant: "outline", className: "mt-6" })}
      >
        {t("home")}
      </Link>
    </SplitShell>
  );
}
