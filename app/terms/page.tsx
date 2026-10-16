import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("TermsPage");
  return { title: t("title") };
}

// Draft placeholder (task 6.11): the human hasn't supplied real Terms text
// yet. Public — reachable signed out, linked from the footer and from the
// onboarding/consent checkboxes — so visitors can read it before agreeing.
export default async function TermsPage() {
  const t = await getTranslations("TermsPage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="mb-6 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {t("draftNotice")}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("revisedOn", { date: CURRENT_CONSENT_VERSION })}
      </p>
      <p className="mt-6 text-muted-foreground">{t("placeholder")}</p>
    </main>
  );
}
