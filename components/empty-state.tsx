import type { ReactNode } from "react";

import { IconTile } from "@/components/icon-tile";

// What a list shows when it has nothing to show (redesign): a dashed card
// with an icon instead of a lone grey sentence on an empty page.
export function EmptyState({
  icon,
  children,
  action,
}: {
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <IconTile tone="ball" className="size-12 rounded-xl [&_svg]:size-5">
        {icon}
      </IconTile>
      <p className="max-w-md text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
