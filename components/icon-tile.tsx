import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A small tinted square that holds an icon (UI refresh): the colour shows up
// in a little dose next to the content instead of across whole surfaces.
const TONES = {
  green:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/10 dark:text-emerald-400",
  ball: "bg-highlight/40 text-highlight-foreground ring-lime-600/15",
  blue: "bg-sky-500/10 text-sky-700 ring-sky-600/10 dark:text-sky-400",
  violet:
    "bg-violet-500/10 text-violet-700 ring-violet-600/10 dark:text-violet-400",
  orange:
    "bg-orange-500/10 text-orange-700 ring-orange-600/10 dark:text-orange-400",
} as const;

export type IconTileTone = keyof typeof TONES;

export function IconTile({
  tone = "green",
  className,
  children,
}: {
  tone?: IconTileTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset [&_svg:not([class*='size-'])]:size-4",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
