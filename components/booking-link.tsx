"use client";

import type { ReactNode } from "react";

import { recordOutboundClick } from "@/app/clubs/actions";
import { addUtmSource } from "@/lib/tracking/utm";

// The one "book this court" action, on a club's page and an offer's page
// (task 2.13): the club's own booking link when it has one, else a phone
// call — never both, and nothing at all for a club with neither (2.11).
// Every click is logged (fire-and-forget: the `.catch` only keeps a failed
// write from surfacing as a console error, it never blocks the navigation
// the browser is already doing) and, for a signed-in viewer, attributed to
// them; it still works for a guest, just unattributed.
export function BookingLink({
  clubId,
  offerId,
  bookingUrl,
  phone,
  className,
  urlLabel,
  phoneLabel,
  onClick,
}: {
  clubId: string;
  offerId?: string;
  bookingUrl: string | null;
  phone: string | null;
  className?: string;
  urlLabel: ReactNode;
  phoneLabel: ReactNode;
  /** The offer page's "Booked the court?" banner (2.13) hooks in here. */
  onClick?: () => void;
}) {
  function track(target: "URL" | "PHONE") {
    recordOutboundClick({ clubId, offerId, target }).catch(() => undefined);
    onClick?.();
  }

  if (bookingUrl) {
    return (
      <a
        href={addUtmSource(bookingUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => {
          track("URL");
        }}
      >
        {urlLabel}
      </a>
    );
  }
  if (phone) {
    return (
      <a
        href={`tel:${phone.replaceAll(" ", "")}`}
        className={className}
        onClick={() => {
          track("PHONE");
        }}
      >
        {phoneLabel}
      </a>
    );
  }
  return null;
}
