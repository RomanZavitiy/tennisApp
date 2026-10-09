"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
  type ClubSelection,
  ClubSelectionContext,
  type ClubSelectionContextValue,
} from "@/components/club-selection";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type View = "list" | "map";

// Lays out the club list and the map: side by side on desktop, one at a time
// with a List/Map switch on phones. Both get their data from the server page
// and come in as slots; this component decides which one a phone shows and holds the
// selected club both of them follow (2.7).
export function ClubsView({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<View>("list");
  const [selection, setSelection] = useState<ClubSelection>(null);

  const selectionContext = useMemo<ClubSelectionContextValue>(
    () => ({
      selection,
      select: (id, from) => {
        setSelection({ id, from });
        // On a phone the map is hidden behind the switch; show it.
        if (from === "list") setView("map");
      },
      clear: (id) => {
        setSelection((current) => (current?.id === id ? null : current));
      },
    }),
    [selection],
  );

  return (
    <ClubSelectionContext value={selectionContext}>
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
    </ClubSelectionContext>
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
