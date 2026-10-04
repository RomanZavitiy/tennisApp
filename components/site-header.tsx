import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { MobileNav } from "@/components/mobile-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";

// Routes match the ones later tasks build: /offers (Epic 3), /clubs (2.6),
// /login (1.6). Signed-in players also get Profile.
const NAV_LINKS = [
  { href: "/offers", label: "Sparring" },
  { href: "/clubs", label: "Courts" },
];

const SIGN_IN = { href: "/login", label: "Sign in" };
const PROFILE = { href: "/profile", label: "Profile" };

// Reading the session here makes every page render per request instead of
// being prerendered: the header differs for signed-in users on every page.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const links = user ? [...NAV_LINKS, PROFILE] : NAV_LINKS;

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          MatchFinder Kraków
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
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
                Sign out
              </Button>
            </form>
          ) : (
            <Link href={SIGN_IN.href} className={buttonVariants()}>
              {SIGN_IN.label}
            </Link>
          )}
        </nav>

        <MobileNav
          links={user ? links : [...links, SIGN_IN]}
          signedIn={Boolean(user)}
        />
      </div>
    </header>
  );
}
