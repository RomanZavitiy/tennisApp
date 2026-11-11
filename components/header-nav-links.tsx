"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

/** Whether `pathname` is inside the section a link names (/offers/123 is
 * still "Sparring", /clubs/123 is still "Courts"). */
function isActive(pathname: string, { href }: NavLink): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The desktop header links (slice K3), marking the section the player is in.
// A client component only for usePathname: the header itself stays a server
// component.
export function HeaderNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return links.map((link) => {
    const active = isActive(pathname, link);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          active && "bg-secondary text-secondary-foreground hover:bg-secondary",
        )}
      >
        {link.label}
      </Link>
    );
  });
}
