"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useClubSelection } from "@/components/club-selection";
import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { cn } from "cn";

export type ClubListItem = {
  id: string;
  name: string;
  address: string;
  district: District | null;
};

// The clubs next to the map on /clubs. Clicking a club shows it on the map
// (2.7); "Details" leads to the club's page.
export function ClubList({ clubs }: { clubs: ClubListItem[] }) {
  const clubSelection = useClubSelection();

  if (clubs.length === 0) {
    return <p className="text-muted-foreground">No clubs yet.</p>;
  }

  const selection = clubSelection?.selection;
  return (
    <ul className="divide-y rounded-lg border">
      {clubs.map((club) => (
        <ClubListEntry
          key={club.id}
          club={club}
          selected={selection?.id === club.id}
          // Scroll only for a marker click: a club clicked here is in view.
          scrollIntoView={selection?.id === club.id && selection.from === "map"}
          onSelect={() => clubSelection?.select(club.id, "list")}
        />
      ))}
    </ul>
  );
}

function ClubListEntry({
  club,
  selected,
  scrollIntoView,
  onSelect,
}: {
  club: ClubListItem;
  selected: boolean;
  scrollIntoView: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    // "nearest" scrolls the list box just enough and leaves the page alone
    // when the club is already in view.
    if (scrollIntoView) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [scrollIntoView]);

  return (
    <li
      ref={ref}
      className={cn("flex items-start gap-3 px-4 py-3", selected && "bg-muted")}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block font-medium">{club.name}</span>
        <span className="block text-sm text-muted-foreground">
          {club.address}
        </span>
        {club.district && (
          <span className="block text-sm text-muted-foreground">
            {DISTRICT_LABELS[club.district]}
          </span>
        )}
      </button>
      <Link
        href={`/clubs/${club.id}`}
        aria-label={`${club.name} details`}
        className="shrink-0 text-sm underline-offset-4 hover:underline"
      >
        Details
      </Link>
    </li>
  );
}
