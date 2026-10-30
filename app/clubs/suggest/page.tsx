import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { submitClub } from "@/app/clubs/suggest/actions";
import { ClubSubmissionForm } from "@/components/club-submission-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SuggestClubPage");
  return { title: t("title") };
}

// Public, like /clubs itself — anyone can read the form; submitClub() (M.4)
// is what actually requires a signed-in, onboarded player.
export default async function SuggestClubPage() {
  const t = await getTranslations("SuggestClubPage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">{t("subtitle")}</p>
      <ClubSubmissionForm action={submitClub} />
      <Link
        href="/"
        className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
      >
        {t("cancel")}
      </Link>
    </main>
  );
}
