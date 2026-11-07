import type { AchievementId } from "@/lib/achievements/achievements";

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
  club_followed: Record<string, never>;
  club_unfollowed: Record<string, never>;
  club_message_sent: Record<string, never>;
  invite_sent: { source: InviteSource };
  invite_accepted: Record<string, never>;
  invite_declined: Record<string, never>;
  invite_expired: Record<string, never>;
  candidates_viewed: { count: number };
  candidate_invited: { rank: number };
  waitlist_joined: Record<string, never>;
  waitlist_spot_offered: Record<string, never>;
  waitlist_spot_taken: Record<string, never>;
  waitlist_spot_passed: Record<string, never>;
  intent_posted: Record<string, never>;
  intent_invited: Record<string, never>;
  intent_converted: Record<string, never>;
  play_today_viewed: Record<string, never>;
  play_today_result_selected: Record<string, never>;
  play_today_empty_state: Record<string, never>;
  feedback_given: { count: number };
  achievement_unlocked: { id: AchievementId };
};

// Where "Invite to game" (slice S1) was clicked from. "playAgain" is Q.2's
// own trigger; "intent" is U2.3's "Invite to my game" on a PlayIntent card.
export type InviteSource =
  "profile" | "leaderboard" | "candidates" | "playAgain" | "intent";

export type AnalyticsEvent = keyof EventProperties;

export type PropertiesFor<E extends AnalyticsEvent> = EventProperties[E];
