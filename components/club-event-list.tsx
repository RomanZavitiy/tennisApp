import { getFormatter } from "next-intl/server";
import type { ReactNode } from "react";

import type { ClubEventItem } from "@/lib/clubs/club-events";

// Club news, newest first (slice PD5, task PD5.1): on a club's page, and in
// the staff panel where each item gets a delete button (`actionFor`).
export async function ClubEventList({
  events,
  actionFor,
}: {
  events: ClubEventItem[];
  actionFor?: (event: ClubEventItem) => ReactNode;
}) {
  const format = await getFormatter();
  return (
    <ul className="mt-2 space-y-4">
      {events.map((event) => (
        <li key={event.id}>
          <p className="text-xs text-muted-foreground">
            {format.dateTime(event.createdAt, {
              day: "numeric",
              month: "long",
              timeZone: "Europe/Warsaw",
            })}
          </p>
          <h3 className="font-medium">{event.title}</h3>
          <p className="mt-1 text-sm whitespace-pre-line">{event.body}</p>
          {actionFor?.(event)}
        </li>
      ))}
    </ul>
  );
}
