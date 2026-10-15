import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { updateProfile } from "@/app/(member)/profile/actions";
import { ProfileForm } from "@/components/profile-form";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("EditProfilePage");
  return { title: t("title") };
}

// The onboarding form again, filled in with the current profile. The photo is
// changed on /profile itself.
export default async function EditProfilePage() {
  const t = await getTranslations("EditProfilePage");
  const profile = await requireOnboardedUser();

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="mt-6">
        <ProfileForm
          action={updateProfile}
          submitLabel={t("submit")}
          defaultValues={{
            name: profile.name,
            birthDate: profile.birthDate.toISOString().slice(0, 10),
            gender: profile.gender,
            district: profile.district,
            selfRatedNtrp: profile.selfRatedNtrp,
          }}
        />
      </div>
      <Link
        href="/profile"
        className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
      >
        {t("cancel")}
      </Link>
    </main>
  );
}
