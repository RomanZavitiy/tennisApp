import type { Metadata } from "next";

import { confirmUnsubscribe } from "@/app/unsubscribe/actions";
import { UnsubscribeButton } from "@/components/unsubscribe-button";
import { verifyUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";

export const metadata: Metadata = { title: "Unsubscribe" };

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

// The no-login link from a fallback email (task 5.3). Checking the token
// here only decides what to show — turning the setting off waits for the
// explicit click below (confirmUnsubscribe), so an email client or scanner
// prefetching this URL can't silently unsubscribe someone.
export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;
  const valid =
    typeof token === "string" && verifyUnsubscribeToken(token) !== null;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Email notifications
      </h1>
      {valid ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Turn off email notifications for MatchFinder? You can turn them back
            on any time from your notification settings.
          </p>
          <div className="mt-6">
            <UnsubscribeButton action={confirmUnsubscribe.bind(null, token)} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          This link isn’t valid. You can manage email notifications from your
          notification settings while signed in instead.
        </p>
      )}
    </main>
  );
}
