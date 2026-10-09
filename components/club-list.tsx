import Link from "next/link";

import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";

export type ClubListItem = {
  id: string;
  name: string;
  address: string;
  district: District | null;
};

// The clubs next to the map on /clubs; each name links to the club's page.
export function ClubList({ clubs }: { clubs: ClubListItem[] }) {
  if (clubs.length === 0) {
    return <p className="text-muted-foreground">No clubs yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {clubs.map((club) => (
        <li key={club.id} className="px-4 py-3">
          <Link
            href={`/clubs/${club.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {club.name}
          </Link>
          <p className="text-sm text-muted-foreground">{club.address}</p>
          {club.district && (
            <p className="text-sm text-muted-foreground">
              {DISTRICT_LABELS[club.district]}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
