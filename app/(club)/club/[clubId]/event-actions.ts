"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireClubStaff } from "@/lib/auth/require-club-staff";
import { canPostClubEvent } from "@/lib/clubs/club-events";
import { db } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features";
import { notifyClubFollowers } from "@/lib/notifications/club-event-notify";
import { clubEventSchema } from "@/lib/validation/club-event";

import type { ClubPanelActionResult } from "./actions";

// Club news from the club panel (slice PD5, task PD5.1): post and remove.
// Both check the staff role themselves — the panel's own 404 is only the
// first gate (K.17's rule) — and both refuse while the `clubChat` flag is
// off: news goes to followers, and following exists only with that flag.

function revalidateClubPages(clubId: string): void {
  revalidatePath(`/club/${clubId}`);
  revalidatePath(`/clubs/${clubId}`);
}

export async function postClubEvent(
  clubId: unknown,
  input: unknown,
): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  if (!isFeatureEnabled("clubChat")) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }
  const id = z.uuid().safeParse(clubId);
  if (!id.success) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }
  const staff = await requireClubStaff(id.data);

  const tValidation = await getTranslations("Validation.clubEvent");
  const parsed = clubEventSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }

  const club = await db.club.findUnique({
    where: { id: id.data },
    select: { id: true, name: true },
  });
  if (!club) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }
  if (!(await canPostClubEvent(club.id))) {
    return { ok: false, message: tValidation("tooManyToday") };
  }

  await db.clubEvent.create({
    data: {
      clubId: club.id,
      authorId: staff.id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
  });
  const notified = await notifyClubFollowers({
    clubId: club.id,
    clubName: club.name,
    title: parsed.data.title,
    body: parsed.data.body,
    authorId: staff.id,
  });
  await captureEvent("club_event_posted", staff.id, {
    followers_notified: notified.length,
  });

  revalidateClubPages(club.id);
  return { ok: true };
}

/** Takes no reason — binds into AdminActionForm like removeBlock. */
export async function deleteClubEvent(
  eventId: unknown,
): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  if (!isFeatureEnabled("clubChat")) {
    return { ok: false, message: tErrors("clubEventNotFound") };
  }
  const id = z.uuid().safeParse(eventId);
  if (!id.success) {
    return { ok: false, message: tErrors("clubEventNotFound") };
  }
  const event = await db.clubEvent.findUnique({
    where: { id: id.data },
    select: { id: true, clubId: true },
  });
  if (!event) {
    return { ok: false, message: tErrors("clubEventNotFound") };
  }
  await requireClubStaff(event.clubId);

  await db.clubEvent.delete({ where: { id: event.id } });
  revalidateClubPages(event.clubId);
  return { ok: true };
}
