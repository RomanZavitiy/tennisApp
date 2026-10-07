"use client";

import dynamic from "next/dynamic";

import type { ClubMapProps } from "./club-map";

export type { ClubMapMarker, ClubMapProps } from "./club-map";

// The map is browser-only (Leaflet needs `window` at import time), so it is
// loaded with SSR off. Next 16 allows `ssr: false` only in Client Components,
// hence this wrapper: Server Components render <ClubMap> from here and pass
// the club data as props.
const ClubMapClient = dynamic(() => import("./club-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

// `className` sizes the map: it needs an explicit height to render at all.
export function ClubMap({
  className,
  ...props
}: ClubMapProps & { className?: string }) {
  return (
    <div className={className}>
      <ClubMapClient {...props} />
    </div>
  );
}
