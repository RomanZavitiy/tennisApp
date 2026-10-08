"use client";

import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

type View = "list" | "map";

// Lays out the club list and the map: side by side on desktop, one at a time
// with a List/Map switch on phones. Both are rendered on the server and come
// in as slots; this component only decides which one a phone shows.
export function ClubsView({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<View>("list");

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-2 lg:hidden">
        <ViewButton view="list" current={view} onSelect={setView}>
          List
        </ViewButton>
        <ViewButton view="map" current={view} onSelect={setView}>
          Map
        </ViewButton>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Hidden with CSS, not unmounted: the map keeps its position and the
            list its scroll when a phone switches back and forth. */}
        <div
          className={cn(
            "lg:block lg:h-[32rem] lg:overflow-y-auto",
            view === "list" ? "block" : "hidden",
          )}
        >
          {list}
        </div>
        <div
          className={cn(
            "h-[28rem] lg:block lg:h-[32rem]",
            view === "map" ? "block" : "hidden",
          )}
        >
          {map}
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  view,
  current,
  onSelect,
  children,
}: {
  view: View;
  current: View;
  onSelect: (view: View) => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant={view === current ? "default" : "outline"}
      aria-pressed={view === current}
      onClick={() => {
        onSelect(view);
      }}
    >
      {children}
    </Button>
  );
}
