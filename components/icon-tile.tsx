import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A small solid block that holds an icon (redesign): one loud colour per
// tile, flat — no tint, no ring.
const TONES = {
  green: "bg-brand text-highlight",
  ball: "bg-highlight text-highlight-foreground",
  blue: "bg-sky-300 text-sky-950",
  violet: "bg-violet-300 text-violet-950",
  orange: "bg-orange-300 text-orange-950",
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
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg:not([class*='size-'])]:size-4",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
