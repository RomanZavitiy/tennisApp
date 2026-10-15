import { getTranslations } from "next-intl/server";

import { MessageThread } from "@/components/message-thread";
import { getJoinThread } from "@/lib/messages/thread-data";

// Wraps a join's private thread (3.17) in a disclosure, so a page with
// several requests doesn't show every conversation open at once. Loads its
// own data: getJoinThread (lib/messages/thread-data.ts) is the only thing
// standing between this query and someone else's conversation, same as
// every other Prisma read on this page.
export async function JoinThread({
  offerJoinId,
  viewerId,
  senderNames,
  defaultOpen = false,
}: {
  offerJoinId: string;
  viewerId: string;
  senderNames: Record<string, string>;
  defaultOpen?: boolean;
}) {
  const thread = await getJoinThread(offerJoinId, viewerId);
  if (!thread) {
    return null;
  }
  const t = await getTranslations("JoinThread");

  return (
    <details open={defaultOpen} className="mt-2">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        {t("messages")}
      </summary>
      <div className="mt-2">
        <MessageThread
          offerJoinId={offerJoinId}
          viewerId={viewerId}
          senderNames={senderNames}
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
    </details>
  );
}
