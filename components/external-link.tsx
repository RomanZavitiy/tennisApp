import type { ReactNode } from "react";

// A link to a site outside the app (e.g. a club's own booking page, task
// 2.8/3.13). noopener: the new page gets no handle on this one; noreferrer:
// the destination doesn't learn which page sent the player.
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "underline-offset-4 hover:underline"}
    >
      {children}
    </a>
  );
}
