import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SplitShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFoundPage");
  return { title: t("title") };
}

// Every notFound() in the app lands here: an offer that was removed, a
// deleted player's profile, a hidden section (lib/features.ts), a mistyped
// link. Inside the root layout, so the header and the sport switch stay and
// the player has a way back instead of Next.js's bare 404.
export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <SplitShell className="text-center">
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("body")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/offers" className={buttonVariants()}>
          {t("offers")}
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("home")}
        </Link>
      </div>
    </SplitShell>
  );
}
