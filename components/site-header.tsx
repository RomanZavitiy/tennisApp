import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { HeaderNavLinks } from "@/components/header-nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { PushSubscribePrompt } from "@/components/push-subscribe-prompt";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { countUnreadNotifications } from "@/lib/notifications/inbox";

// Reading the session here makes every page render per request instead of
// being prerendered: the header differs for signed-in users on every page.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await countUnreadNotifications(user.id) : 0;
  const t = await getTranslations("SiteHeader");
  const tMetadata = await getTranslations("Metadata");

  // Courts first (slice K4): the court search is the home page now, and a
  // club's own page (/clubs/[id]) still counts as that section.
  // Signed-in players also get Profile.
  const navLinks = [
    { href: "/", label: t("courts"), section: "/clubs" },
    { href: "/offers", label: t("sparring") },
  ];
  const signIn = { href: "/login", label: t("signIn") };
  const profile = { href: "/profile", label: t("profile") };
  const links = user ? [...navLinks, profile] : navLinks;

  return (
    <>
      {/* Above the header on every page, not just (member) ones: /offers/[id]
          (where "Ask to join" lives) is public. Signed-in only — its trigger
          is a localStorage flag that outlives sign-out, and a visitor has no
          account to save a subscription to. */}
      {user && <PushSubscribePrompt />}
      <header className="sticky top-0 z-40 border-b bg-card/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <BallMark />
            {tMetadata("siteName")}
          </Link>

          <div className="flex items-center gap-1">
            <nav
              aria-label={t("mainNav")}
              className="hidden items-center gap-1 sm:flex"
            >
              <HeaderNavLinks links={links} />
              {user ? (
                <form action={signOut}>
                  <Button type="submit" variant="outline">
                    {t("signOut")}
                  </Button>
                </form>
              ) : (
                <Link href={signIn.href} className={buttonVariants()}>
                  {signIn.label}
                </Link>
              )}
            </nav>

            {/* One bell for both layouts, so only one copy polls. */}
            {user && <NotificationBell initialCount={unread} />}

            <MobileNav
              links={user ? links : [...links, signIn]}
              signedIn={Boolean(user)}
            />
          </div>
        </div>
      </header>
    </>
  );
}

/** The logo mark (slice K3): a tennis ball in the palette's highlight colour. */
function BallMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className="size-8 shrink-0 rounded-full bg-highlight text-highlight-foreground"
    >
      <path
        d="M6 6.5c4.5 4 4.5 15 0 19M26 6.5c-4.5 4-4.5 15 0 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
