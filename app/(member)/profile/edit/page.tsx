import type { Metadata } from "next";
import Link from "next/link";

import { updateProfile } from "@/app/(member)/profile/actions";
import { ProfileForm } from "@/components/profile-form";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

export const metadata: Metadata = { title: "Edit profile" };

// The onboarding form again, filled in with the current profile. The photo is
// changed on /profile itself.
export default async function EditProfilePage() {
  const profile = await requireOnboardedUser();

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>
      <div className="mt-6">
        <ProfileForm
          action={updateProfile}
          submitLabel="Save changes"
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
        Cancel
      </Link>
    </main>
  );
}
