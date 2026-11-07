"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import {
  submitMatchFeedback,
  type SubmitFeedbackRefusal,
} from "@/lib/feedback/match-feedback";
import { matchFeedbackSchema } from "@/lib/validation/match-feedback";

export type FeedbackResult = { ok: true } | { ok: false; message: string };

/**
 * "Rate your opponent" (task W.1), submitted from the profile's "My games"
 * prompt or inline on a confirmed match in history. The rules live in
 * lib/feedback/match-feedback.ts; this only validates the request and maps
 * a refusal to a translated message, same shape as submitResult (4.6).
 */
export async function submitFeedback(
  matchResultId: unknown,
  input: unknown,
): Promise<FeedbackResult> {
  const user = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");
  const tRefusal = await getTranslations("SubmitFeedbackRefusal");

  const id = z.uuid().safeParse(matchResultId);
  const parsed = matchFeedbackSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { ok: false, message: tErrors("invalidRequest") };
  }

  const outcome = await submitMatchFeedback(id.data, user.id, parsed.data);
  if (!outcome.ok) {
    return {
      ok: false,
      message: tRefusal(outcome.refusal satisfies SubmitFeedbackRefusal),
    };
  }

  await captureEvent("feedback_given", user.id, {
    count: parsed.data.tags.length,
  });
  revalidatePath("/profile");
  return { ok: true };
}
