import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { FollowClubButton } from "@/components/follow-club-button";
import { MessageThread } from "@/components/message-thread";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { getClub, getClubFollowInfo } from "@/lib/clubs/club-details";
import { getClubThread } from "@/lib/messages/thread-data";

// A club's chat, its own route rather than a section of /clubs/[id] (task
// O.13): that page is already 166 lines, and this needs its own data load
// (getClubThread) and its own "not a follower" branch. requireOnboardedUser
// first, same as every other thread page — signed-out viewers never get
// this far.

type ClubChatPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: ClubChatPageProps): Promise<Metadata> {
  const t = await getTranslations("ClubChatPage");
  const club = await getClub((await params).id);
  return { title: club ? t("title", { club: club.name }) : t("notFound") };
}

export default async function ClubChatPage({ params }: ClubChatPageProps) {
  // Chat content changes all the time; never serve a cached page.
  await connection();
  const { id } = await params;
  const club = await getClub(id);
  if (!club) {
    notFound();
  }

  const viewer = await requireOnboardedUser();
  const t = await getTranslations("ClubChatPage");
  const [thread, followInfo] = await Promise.all([
    getClubThread(club.id, viewer.id),
    getClubFollowInfo(club.id, viewer.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <Link
        href={`/clubs/${club.id}`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("backToClub")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {t("title", { club: club.name })}
      </h1>

      {thread ? (
        <div className="mt-6">
          <MessageThread
            thread={{ kind: "club", id: club.id }}
            viewerId={viewer.id}
            senderNames={thread.senderNames}
            initialMessages={thread.messages.map((message) => ({
              id: message.id,
              type: message.type,
              content: message.content,
              senderId: message.senderId,
              createdAt: message.createdAt.toISOString(),
            }))}
            writable={thread.writable}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("followToJoinChat")}
          </p>
          <FollowClubButton
            clubId={club.id}
            initialFollowing={false}
            initialFollowerCount={followInfo.followerCount}
          />
        </div>
      )}
    </main>
  );
}
