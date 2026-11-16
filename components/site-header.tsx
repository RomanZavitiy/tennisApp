import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { HeaderNavLinks } from "@/components/header-nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { PushSubscribePrompt } from "@/components/push-subscribe-prompt";
import { SiteLogo } from "@/components/site-logo";
import { SportSwitcher } from "@/components/sport-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { visibleLinks } from "@/lib/features";
import { countUnreadNotifications } from "@/lib/notifications/inbox";
import { getCurrentSport } from "@/lib/sport/current-sport";

// Reading the session here makes every page render per request instead of
// being prerendered: the header differs for signed-in users on every page.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await countUnreadNotifications(user.id) : 0;
  const sport = await getCurrentSport();
  const t = await getTranslations("SiteHeader");
  const tMetadata = await getTranslations("Metadata");

  // The court search lives at /clubs again (redesign): "/" is the landing
  // page, reached through the logo. Signed-in players also get Profile.
  // Sections switched off in lib/features.ts drop out of both the desktop
  // links and the mobile menu, which share this list.
  const navLinks = visibleLinks([
    { href: "/offers", label: t("sparring") },
    { href: "/clubs", label: t("courts") },
    { href: "/leaderboard", label: t("leaderboard") },
    { href: "/coaches", label: t("coaches") },
  ]);
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
      {/* A floating pill (redesign): the bar hovers over the page instead
          of closing it off with a full-width line. */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 rounded-full border bg-card/85 pr-2 pl-4 shadow-sm backdrop-blur-lg backdrop-saturate-150 sm:pl-5">
          <Link href="/" className="flex shrink-0 items-center">
            {/* The wordmark is part of the image, so the site name is its alt
                text: the link keeps the same accessible name as before. */}
            <SiteLogo alt={tMetadata("siteName")} priority className="h-9" />
          </Link>

          {/* Tennis or padel (slice PD1): on every screen size, next to
              the logo, because it changes what every list shows. */}
          <SportSwitcher sport={sport} />

          <div className="flex items-center gap-1">
            <nav
              aria-label={t("mainNav")}
              className="hidden items-center gap-1 md:flex"
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

            <ThemeSwitcher className="hidden md:inline-flex" />

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
