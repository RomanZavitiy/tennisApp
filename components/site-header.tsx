import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
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

  // Routes match the ones later tasks build: /offers (Epic 3), /clubs (2.6),
  // /login (1.6). Signed-in players also get Profile.
  const navLinks = [
    { href: "/offers", label: t("sparring") },
    { href: "/clubs", label: t("courts") },
  ];
  const signIn = { href: "/login", label: t("signIn") };
  const profile = { href: "/profile", label: t("profile") };
  const links = user ? [...navLinks, profile] : navLinks;

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {tMetadata("siteName")}
        </Link>

        <div className="flex items-center gap-1">
          <nav
            aria-label={t("mainNav")}
            className="hidden items-center gap-1 sm:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={buttonVariants({ variant: "ghost" })}
              >
                {link.label}
              </Link>
            ))}
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
  );
}
