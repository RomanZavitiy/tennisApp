import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

import { AvatarUpload } from "@/components/avatar-upload";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFacts } from "@/components/player-facts";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ageOn, todayInKrakow } from "@/lib/validation/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ProfilePage");
  return { title: t("title") };
}

// The player's own profile with their photo; the other fields are edited on
// /profile/edit. The birth date stays private: only the age is shown.
export default async function ProfilePage() {
  const t = await getTranslations("ProfilePage");
  const profile = await requireOnboardedUser();
  const age = ageOn(
    profile.birthDate.toISOString().slice(0, 10),
    todayInKrakow(),
  );

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <div className="flex items-center gap-4">
        <PlayerAvatar name={profile.name} avatarPath={profile.avatarPath} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.name}
        </h1>
      </div>
      <div className="mt-4">
        <AvatarUpload userId={profile.id} />
      </div>
      <div className="mt-6">
        <PlayerFacts
          age={age}
          district={profile.district}
          selfRatedNtrp={profile.selfRatedNtrp}
        />
      </div>
      <Link
        href="/profile/edit"
        className={buttonVariants({
          variant: "outline",
          className: "mt-6 w-full",
        })}
      >
        {t("editProfile")}
      </Link>
      <Link
        href="/profile/notifications"
        className={buttonVariants({
          variant: "outline",
          className: "mt-3 w-full",
        })}
      >
        {t("notifications")}
      </Link>
      <div className="mt-6 flex items-center justify-between border-t pt-6">
        <span className="text-sm text-muted-foreground">{t("language")}</span>
        <LanguageSwitcher />
      </div>
    </main>
  );
}
