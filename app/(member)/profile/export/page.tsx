import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ExportDataButton } from "@/components/export-data-button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ExportDataPage");
  return { title: t("title") };
}

export default async function ExportDataPage() {
  await requireOnboardedUser();
  const t = await getTranslations("ExportDataPage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("intro")}</p>
      <div className="mt-6">
        <ExportDataButton />
      </div>
    </main>
  );
}
