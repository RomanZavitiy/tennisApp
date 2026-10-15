import { NextResponse, type NextRequest } from "next/server";

import { runNotificationReminders } from "@/lib/notifications/reminders";
import { autoConfirmExpiredResults } from "@/lib/rating/auto-confirm";

// The cron endpoint (task 5.8), now two jobs behind the same route and the
// same secret (decision 2026-10-15, "Cron"): the default action auto-
// confirms PENDING results past their 72h deadline (4.7), once a day
// (vercel.json); `?job=reminders` sends the time-based pushes (5.10, 5.16:
// match reminders, "how did it go?", confirm-result nudges), hourly — a
// GitHub Actions `schedule` workflow calls it, the same way Vercel Cron
// Jobs call the default action, both with `Authorization: Bearer
// $CRON_SECRET`. Anyone else gets 401, including a request with no header
// at all or the wrong secret. A GET, not a POST: that's what both callers
// send, and it's also the easiest to trigger by hand locally (see README)
// without a body.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.nextUrl.searchParams.get("job") === "reminders") {
    const sent = await runNotificationReminders();
    return NextResponse.json(sent);
  }

  const autoConfirmed = await autoConfirmExpiredResults();
  return NextResponse.json({ autoConfirmed });
}
