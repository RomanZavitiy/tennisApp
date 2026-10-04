import type { Metadata } from "next";
import Link from "next/link";

import { AvatarUpload } from "@/components/avatar-upload";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFacts } from "@/components/player-facts";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ageOn, todayInKrakow } from "@/lib/validation/profile";

export const metadata: Metadata = { title: "Your profile" };

// The player's own profile with their photo; the other fields are edited on
// /profile/edit. The birth date stays private: only the age is shown.
export default async function ProfilePage() {
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
        Edit profile
      </Link>
    </main>
  );
}
