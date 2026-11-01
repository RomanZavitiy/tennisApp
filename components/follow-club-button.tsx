"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";

import { followClub, unfollowClub } from "@/app/clubs/[id]/follow-actions";
import { Button } from "@/components/ui/button";

// The follow toggle on a club's page (task O.5): optimistic, since the only
// way it can fail server-side is a race the player can't do anything about
// (the club got deleted under them) -- not worth a pending spinner state.
export function FollowClubButton({
  clubId,
  initialFollowing,
  initialFollowerCount,
}: {
  clubId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const t = useTranslations("FollowClubButton");
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !following;
    setFollowing(next);
    setFollowerCount((count) => count + (next ? 1 : -1));
    setError(null);
    startTransition(async () => {
      const result = next
        ? await followClub(clubId)
        : await unfollowClub(clubId);
      if (!result.ok) {
        // Roll back the optimistic update -- the only failure modes are
        // "not onboarded" (redirected before this ever returns) or a real
        // refusal (blocked, club gone), both worth surfacing.
        setFollowing(!next);
        setFollowerCount((count) => count - (next ? 1 : -1));
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={following ? "outline" : "default"}
        onClick={toggle}
      >
        {following ? t("following") : t("follow")}
      </Button>
      <p className="text-sm text-muted-foreground">
        {t("followerCount", { count: followerCount })}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Signed-out viewers see a sign-in link instead (task O.5), the club page's
// existing pattern (see app/offers/[id]/page.tsx's "signInToJoin").
export function SignInToFollowLink({ clubId }: { clubId: string }) {
  const t = useTranslations("FollowClubButton");
  return (
    <Link
      href={`/login?next=${encodeURIComponent(`/clubs/${clubId}`)}`}
      className="text-sm underline-offset-4 hover:underline"
    >
      {t("signInToFollow")}
    </Link>
  );
}
