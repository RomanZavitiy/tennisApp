import { notFound } from "next/navigation";
import { cache } from "react";

import { getCurrentUser, type SessionUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";

// /admin (task 6.1): a signed-out visitor and a signed-in player without
// isAdmin look identical — both get a plain 404, never a redirect to
// /login, so the route's existence isn't revealed by the difference. That's
// also why /admin is in the proxy's PUBLIC_ROUTES (lib/auth/routes.ts): the
// proxy would otherwise redirect a signed-out visitor to /login before this
// ever runs, which *would* tell them apart from a signed-in non-admin.
// notFound() works the same way inside a Server Action as in a page (both
// throw the digest Next's router renders as the not-found boundary), so
// every admin server action calls this too, not just the layout — "кожна
// server action адмінки сама перевіряє роль" (6.2's own DoD).
export const requireAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getCurrentUser();
  const row = user
    ? await db.user.findUnique({
        where: { id: user.id },
        select: { isAdmin: true },
      })
    : null;

  if (!user || !row?.isAdmin) {
    notFound();
  }
  return user;
});
