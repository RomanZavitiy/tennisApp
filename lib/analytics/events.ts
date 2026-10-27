// The product events task 6.5/6.6 and K.14 ask for. Each event's property type
// is the allowlist: no field here may carry an email, a name, or message/
// report text (decision 2026-10-14, "Аналітика: PostHog EU без cookie") —
// posthog.ts's sanitize() is a runtime backstop for the same rule, not the
// only guard against it.

export type OfferFormat = "SINGLES" | "DOUBLES";
export type OutboundTarget = "URL" | "PHONE";

type EventProperties = {
  signup_completed: Record<string, never>;
  offer_created: { format: OfferFormat; hasClub: boolean };
  join_requested: { format: OfferFormat };
  join_accepted: { format: OfferFormat };
  message_sent: Record<string, never>;
  booking_outbound_clicked: { target: OutboundTarget };
  court_marked_booked: Record<string, never>;
  result_confirmed: Record<string, never>;
  no_show_reported: Record<string, never>;
  push_enabled: Record<string, never>;
  booking_requested: Record<string, never>;
  booking_confirmed: Record<string, never>;
  booking_declined: Record<string, never>;
  booking_cancelled: Record<string, never>;
};

export type AnalyticsEvent = keyof EventProperties;

export type PropertiesFor<E extends AnalyticsEvent> = EventProperties[E];
