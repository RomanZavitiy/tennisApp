import { NextResponse, type NextRequest } from "next/server";

import { autoConfirmExpiredResults } from "@/lib/rating/auto-confirm";

// The cron endpoint (task 5.8): today, auto-confirming PENDING results past
// their 72h deadline (4.7); session 07 (5.10) adds reminders behind the
// same route. Vercel's own Cron Jobs call this with `Authorization: Bearer
// $CRON_SECRET` (set in Vercel's env, decision below) — anyone else gets
// 401, including a request with no header at all or the wrong secret. A
// GET, not a POST: that's what Vercel Cron Jobs send, and it's also the
// easiest to trigger by hand locally (see README) without a body.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const autoConfirmed = await autoConfirmExpiredResults();
  return NextResponse.json({ autoConfirmed });
}
