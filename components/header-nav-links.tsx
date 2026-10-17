"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  /** Another path prefix that belongs to this link's section. */
  section?: string;
};

/** Whether `pathname` is inside the section a link names (/offers/123 is
 * still "Sparring", /clubs/123 is "Courts" though Courts links to "/"). */
function isActive(pathname: string, { href, section }: NavLink): boolean {
  if (pathname === href) return true;
  return [href, section].some(
    (prefix) => prefix && prefix !== "/" && pathname.startsWith(`${prefix}/`),
  );
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
