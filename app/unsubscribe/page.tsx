import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { confirmUnsubscribe } from "@/app/unsubscribe/actions";
import { UnsubscribeButton } from "@/components/unsubscribe-button";
import { verifyUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("UnsubscribePage");
  return { title: t("title") };
}

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
  const t = await getTranslations("UnsubscribePage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      {valid ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("confirmPrompt")}
          </p>
          <div className="mt-6">
            <UnsubscribeButton action={confirmUnsubscribe.bind(null, token)} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("invalidLinkLong")}
        </p>
      )}
    </main>
  );
}
