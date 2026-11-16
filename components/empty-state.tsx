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
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed bg-card/60 px-6 py-16 text-center">
      <IconTile tone="ball" className="size-14 rounded-2xl [&_svg]:size-6">
        {icon}
      </IconTile>
      <p className="max-w-md text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
