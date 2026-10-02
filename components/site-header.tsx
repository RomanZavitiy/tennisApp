import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { buttonVariants } from "@/components/ui/button";

// Routes match the ones later tasks build: /offers (Epic 3), /clubs (2.6),
// /login (1.6). "Profile" replaces "Sign in" once auth lands in Epic 1.
const NAV_LINKS = [
  { href: "/offers", label: "Sparring" },
  { href: "/clubs", label: "Courts" },
];

const SIGN_IN = { href: "/login", label: "Sign in" };

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          MatchFinder Kraków
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: "ghost" })}
            >
              {link.label}
            </Link>
          ))}
          <Link href={SIGN_IN.href} className={buttonVariants()}>
            {SIGN_IN.label}
          </Link>
        </nav>

        <MobileNav links={[...NAV_LINKS, SIGN_IN]} />
      </div>
    </header>
  );
}
