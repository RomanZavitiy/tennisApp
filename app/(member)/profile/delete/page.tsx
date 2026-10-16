import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { deleteMyAccount } from "@/app/(member)/profile/delete/actions";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("DeleteAccountPage");
  return { title: t("title") };
}

// One dedicated page is the confirmation step — same weight as /consent's
// single-button form, no modal or type-to-confirm (task 6.15, decision
// 2026-10-16).
export default async function DeleteAccountPage() {
  await requireOnboardedUser();
  const t = await getTranslations("DeleteAccountPage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("intro")}</p>
      <p className="mt-3 text-sm font-medium text-destructive">
        {t("warning")}
      </p>
      <form action={deleteMyAccount} className="mt-6">
        <Button type="submit" variant="destructive" className="w-full">
          {t("confirmButton")}
        </Button>
      </form>
    </main>
  );
}
